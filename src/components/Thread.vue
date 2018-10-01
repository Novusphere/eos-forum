<template>
  <div> 
    <PostHistoryModal ref="history_modal"></PostHistoryModal>
    <SubmitPostModal ref="submit_modal" :sub="mainPost.data.json_metadata.sub" :postContentCallback="postContent" :reply_uuid="mainPost.data.post_uuid" :reply_account="mainPost.data.poster"></SubmitPostModal>
    <HeaderSection :load="load">
      <span class="title mr-3"><router-link :to="'/e/' + mainPost.data.json_metadata.sub">{{ mainPost.data.json_metadata.sub }}</router-link></span>          
    </HeaderSection>
    <MainSection>
      <div class="thread">
        <Post :submit_modal="$refs.submit_modal"
          :history_modal="$refs.history_modal"
          :post="mainPost" 
          :show_content="true" 
          v-bind="mainPost">
        </Post>
      </div>
    </MainSection>
  </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import jQuery from "jquery";


import { GetEOS, ScatterConfig, ScatterEosOptions, GetScatterIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum"
import { MigratePost, PlaceholderPost, ApplyPostEdit } from "@/migrations";
import { storage, SaveStorage } from "@/storage";

import SubmitPostModal from "@/components/modal/SubmitPostModal";
import PostHistoryModal from "@/components/modal/PostHistoryModal";

import Post from "@/components/core/Post";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

export default {
  name: "Thread",
  components: {
    SubmitPostModal: SubmitPostModal,
    PostHistoryModal: PostHistoryModal,
    Post: Post,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  watch: {
    "$route.params.id": function() {
      this.load();
    },
    "$route.params.child_id": function() {
      this.load();
    }
  },
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      const novusphere = GetNovusphere();
      const identity = await GetScatterIdentity();

      var mainPost = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_thread(this.$route.params.id) },
          { $lookup: forum.lookup_post_state() },
          { $project: forum.project_post() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          { $project: forum.project_post_final(false, false) }
        ]
      })).cursor.firstBatch[0];

      var responses = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_thread_replies(mainPost.data.post_uuid) },
          { $lookup: forum.lookup_post_state() },
          { $project: forum.project_post() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          { $project: forum.project_post_final(false, false) }
        ]
      })).cursor.firstBatch;

      responses.splice(0, 0, mainPost);

      // only count non-edits for new_posts length
      var new_posts =
        responses.filter(r => !r.data.json_metadata.edit).length - 1;
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
          parent_uuid = parent_uuid ? parent_uuid : mainPost.data.post_uuid;

          var parent = commentMap[parent_uuid];

          // if this is is an edit, update parent content
          // check parent content isn't already newest
          // check that this post is actually by the person who made original post
          if (p.data.json_metadata.edit) {
            if (
              p.data.poster == parent.data.poster &&
              p.createdAt > parent.createdAt
            ) {
              ApplyPostEdit(parent, p);
            }
          } else {
            p.depth = parent.depth + 1;
            parent.children.push(p);
          }
        }
      }

      for (var i = 0; i < responses.length; i++) {
         responses[i].children.sort((a,b) => b.__score - a.__score);
      }

      // permalink child
      if (this.$route.params.child_id) {
        var childTxId = this.$route.params.child_id;
        var childPost = responses.find(p => p.transaction == childTxId);

        childPost.depth = 0;
        childPost.data.json_metadata.title = mainPost.data.json_metadata.title;
        this.mainPost = childPost;
      } else {
        this.mainPost = mainPost;
      }
    },
    postContent(txid) {
      this.load(); // reload thread
    }
  },
  data() {
    return {
      mainPost: PlaceholderPost(),
      post: {
        // for making a new post
        content: ""
      }
    };
  }
};
</script>