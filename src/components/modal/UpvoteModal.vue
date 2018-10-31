<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="upvoteModal">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Upvote post by {{ post.data.poster }}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
                <div class="text-center">
                    You have already used your free up vote on this post, however, you can use your ATMOS to up vote it further.
                    Half of the ATMOS used to up vote this post will go to the poster and
                    the other half is send to novuspheredb account as a DAO fund.
                    If you are up voting your own post, the entire amount will be sent to the DAO fund.
                    Enter the amount of ATMOS you would like to use below.
                </div>
                <form class="mt-3">
                  <div class="form-group row">
                    <label class="col-sm-2 col-form-label">ATMOS</label>
                    <div class="col-sm-10">
                      <input type="text" class="form-control" v-model="atmos">
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Upvotes</label>
                    <label class="col-sm-10 col-form-label">{{ upvotes }}</label>
                  </div>
                </form>
                <div v-if="error" class="text-center text-danger mt-3">
                    <p>{{error}}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" v-on:click="upvote()">upvote</button>
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import jQuery from "jquery";

import ui from "@/ui";

export default {
  name: "UpvoteModal",
  async mounted() {},
  computed: {
    upvotes() {
      return ui.helpers.AtmosToUpvotes(this.atmos);
    }
  },
  methods: {
    async upvote() {
      try {
        this.post.up = await ui.actions.UpvotePaid(this.post, this.atmos);
        jQuery("#upvoteModal").modal("hide");
      } catch (reason) {
        this.error = reason;
      }
    },
    modal(post) {
      this.post = post;
      this.atmos = ui.helpers.UpvotesToAtmos(1);
      this.error = "";
      jQuery("#upvoteModal").modal();
    }
  },
  data() {
    return {
      error: "",
      atmos: 10,
      post: ui.helpers.PlaceholderPost()
    };
  }
};
</script>
