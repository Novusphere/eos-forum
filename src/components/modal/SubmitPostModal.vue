<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="submitPost">
        <div class="modal-dialog modal-full" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ reply_uuid ? (post.edit ? 'Edit' : 'Reply') : 'New Submission' }}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div v-if="preview">
              <div class="modal-body">
                <p class="post-content" v-html="post_content">

                </p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" v-on:click="preview = false">back</button>
              </div>
            </div>
            <div v-else>
              <div class="modal-body">
                <form>
                  <div class="form-group row" v-if="!reply_uuid || (post.edit && post.title)">
                    <label class="col-sm-2 col-form-label">Title</label>
                    <div class="col-sm-10">
                      <input type="text" class="form-control" placeholder="Title" v-model="post.title">
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Content</label>
                    <div class="col-sm-10">
                      <textarea rows="10" class="form-control" placeholder="Content" v-model="post.content"></textarea>
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-2 col-form-label"></label>
                    <div class="col-sm-10">
                      {{ post.content.length }} / {{ 1024 * 10 }}
                    </div>
                  </div>
                  <fieldset class="form-group">
                    <div class="row">
                      <legend class="col-form-label col-sm-2 pt-0"></legend>
                      <div class="col-sm-10">
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentType" value="" checked v-model="post.attachment.type">
                          <label class="form-check-label">No attachment</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentType" value="url" v-model="post.attachment.type">
                          <label class="form-check-label">URL</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentType" value="ipfs" v-model="post.attachment.type">
                          <label class="form-check-label">IPFS</label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <fieldset class="form-group" v-if="post.attachment.type != ''">
                    <div class="row">
                      <legend class="col-form-label col-sm-2 pt-0"></legend>
                      <div class="col-sm-10">
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentDisplay" value="link" checked v-model="post.attachment.display">
                          <label class="form-check-label">link</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentDisplay" value="iframe" v-model="post.attachment.display">
                          <label class="form-check-label">iframe</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentDisplay" value="mp4" v-model="post.attachment.display">
                          <label class="form-check-label">mp4</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentDisplay" value="mp3" v-model="post.attachment.display">
                          <label class="form-check-label">mp3</label>
                        </div>
                      </div>
                    </div>
                  </fieldset>
                  <div class="form-group row" v-if="post.attachment.type != ''">
                    <label for="inputAttachment" class="col-sm-2 col-form-label"></label>
                    <div class="col-sm-10">
                      <input class="form-control" id="inputAttachment" placeholder="IPFS hash / URL" v-model="post.attachment.value">
                    </div>
                  </div>
                </form>
                <div class="row">
                  <div class="col-md-12">
                    <div class="text-center">
                      <span style="font-weight: bold">{{status}}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" v-on:click="postContent(false)">post</button>
                <button type="button" class="btn btn-outline-primary" v-on:click="postContent(true, true)" v-if="is_anon_sub">post anon</button>
                <button type="button" class="btn btn-outline-secondary" v-on:click="preview = true">preview</button>
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import { v4 as uuidv4 } from "uuid";
import jQuery from "jquery";

import Helpers from "@/helpers";
import { GetNovusphere } from "@/novusphere";
import { GetEOS, GetScatter, GetScatterIdentity } from "@/eos";
import { GetEOSService } from "@/eos-service";
import { MarkdownParser } from "@/markdown";

const FORUM_CONTRACT = "eosforumdapp";

