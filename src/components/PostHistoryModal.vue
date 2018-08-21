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
                <Post :submitModal="null" :post="mainPost" :showContent="true" v-bind="mainPost"></post>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal" v-on:click="resetPost()">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import { GetNovusphere } from '../novusphere'
import { GetEOS, ScatterConfig, ScatterEosOptions } from "../eos"
import { MigratePost, PlaceholderPost } from '../migrations';

import Post from "./Post.vue"

export default {
  name: "PostHistoryModal",
  components: {
    'Post': Post
  },
  async mounted() {
      //this.load();
  },
  methods: {
    resetPost: function() {
        // stop any attachments from playing, etc.
        this.mainPost = PlaceholderPost();
    },
    load: async function(txid) {
        var novusphere = GetNovusphere();
        var mainPost = (await novusphere.api({
            'find': novusphere.config.collection,
            'maxTimeMS': 1000,
            'filter': {
                'transaction': txid
            }
        })).cursor.firstBatch[0];

        var edits = (await novusphere.api({
            'find': novusphere.config.collection,
            'maxTimeMS': 1000,
            'filter': {
                'data.poster': mainPost.data.poster,
                'data.json_metadata.parent_uuid': mainPost.data.post_uuid,
                'data.json_metadata.edit': true
            },
            'sort': {
                'createdAt': 1
            }
        })).cursor.firstBatch;

        for (var i = 0; i < edits.length; i++) {
            var p = edits[i];
            MigratePost(p);            
            
            p.depth = 1;
            p.parent = mainPost;
        }

        MigratePost(mainPost);
        mainPost.children = edits;

        this.mainPost = mainPost;
    }
  },
  data() {
    return {
        mainPost: PlaceholderPost()
    }
  }
}
</script>
