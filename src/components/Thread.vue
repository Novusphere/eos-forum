<template>
  <div> 
    <PostHistoryModal ref="historyModal"></PostHistoryModal>
    <SubmitPostModal ref="submitModal" :sub="mainPost.data.json_metadata.sub" :postContentCallback="postContent" :replyUuid="mainPost.data.post_uuid" :replyAccount="mainPost.data.poster"></SubmitPostModal>
    <HeaderSection>
      <span class="title mr-3"><router-link :to="'/e/' + mainPost.data.json_metadata.sub">{{ mainPost.data.json_metadata.sub }}</router-link></span>          
    </HeaderSection>
    <MainSection>
      <div class="thread">
        <Post :submitModal="$refs.submitModal"
          :historyModal="$refs.historyModal"
          :post="mainPost" 
          :showContent="true" 
          v-bind="mainPost">
        </Post>
      </div>
    </MainSection>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { GetEOS, ScatterConfig, ScatterEosOptions } from '../eos'
import { MigratePost, PlaceholderPost, ApplyPostEdit } from '../migrations'
import { storage, SaveStorage } from "../storage"
import { v4 as uuidv4 } from "uuid"
import jQuery from "jquery"

import SubmitPostModal from './SubmitPostModal.vue'
import PostHistoryModal from './PostHistoryModal.vue'
import Post from "./Post.vue"
import HeaderSection from './HeaderSection'
import MainSection from './MainSection'

export default {
  name: "Thread",
  components: {
    'SubmitPostModal': SubmitPostModal,
    'PostHistoryModal': PostHistoryModal,
    'Post': Post,
    'HeaderSection': HeaderSection,
    'MainSection': MainSection
  },
  watch: {
    '$route.params.id': function () {
      this.load();
    },
    '$route.params.child_id': function() {
      this.load();
    }
  },
  mounted: function() {
    this.load();
  },
  methods: {
    load: async function() {
      var novusphere = GetNovusphere();

      var mainPost = (await novusphere.api({
        'find': novusphere.config.collection,
        'maxTimeMS': 1000,
        'filter': {
          'transaction': this.$route.params.id
        }
      })).cursor.firstBatch[0];

      var responses = (await novusphere.api({
          'find': novusphere.config.collection,
          'maxTimeMS': 1000,
          'filter': {
            'data.reply_to_post_uuid': mainPost.data.post_uuid
          }
      })).cursor.firstBatch;

      responses.splice(0, 0, mainPost);

      // only count non-edits for new_posts length
      var new_posts = (responses.filter(r => !r.data.json_metadata.edit).length - 1);
      storage.new_posts[mainPost.data.post_uuid] = new_posts;
      SaveStorage();

      var commentMap = {};
      for (var i = 0; i < responses.length; i++) {
        var p = responses[i];
        MigratePost(p);
        
        p.thread_transaction = mainPost.transaction;
        commentMap[p.data.post_uuid] = p;

        if (i > 0) {
            p.parent = mainPost;

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

                  ApplyPostEdit(parent, p);
                }
            }
            else {
              p.depth = parent.depth + 1;
              parent.children.push(p);
            }
        }
      }

      // permalink child
      if (this.$route.params.child_id) {
        var childTxId = this.$route.params.child_id;
        var childPost = responses.find(p => p.transaction == childTxId);
        
        childPost.depth = 0;
        childPost.data.json_metadata.title = mainPost.data.json_metadata.title;
        this.mainPost = childPost;
      }
      else {
        this.mainPost = mainPost;
      }
    },
    postContent: function(txid) {
      this.load(); // reload thread
    }
  },
  data() {
    return {
      mainPost: PlaceholderPost(),
      post: { // for making a new post
        content: '',
      }
    };
  }
};
</script>