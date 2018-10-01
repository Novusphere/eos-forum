<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="postHistory">
        <div class="modal-dialog modal-full" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Post History</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
                <Post :post="mainPost" :show_content="true" v-bind="mainPost"></post>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal" v-on:click="resetPost()">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import { GetEOS, GetScatterIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { MigratePost, PlaceholderPost } from "@/migrations";

import Post from "@/components/core/Post";

export default {
  name: "PostHistoryModal",
  components: {
    Post: Post
  },
  async mounted() {
    //this.load();
  },
  methods: {
    resetPost() {
      // stop any attachments from playing, etc.
      this.mainPost = PlaceholderPost();
    },
    async load(txid) {
      const novusphere = GetNovusphere();
      const identity = await GetScatterIdentity();

      var mainPost = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          { $match: { transaction: txid } },
          { $lookup: forum.lookup_post_state()},
          { $project: forum.project_post() },
          { $lookup: forum.lookup_post_my_vote(identity.account) },
          { $project: forum.project_post_final(false, false) }
        ]
      })).cursor.firstBatch[0];

      var edits = (await novusphere.api({
        find: novusphere.config.collection,
        maxTimeMS: 1000,
        filter: forum.match_post_edits(mainPost.data.poster, mainPost.data.post_uuid),
        sort: forum.sort_by_time(true)
      })).cursor.firstBatch;

      for (var i = 0; i < edits.length; i++) {
        var p = edits[i];
        MigratePost(p);

        p.depth = 1;
        p.parent = mainPost;
        p.up = mainPost.up;
        p.my_vote = mainPost.my_vote;
      }

      MigratePost(mainPost);
      mainPost.children = edits;

      this.mainPost = mainPost;
    }
  },
  data() {
    return {
      mainPost: PlaceholderPost()
    };
  }
};
</script>