export default {
  name: "SubmitPostModal",
  props: {
    reply_account: {
      type: String,
      required: false,
      default: ""
    },
    reply_uuid: {
      type: String,
      required: false,
      default: ""
    },
    sub: {
      type: String,
      required: true,
      default: ""
    },
    postContentCallback: {
      type: Function,
      required: false,
      default: () => {}
    }
  },
  methods: {
    async makePost(anon) {
      var post = this.post;

      if (!this.reply_uuid && post.title.length == 0) {
        this.setStatus("Post must have a title");
        return;
      }

      if (post.content.length == 0) {
        this.setStatus("Post must have at least 1 character of content");
        return;
      }

      if (post.content.length > 1024 * 10) {
        this.setStatus(
          "Post is too long, over limit by " +
            (1024 * 10 - post.content.length) +
            " characters"
        );
        return;
      }

      const eosService = GetEOSService();
      var identity = await GetScatterIdentity();
      if (anon) {
        identity = {
          account: eosService.config.anon_account,
          auth: "active"
        };
      }

      var eosPost = {
        poster: identity.account,
        reply_to_poster: this.reply_account,
        reply_to_post_uuid: this.reply_uuid,
        certify: 0,
        content: post.content,
        post_uuid: uuidv4(),
        json_metadata: JSON.stringify({
          title: post.title,
          type: "novusphere-forum",
          sub: this.sub,
          parent_uuid: post.parent_uuid,
          parent_poster: post.parent_poster,
          edit: post.edit,
          attachment: {
            value: post.attachment.value.trim(),
            type: post.attachment.type,
            display: post.attachment.value ? post.attachment.display : ""
          }
        })
      };

      return eosPost;
    },
    setStatus(text) {
      this.status = text;
      if (this.set_status) {
        this.set_status(text);
      }
    },
    async postContent(anon, warnAnon) {
      var post = this.post;
      const eosService = GetEOSService();
      const identity = await GetScatterIdentity();

      var txid;
      this.setStatus("Creating tx and broadcasting to EOS...");
      try {
        var eosPost = await this.makePost(anon);
        if (!eosPost) {
          return false;
        }

        if (anon) {

          // use eos-service to make anonymous post
          if (warnAnon)  {

            if (!(await confirm('Are you sure you want to post this anonymously?'))) {
              this.setStatus("Error: post canceled");
              return false;
            }
            
          }

          var eostx = await eosService.anonymousPost(eosPost);
          if (eostx.error) {
            this.setStatus("Error: " + eostx.error);
            console.log(eostx.error);
            return false;
          }
        } else {
          const eos = GetEOS(await GetScatter());

          var tips = [];
          var tips_rx = eosPost.content.match(/\#tip [0-9\.]+ [A-Z]+/gi);
          var contracts = [FORUM_CONTRACT];

          if (
            tips_rx &&
            tips_rx.length > 0 &&
            !this.post.edit &&
            this.post.parent_tx
          ) {
            // do not tip on edits

            var tokens = JSON.parse(
              await Helpers.AsyncGet(
                "https://raw.githubusercontent.com/eoscafe/eos-airdrops/master/tokens.json"
              )
            );

            tokens.splice(0, 0, {
              name: "EOS",
              logo: "",
              logo_lg: "",
              symbol: "EOS",
              account: "eosio.token"
            });

            for (var i = 0; i < tips_rx.length; i++) {
              var tip_args = tips_rx[i].split(" ");

              const token = tokens.find(t => t.symbol == tip_args[2]);
              if (!token) {
                this.setStatus(
                  "Error: could not find contract for tip symbol " + tip_args[2]
                );
                return false;
              }

              const stats = await eos.getCurrencyStats(
                token.account,
                token.symbol
              );
              const precision = stats[token.symbol].max_supply
                .split(" ")[0]
                .split(".")[1].length;

              var adjusted_amount = parseFloat(tip_args[1]).toFixed(precision);
              tips.push(adjusted_amount + " " + token.symbol);
              contracts.push(token.account);
            }
          }

          //console.log(contracts);
          //console.log(tips);
          //console.log(this.post.parent_poster);
          //console.log(this.post.parent_tx);

          var eostx = await eos.transaction(contracts, _contracts => {
            var auth = {
              authorzation: [
                {
                  actor: identity.account,
                  permission: identity.auth
                }
              ]
            };

            var __contracts = Object.values(_contracts); // { name: Object }
            __contracts[0].post(eosPost, auth);

            for (var i = 0; i < tips.length; i++) {
              __contracts[1 + i].transfer(
                {
                  from: identity.account,
                  to: this.post.parent_poster,
                  quantity: tips[i],
                  memo: "tip for " + this.post.parent_tx
                },
                auth
              );
            }
          });
        }

        txid = eostx.transaction_id;
      } catch (ex) {
        this.setStatus("Creating tx and broadcasting to EOS... Failed!");
        console.log(ex);
        return false;
      }

      this.setStatus("Waiting for Novusphere to index...");

      const novusphere = GetNovusphere();
      await novusphere.waitTx(txid, 500, 1000);

      // reset default
      this.setStatus("");
      this.post.content = "";
      this.post.attachment.value = "";
      this.post.attachment.type = "";
      this.post.attachment.display = "link";

      jQuery("#submitPost").modal("hide");

      this.postContentCallback(txid);
      return true;
    }
  },
  computed: {
    post_content: function() {
      var md = new MarkdownParser(this.post.content);
      return md.html;
    },
    is_anon_sub: function() {
      return this.sub == "anon" || this.sub.indexOf("anon-") == 0;
    }
  },
  data() {
    return {
      status: "",
      set_status: null,
      preview: false,
      post: {
        // for making a new post
        edit: false,
        parent_tx: "",
        parent_poster: "",
        parent_uuid: "",
        title: "",
        content: "",
        attachment: {
          value: "",
          type: "",
          display: "link"
        }
      }
    };
  }
};
</script>