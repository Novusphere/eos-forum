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
          :op="mainPost.data.poster" 
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

import {
  GetEOS,
  ScatterConfig,
  ScatterEosOptions,
  GetScatterIdentity
} from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
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
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          {
            $project: forum.project_post({
              normalize_up: true,
              normalize_my_vote: true
            })
          }
        ]
      })).cursor.firstBatch[0];

      await MigratePost(mainPost);

      var mp_np = storage.new_posts[mainPost.data.post_uuid];
      mainPost.__seen = (mp_np) ? mp_np.seen : ((new Date().getTime()) / 1000);

      var responses = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: forum.match_thread_replies(mainPost.data.post_uuid) },
          { $lookup: forum.lookup_post_state() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          {
            $project: forum.project_post({
              normalize_up: true,
              normalize_my_vote: true
            })
          }
        ]
      })).cursor.firstBatch;

      responses.splice(0, 0, mainPost);

      var commentMap = {};
      var new_posts = 0;
      for (var i = 0; i < responses.length; i++) {
        var p = responses[i];
        await MigratePost(p);

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
            new_posts++;
            p.depth = parent.depth + 1;
            parent.children.push(p);
          }
        }
      }

      for (var i = 0; i < responses.length; i++) {
        responses[i].children.sort((a, b) => b.__score - a.__score);
      }

      // only count non-edits for new_posts length
      storage.new_posts[mainPost.data.post_uuid] = {
        replies: new_posts,
        seen: new Date().getTime() / 1000
      };
      SaveStorage();

      // permalink child
      if (this.$route.params.child_id) {
        var childId = this.$route.params.child_id;
        var childPost;
        if (childId.length == 64) {
          childPost = responses.find(p => p.transaction == childTxId);
        } else {
          childId = parseInt(childId);
          childPost = responses.find(p => p.id == childId);
        }

        childPost.depth = 0;
        childPost.data.json_metadata.title = mainPost.data.json_metadata.title;

        function updateChildDepth(p) {
          for (var j = 0; j < p.children.length; j++) {
            var child = p.children[j];
            child.depth = p.depth + 1;
            updateChildDepth(child);
          }
          return p;
        }

        this.mainPost = updateChildDepth(childPost);
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