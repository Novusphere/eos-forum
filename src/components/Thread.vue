<template>
  <div> 
    <SubmitPostModal ref="submitModal" :sub="mainPost.data.json_metadata.sub" :postContentCallback="postContent" :replyUuid="mainPost.data.post_uuid" :replyAccount="mainPost.data.poster"></SubmitPostModal>
    <Header>
      <span class="sub"><router-link :to="'/e/' + mainPost.data.json_metadata.sub">{{ mainPost.data.json_metadata.sub }}</router-link></span>          
    </Header>
    <MainSection>
      <div class="thread">
        <Post :submitModal="$refs.submitModal" :post="mainPost" :showContent="true" v-bind="mainPost"></post>
      </div>
    </MainSection>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { GetEOS, ScatterConfig, ScatterEosOptions } from '../eos'
import { MigratePost } from '../migrations'
import { v4 as uuidv4 } from "uuid"
import jQuery from "jquery"

import Post from "./Post.vue"
import SubmitPostModal from './SubmitPostModal.vue'
import Header from './Header'
import MainSection from './MainSection'

export default {
  name: "Thread",
  components: {
    'Post': Post,
    'SubmitPostModal': SubmitPostModal,
    'Header': Header,
    'MainSection': MainSection
  },
  mounted: async function() {
    await this.loadThread();
  },
  methods: {
    loadThread: async function() {
      var novusphere = GetNovusphere();
      var apiResult = await novusphere.api({
        'find': novusphere.config.collection,
        'maxTimeMS': 1000,
        'filter': {
          'transaction': this.$route.params.id
        }
      });

      var mainPost = apiResult.cursor.firstBatch[0];

      apiResult = await novusphere.api({
          'find': novusphere.config.collection,
          'maxTimeMS': 1000,
          'filter': {
            'data.reply_to_post_uuid': mainPost.data.post_uuid
          }
      });

      var responses = apiResult.cursor.firstBatch;
      responses.splice(0, 0, mainPost);
      
      var commentMap = {};
      for (var i = 0; i < responses.length; i++) {
        var p = responses[i];
        MigratePost(p);
        
        commentMap[p.data.post_uuid] = p;

        if (i > 0) {
            var tree;
            var parent_uuid = p.data.json_metadata.parent_uuid;
            parent_uuid = (parent_uuid) ? parent_uuid : mainPost.data.post_uuid;

            var parent = commentMap[parent_uuid];

            // if this is is an edit, update parent content
            // check parent content isn't already newest
            // check that this post is actually by the person who made original post
            if (p.data.json_metadata.edit) { 
                if (p.data.poster == parent.data.poster &&
                    p.createdAt > parent.createdAt) {

                  var title = parent.data.json_metadata.title;

                  parent.data.content = p.data.content;
                  parent.data.json_metadata = p.data.json_metadata;
                  parent.data.json_metadata.title = title;
                  parent.createdAt = p.createdAt;
                  parent.transaction = p.transaction;
                }
            }
            else {
              p.depth = parent.depth + 1;
              parent.children.push(p);
            }
        }
      }

      //console.log(responses);
      //console.log(mainPost);
      this.$data.mainPost = mainPost;
    },
    postContent: function(txid) {
      this.loadThread(); // reload thread
    }
  },
  data() {
    return {
      mainPost: {
        children: [],
        data: {
          title: '',
          json_metadata: {
            'sub': 'novusphere'
          },
        }
      },
      post: { // for making a new post
        content: '',
      }
    };
  }
};
</script>