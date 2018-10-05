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
                    You have already used your free upvote on this post, however, you can use your ATMOS to upvote it further.
                    Half of the ATMOS used to upvote this post will go to the poster and
                    the other half is send to novuspheredb account as a DAO fund.
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
                <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import jQuery from "jquery";

import { PlaceholderPost } from "@/migrations";
import { GetEOS, GetScatter, GetScatterIdentity } from "@/eos";

const UPVOTE_ATMOS_RATE = 10; // 1 upvote in ATMOS

export default {
  name: "UpvoteModal",
  async mounted() {},
  computed: {
    upvotes() {
      // current rate of ATMOS --> upvotes
      return this.atmos / UPVOTE_ATMOS_RATE;
    }
  },
  methods: {
    async upvote() {
      const eos = GetEOS(await GetScatter());
      const identity = await GetScatterIdentity();
      const auth = [
        {
          actor: identity.account,
          permission: identity.auth
        }
      ];

      const memo = "upvote for " + this.post.o_transaction;
      const quantity = (parseFloat(this.atmos) / 2).toFixed(3) + " ATMOS";

      try {
        var contract = await eos.contract("novusphereio");
        var eostx = await contract.transaction(tx => {
          tx.transfer(
            {
              from: identity.account,
              to: this.post.data.poster,
              quantity: quantity,
              memo: memo
            },
            auth
          );
          tx.transfer(
            {
              from: identity.account,
              to: "novuspheredb",
              quantity: quantity,
              memo: memo
            },
            auth
          );
        });
      } catch (ex) {
        this.error = "Error: upvote transaction failed!";
        return;
      }

      var new_upvotes = Math.floor(parseFloat(this.atmos) / UPVOTE_ATMOS_RATE);
      this.post.up = parseInt(this.post.up) + new_upvotes;
      jQuery("#upvoteModal").modal("hide");
    },
    modal(post) {
      this.post = post;
      // reset
      this.atmos = UPVOTE_ATMOS_RATE;
      this.error = "";
      jQuery("#upvoteModal").modal();
    }
  },
  data() {
    return {
      error: "",
      atmos: 10,
      post: PlaceholderPost()
    };
  }
};
</script>
