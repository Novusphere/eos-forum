

<template>
  <layout :load="load">
    <template slot="topic">
      <span> {{ !edit_post ? 'Start Thread' : 'Edit Thread' }}</span>
    </template>

    <template slot="content">
      <!-- POST -->
      <b-button @click="$router.go(-1)" class="btn btn-sm btn-primary mb-1">
        <font-awesome-icon :icon="['fas', 'arrow-left']" ></font-awesome-icon>
        back
      </b-button>
      <div class="post">
        <form action="#" class="form newtopic">
          <div class="topwrap">
              <div class="posttext pull-left ml-2">
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Title</label>
                    <div class="col-sm-10">
                      <input type="text" class="form-control" placeholder="Title" v-model="title">
                    </div>
                </div>
                <div class="form-group row" v-if="!edit_post && !is_referendum">
                    <label class="col-sm-2 col-form-label">Sub</label>
                    <div class="col-sm-10">
                      <v-select
                        @keyup.enter.native.stop="addCustom"
                        @click.native="customSub = ''"
                        @keydown.native.stop="updateTemp"
                        v-model="sub2"
                        :options="sub_options"
                        label="sub"
                        class="form-control">
                        <template slot="option" slot-scope="option">
                          <img v-if="option.logo" :src="option.logo" style="max-width:24px">
                          {{ option.sub }}
                        </template>
                      </v-select>
                    </div>
                </div>
                <div class="form-group row" v-if="is_referendum">
                    <label class="col-sm-2 col-form-label">Type</label>
                    <div class="col-sm-10">
                      <b-form-select v-model="referendum_type">
                        <option value="referendum-v1">Referendum</option>
                        <option value="poll-yn-v1">Poll (Y/N)</option>
                        <option value="poll-yna-v1">Poll (Y/N/A)</option>
                        <option value="options-v1">Options Poll</option>
                        <option value="multi-select-v1">Multi-select Poll</option>
                      </b-form-select>
                    </div>
                </div>
                <div class="form-group row" v-if="is_referendum">
                  <label class="col-sm-2 col-form-label">Expiry</label>
                  <div class="col-sm-8">
                    <input type="text" class="form-control" placeholder="mm-dd-yyyy" v-model="referendum_expires">
                  </div>
                  <label class="col-sm-2 col-form-label">({{ expiry_delta }} days from now)</label>
                </div>
                <div class="form-group row">
                    <label class="col-sm-2 col-form-label">Content</label>
                    <div class="col-sm-10">
                      <textarea rows="10" class="form-control" placeholder="Content" v-model="content"></textarea>
                    </div>
                </div>
                <div class="form-group row" v-if="is_referendum && is_referendum_multi">
                    <label class="col-sm-2 col-form-label">Options</label>
                    <div class="col-sm-8">
                      <input type="text" class="form-control" placeholder="option" v-model="referendum_option">
                    </div>
                    <div class="col-sm-2">
                      <button type="button" class="btn btn-primary" v-on:click="referendum_options.push(referendum_option)">add</button>
                    </div>
                    <div class="offset-sm-2 col-sm-10">
                      <ul v-for="(o, i) in referendum_options" :key="i">
                        <li>
                          {{ o }}
                          <button type="button" class="btn btn-sm btn-danger ml-2" v-on:click="referendum_options.splice(i, 1)">
                            <font-awesome-icon :icon="['fas', 'times']" ></font-awesome-icon>
                          </button>
                        </li>
                      </ul>
                    </div>
                </div>
                <fieldset class="form-group" v-if="!is_referendum">
                    <div class="row">
                      <legend class="col-form-label col-sm-2 pt-0"></legend>
                      <div class="col-sm-10">
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentType" value="" checked v-model="attachment.type">
                            <label class="form-check-label">No attachment</label>
                          </div>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentType" value="url" v-model="attachment.type">
                            <label class="form-check-label">URL</label>
                          </div>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentType" value="ipfs" v-model="attachment.type">
                            <label class="form-check-label">IPFS</label>
                          </div>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentType" value="txid" v-model="attachment.type">
                            <label class="form-check-label">TXID</label>
                          </div>
                      </div>
                    </div>
                </fieldset>
                <fieldset class="form-group" v-if="attachment.type != ''">
                    <div class="row">
                      <legend class="col-form-label col-sm-2 pt-0"></legend>
                      <div class="col-sm-10" v-if="attachment.type == 'txid'">
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentDisplay" value="referendum" v-model="attachment.display">
                            <label class="form-check-label">referendum</label>
                          </div>
                      </div>
                      <div class="col-sm-10" v-else>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentDisplay" value="link" checked v-model="attachment.display">
                            <label class="form-check-label">link</label>
                          </div>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentDisplay" value="iframe" v-model="attachment.display">
                            <label class="form-check-label">iframe</label>
                          </div>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentDisplay" value="mp4" v-model="attachment.display">
                            <label class="form-check-label">mp4</label>
                          </div>
                          <div class="form-check form-check-inline">
                            <input class="form-check-input" type="radio" name="attachmentDisplay" value="mp3" v-model="attachment.display">
                            <label class="form-check-label">mp3</label>
                          </div>
                      </div>
                    </div>
                </fieldset>
                <div class="form-group row" v-if="attachment.type != ''">
                    <label class="col-sm-2 col-form-label"></label>
                    <div class="col-sm-10">
                      <input class="form-control" placeholder="IPFS hash / URL / TXID" v-model="attachment.value">
                    </div>
                </div>
                <div class="row">
                    <div class="col-md-12">
                      <div class="text-center">
                          <span style="font-weight: bold">{{status}}</span>
                      </div>
                      <div class="text-center" v-if="!identity.account && is_referendum">
                        <span>You must be logged in to create a referendum proposal</span>
                      </div>
                    </div>
                </div>
                <div class="row">
                  <div class="offset-sm-2 col-sm-10">
                    <button type="button" class="btn btn-primary" v-on:click="postContent(false)" v-if="identity.account">Post</button>
                    <button type="button" class="btn btn-primary" v-on:click="postContent(true, true)" v-if="!edit_post && !is_referendum">Post ID</button>
                    <button type="button" class="btn btn-secondary" v-on:click="updatePreview()">Preview</button>
                  </div>
                </div>
                <div class="row" v-if="preview">
                  <div class="col-md-12">
                    <post :post="preview"></post>
                  </div>
                </div>
              </div>
              <div class="clearfix"></div>
          </div>
        </form>
      </div>
      <!-- POST -->
    </template>
