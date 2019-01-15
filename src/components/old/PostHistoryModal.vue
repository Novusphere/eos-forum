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
                <Post :post="main_post" :show_content="true" v-bind="main_post"></post>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal" v-on:click="resetPost()">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import ui from "@/ui";
import { GetEOS, GetIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";

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
      this.main_post = ui.helpers.PlaceholderPost();
    },
    async load(txid) {
      var history = await ui.views.PostHistory(txid);
      this.main_post = history.main_post;
    }
  },
  data() {
    return {
      main_post: ui.helpers.PlaceholderPost()
    };
  }
};
</script>
