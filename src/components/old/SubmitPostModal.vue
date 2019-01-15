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
                  <div class="form-group row" v-if="reply_uuid">
                    <label class="col-sm-2 col-form-label"></label>
                    <div class="col-sm-10">
                      {{ post.content.length }} / {{ (1024 * 10)-1 }}
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
                <button type="button" class="btn btn-outline-primary" v-on:click="postContent(false)" v-if="identity">post</button>
                <button type="button" class="btn btn-outline-primary" v-on:click="postContent(true, true)">post anon</button>
                <button type="button" class="btn btn-outline-primary" v-on:click="preview = true">preview</button>
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import jQuery from "jquery";

import ui from "@/ui";

import { GetIdentity } from "@/eos";

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
    post_content_callback: {
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

      if (this.reply_uuid && post.content.length > 1024 * 10) {
        this.setStatus(
          "Post is too long, over limit by " +
            (post.content.length - (1024 * 10 - 1)) +
            " characters"
        );
        return;
      }

      var eos_post = {
        poster: "", // ui will fill this in
        reply_to_poster: this.reply_account,
        reply_to_post_uuid: this.reply_uuid,
        certify: 0,
        content: post.content,
        post_uuid: ui.helpers.GeneratePostUuid(),
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
          },
          anon_id: anon ? ui.helpers.GenerateAnonData(post.content) : null
        })
      };

      return eos_post;
    },
    setStatus(text) {
      this.status = text;
      if (this.set_status) {
        this.set_status(text);
      }
    },
    async showModal() {
      this.identity = (await GetIdentity()).account;
      jQuery("#submitPost").modal();
    },
    async postContent(anon, warn_anon) {
      this.setStatus("Creating tx and broadcasting to EOS...");
      var eos_post = await this.makePost(anon);
      if (!eos_post) {
        return null;
      }

      var txid = await ui.actions.PushNewPost(
        eos_post,
        this.post.parent_tx,
        anon,
        warn_anon,
        this.setStatus
      );

      if (!txid) {
        return null;
      }

      this.post.content = "";
      this.post.attachment.value = "";
      this.post.attachment.type = "";
      this.post.attachment.display = "link";

      this.setStatus("");

      jQuery("#submitPost").modal("hide");

      this.post_content_callback(txid, eos_post);

      return txid;
    }
  },
  computed: {
    post_content: function() {
      var md = ui.helpers.ParseMarkdown(this.post.content);
      return md.html;
    },
    is_anon_sub: function() {
      return ui.helpers.IsAnonSub(this.sub);
    }
  },
  data() {
    return {
      identity: "",
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