</layout>

</template>

<script>
import ui from "@/ui";
import { BRANDS } from "@/ui/constants";
import { storage } from "@/storage";

import { GetNovusphere } from "@/novusphere";
import { GetIdentity } from "@/eos";

import Pager from "@/components/core/Pager";
import PostComponent from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import Layout from "@/components/section/Layout";

import { Post } from "@/types/post";
import $ from 'jquery';

export default {
  name: "StartThread",
  components: {
    Pager,
    Post: PostComponent,
    PostSorter,
    Layout
  },
  watch: {},
  computed: {
    is_referendum() {
      return this.sub2.sub == "referendum";
    },
    is_referendum_multi() {
      return (
        this.referendum_type == "options-v1" ||
        this.referendum_type == "multi-select-v1"
      );
    },
    expiry_delta: function() {
      var expiry = new Date(this.referendum_expires);
      if (isNaN(expiry.getTime())) {
        return "?";
      }
      return this.getDeltaDays(expiry);
    }
  },
  async mounted() {
    this.load();
  },
  methods: {
    updateTemp(event) {
      if (event.key.length === 1) {
        this.customSub += event.key;
      }
      if (event.key === 'Backspace') {
        this.customSub = this.customSub.substr(0, this.customSub.length - 1);
      }
    },
    addCustom() {
      const custom = {
        icon: '',
        sub: this.customSub,
        type: 'custom',
      }
      this.sub_options.unshift(custom);
      this.sub2 = custom;
      this.customSub = '';
    },
    getDeltaDays(future) {
      var delta = future.getTime() - new Date().getTime();
      return (delta / (1000 * 60 * 60 * 24)).toFixed(2);
    },
    async load() {
      this.identity = await GetIdentity();
      this.sub = this.$route.params.sub;

      if (this.$route.params.edit_id) {
        const id = this.$route.params.edit_id;
        const novusphere = GetNovusphere();
        const identity = this.identity;

        var main_post = (await novusphere.api({
          aggregate: novusphere.config.collection_forum,
          maxTimeMS: 7500,
          cursor: {},
          pipeline: [
            { $match: novusphere.query.match.threadById(id) },
            { $lookup: novusphere.query.lookup.threadReplies() },
            {
              $project: novusphere.query.project.post({
                recent_edit: true
              })
            }
          ]
        })).cursor.firstBatch[0];

        main_post = new Post(main_post);
        await main_post.normalize();

        this.edit_post = main_post;
        this.sub = main_post.data.json_metadata.sub;
        this.title = main_post.data.json_metadata.title;
        this.content = main_post.data.content;

        const attachment = main_post.data.json_metadata.attachment;
        this.attachment.value = attachment.value;
        this.attachment.type = attachment.type;
        this.attachment.display = attachment.display;
      }

      var sub_options = [{ icon: "", sub: this.sub }];
      for (var i = 0; i < storage.subscribed_subs.length; i++) {
        if (sub_options.find(so => so.sub == storage.subscribed_subs[i])) {
          continue;
        }

        sub_options.push({
          logo: BRANDS["novusphere"].logo,
          sub: storage.subscribed_subs[i]
        });
      }

      for (var i = 0; i < sub_options.length; i++) {
        const brand = BRANDS[sub_options[i].sub];
        if (brand && brand.logo) {
          sub_options[i].logo = brand.logo;
        }
      }

      this.sub2 = sub_options[0];
      this.sub_options = sub_options;
    },
    setStatus(message) {
      this.status = message;
    },
    async makePost(anon) {
      if (this.title.length == 0) {
        this.setStatus("Post must have a title");
        return;
      }

      if (this.content.length == 0) {
        this.setStatus("Post must have at least 1 character of content");
        return;
      }

      const edit_post = this.edit_post;

      var eos_post = {
        poster: this.identity.account || "eosforumanon",
        reply_to_poster: edit_post
          ? edit_post.data.reply_to_poster || edit_post.data.poster
          : "",
        reply_to_post_uuid: edit_post
          ? edit_post.data.reply_to_post_uuid || edit_post.data.post_uuid
          : "",
        certify: false,
        content: this.content,
        post_uuid: ui.helpers.GeneratePostUuid(),
        json_metadata: JSON.stringify({
          title: this.title,
          type: "novusphere-forum",
          sub: edit_post ? edit_post.data.json_metadata.sub : this.sub2.sub,
          parent_uuid: edit_post ? edit_post.data.post_uuid : "",
          parent_poster: edit_post ? edit_post.data.poster : "",
          edit: edit_post ? true : false,
          attachment: {
            value: this.attachment.value.trim(),
            type: this.attachment.type,
            display: this.attachment.value ? this.attachment.display : ""
          },
          anon_id: anon ? await ui.helpers.GenerateAnonData(this.content) : null
        })
      };

      return eos_post;
    },
    async postContent(anon, warn_anon) {
      this.setStatus("Creating tx and broadcasting to EOS...");
      var eos_post = await this.makePost(anon);
      if (!eos_post) {
        this.setStatus('Unable to create transaction data!');
        return null;
      }

      var txid = null;

      if (this.is_referendum) {
        if (this.is_referendum && this.is_referendum_multi) {
          if (this.referendum_options.length < 2) {
            this.setStatus(
              "You must set at least 2 options for this referendum type!"
            );
            return;
          }
        }

        txid = await ui.actions.Referendum.PushNewProposal({
          expires_at: this.referendum_expires,
          title: this.title,
          content: this.content,
          type: this.referendum_type,
          options: this.referendum_options
        });
      } else {
        txid = await ui.actions.PushNewPost(
          eos_post,
          "",
          anon,
          warn_anon,
          this.setStatus
        );
      }

      if (!txid) {
        return null;
      }

      //
      // edit_post if defined, should be the OP of the thread
      //
      this.$router.push({
        name: "Thread",
        params: {
          sub: this.sub2.sub,
          id: this.edit_post ? this.edit_post.o_transaction : txid
        }
      });
    },
    async updatePreview() {
      this.setStatus("");
      var eos_post = await this.makePost(false);
      if (this.status) {
        return;
      }

      var preview = new Post({
        createdAt: parseInt(new Date().getTime() / 1000),
        transaction: "preview",
        id: 1,
        name: "post",
        data: eos_post
      });

      await preview.normalize();

      this.preview = preview;
    }
  },
  data() {
    return {
      sub_options: [],
      preview: null,
      edit_post: null,
      identity: {},
      status: "",
      sub: "",
      sub2: {},
      title: "",
      content: "",
      attachment: {
        value: "",
        type: "",
        display: ""
      },
      referendum_type: "referendum-v1",
      referendum_expires: "",
      referendum_option: "",
      referendum_options: [],
      customSub: '',
    };
  }
};
</script>
<style>
.v-select .no-options {
  color: white;
}
.v-select .no-options:after {
  content: 'press enter to create custom sub';
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  color: black;
}
.v-select .dropdown-toggle::after {
  display: none;
}
</style>
<style scoped>
.col-form-label {
  white-space: nowrap !important;
}
</style>