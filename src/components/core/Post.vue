<template>
    <div :class="'col-md-12 mb-3 post ' + (((post.depth%2)==1) ? 'post-odd' : '')">
      <div class="row">
        <div class="col-md-12">
          <!-- title -->
          <span style="font-weight: bold; font-size: 20px">
                <div v-if="is_show_title">
                  <!-- links to off-site content -->
                  <span v-if="post.o_attachment && post.o_attachment.type == 'url'">
                        <span class="title"><a target="_blank" :href="post.o_attachment.value">{{ title }}</a></span>
                        <span class="text-xsmall">(<span class="text-highlight">{{this.getHost(post.o_attachment.value)}}</span> in <router-link :to="'/e/' + sub">self.{{sub}}</router-link>)</span>
                  </span>
                  <!-- links to on site content -->
                  <span v-else>
                        <span class="title"><router-link :to="thread_link">{{ title }}</router-link></span>
                        <span v-if="sub" class="text-xsmall"><router-link :to="'/e/' + sub">(self.{{sub}})</router-link></span>
                  </span>
                    
                  <span v-if="post.new_replies" class="badge badge-danger text-xsmall">new ({{post.new_replies}})</span>
                </div>
          </span>
          <div class="text-xsmall">
                <ul class="list-inline">
                  <li v-if="show_content" class="list-inline-item">
                    <a class="post-collapse" data-toggle="collapse" :href="'#post-' + post.transaction"></a>
                  </li>
                  <li class="list-inline-item">
                    <a :class="(post.my_vote ? 'text-highlight': '')" href="javascript:void(0)" v-on:click="upvote()">▲ {{post.up}} upvotes</a>
                  </li>
                  <li class="list-inline-item" v-if="!show_content">
                    <router-link :to="thread_link">{{ post.total_replies }} comments</router-link>
                  </li>
                  <li class="list-inline-item"><router-link :to="thread_link">{{ new Date(post.createdAt * 1000).toLocaleString() }}</router-link></li>
                  <li class="list-inline-item">
                    by <router-link :to="'/u/' + post.data.poster" :class="(post.data.poster == identity) ? 'text-highlight' : ''">{{ post.data.poster }}</router-link>
                    <span v-if="op != 'eosforumanon' && post.data.poster == op" class="badge badge-success">op</span>
                  </li>
                  <li class="list-inline-item"><a :href="'https://eosq.app/tx/' + post.transaction">on chain</a></li>
                  <li v-if="history_modal && post.depth > 0" class="list-inline-item"><router-link :to="perma_link">permalink</router-link></li>
                  <li v-if="history_modal && show_content && post.data.json_metadata.edit" class="list-inline-item"><a href="javascript:void(0)" v-on:click="history()">history</a></li>
                  <li v-if="is_moderated" class="list-inline-item"><span class="badge badge-warning text-xsmall">spam</span></li>
                  <li v-if="is_nsfw" class="list-inline-item"><span class="badge badge-nsfw text-xsmall">nsfw</span></li>
                  <li v-if="post.is_pinned" class="list-inline-item"><span class="badge badge-pinned text-xsmall">pinned</span></li>
                  <li v-if="is_new" class="list-inline-item"><span class="badge badge-warning text-xsmall">new</span></li>
                </ul>
            </div>
        </div>
      </div>

      <div :id="'post-' + post.transaction" :class="'post-attachment collapse ' + ((is_moderated && is_child) ? '' : 'show')" v-if="show_content">
        
        <!-- attached content -->
        <PostAttachment
          ref="post_attachment" 
          :attachment="post.data.json_metadata.attachment"
          :id="'content-' + post.data.post_uuid"
          :collapse="is_child || (!submit_modal && this.hasAttachment('iframe'))">
        </PostAttachment>
                
        <p class="post-content" v-html="post_content"></p>

        <div class="text-xsmall">
          <ul class="list-inline">
            <li class="list-inline-item" v-if="show_content && submit_modal && (identity || is_anon_sub)">
              <button type="button" class="btn btn-sm btn-outline-primary" data-toggle="collapse" :data-target="'#qreply-' + post.data.post_uuid" v-on:click="showQuickReply()">quick reply</button>
              <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="reply()">reply</button>
              <button v-if="post.data.poster == identity" type="button" class="btn btn-sm btn-outline-secondary" v-on:click="edit()">edit</button>
              <router-link :to="perma_link" v-if="is_max_depth && post.children.length>0" class="btn btn-sm btn-outline-primary">view replies</router-link>
            </li>
            <li class="list-inline-item" v-if="(is_child || (!submit_modal && this.hasAttachment('iframe'))) && post.o_attachment && post.o_attachment.value">
                <button 
                  v-on:click="showAttachment()"
                  data-toggle="collapse" :data-target="'#content-' + post.data.post_uuid"
                  type="button" class="btn btn-sm btn-outline-danger">
                    show attachment
                </button>
            </li>
          </ul>
        </div>

        <div class="row collapse quick-reply" :id="'qreply-' + post.data.post_uuid">
          <div class="col-sm-12">
            <textarea rows="2" class="form-control" placeholder="Content" v-model="quick_reply"></textarea>
          </div>
          <div class="col-sm-2 mt-1 mb-2">
            <button v-if="identity" type="button" class="btn btn-sm btn-outline-secondary" v-on:click="quickReply(false)">post</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" v-on:click="quickReply(true)">post anon</button>
          </div>
        </div>
    
        <div v-if="!is_max_depth" v-for="child in post.children" :key="child.o_id">
          <div v-if="!(child.hide)">
                        <Post :submit_modal="submit_modal"
                            :history_modal="history_modal" 
                            :post="child"
                            :op="op"
                            :show_content="true">
                        </Post>
          </div>
        </div>
      </div>
    </div>  
</template>

<script>
import jQuery from "jquery";

import Helpers from "@/helpers";
import { MarkdownParser } from "@/markdown";
import {
  GetEOS,
  GetScatter,
  ScatterConfig,
  ScatterEosOptions,
  GetScatterIdentity
} from "@/eos";

import { storage } from "@/storage";
import { moderation } from "@/moderation";

import PostAttachment from "@/components/core/PostAttachment.vue";

export default {
  name: "Post",
  components: {
    PostAttachment: PostAttachment
  },
  props: {
    post: {
      type: Object,
      required: true
    },
    op: {
      type: String,
      required: false,
      default: ""
    },
    show_content: {
      type: Boolean,
      required: false,
      default: true
    },
    submit_modal: {
      type: Object,
      required: false,
      default: null
    },
    history_modal: {
      type: Object,
      required: false,
      default: null
    }
  },
  async mounted() {
    this.load();
  },
  computed: {
    is_show_title() {
      if (!this.post.data.reply_to_post_uuid) return true; // top level post

      if (this.post.parent && !this.is_child) return true; // has a parent, so userprofile/home

      return false;
    },
    is_child() {
      return this.post.depth > 0;
    },
    is_anon_sub() {
      var sub = this.sub;
      return sub == "anon" || sub.indexOf("anon-") == 0;
    },
    title() {
      var title = this.post.data.json_metadata.title;

      if (
        !title &&
        this.post.parent &&
        this.post.parent.data.json_metadata.title
      ) {
        title = this.post.parent.data.json_metadata.title;
      }

      if (!title) {
        title = "untitled";
      }

      if (!this.show_content && title.length > 80)
        return title.substring(0, 80) + "...";

      return title;
    },
    friendly_title() {
      var friendly = this.title.replace(/[^a-zA-Z0-9 ]/g, "");
      friendly = friendly.replace(/ /g, "_");
      return friendly;
    },
    is_max_depth() {
      var depth_lim = Math.floor(window.innerWidth / 65);
      var depth = this.post.depth;
      if (this.post.parent) {
        depth = depth - this.post.parent.depth; // relative deth
      }
      return depth >= depth_lim;
    },
    is_new() {
      if (!this.post.parent) {
        return false;
      }
      var seen = this.post.parent.__seen;
      if (!seen) {
        return false;
      }
      return this.post.createdAt > seen;
    },
    sub() {
      return this.post.data.json_metadata.sub;
    },
    attachment() {
      return this.post.data.json_metadata.attachment.value;
    },
    perma_link() {
      var path = "/e/" + this.sub + "/";
      if (this.post.parent) {
        path += this.post.parent.o_id + "/";
      }
      path += this.friendly_title + "/" + this.post.o_id;
      return path;
    },
    thread_link() {
      var txid = this.post.parent ? this.post.parent.o_id : this.post.o_id;
      return "/e/" + this.sub + "/" + txid + "/" + this.friendly_title;
    }
  },
  methods: {
    async load() {
      const identity = await GetScatterIdentity();
      this.identity = identity.account;

      this.is_moderated = await moderation.isBlocked(
        this.post.createdAt,
        this.post.o_transaction,
        this.post.data.poster
      );

      this.is_nsfw = 
        (this.post.data.tags && this.post.data.tags.includes('nsfw')) ||
        ((this.post.depth == 0) && (await moderation.isNsfw(this.post.createdAt, this.post.o_transaction)));

      if (this.show_content) {
        var md = new MarkdownParser(
          this.post.data.content,
          this.post.createdAt
        );

        this.post_content = md.html;

        // only allow one attachment through
        if (md.attachments.length > 0) {
          this.post.data.json_metadata.attachment = md.attachments[0];
        }
      }
    },
    showAttachment() {
      // only load iframe in p.depth>0 when requested
      this.$refs.post_attachment.show_iframe = !this.$refs.post_attachment
        .show_iframe;
    },
    hasAttachment(type) {
      if (!this.post) return false;
      if (!this.post.o_attachment || !this.post.o_attachment.value)
        return false;

      return type ? this.post.o_attachment.display == type : true;
    },
    async history() {
      await this.history_modal.load(this.post.o_transaction);
      jQuery("#postHistory").modal();
    },
    edit() {
      var $post = this.submit_modal.$data.post;
      var p = this.post;

      // dupe existing post into submit
      $post.parent_uuid = p.data.post_uuid;
      $post.parent_tx = p.transaction;
      $post.parent_poster = p.data.poster;
      $post.title = p.data.json_metadata.title;
      $post.content = p.data.content;
      $post.edit = true;

      var attachment = p.o_attachment;
      if (attachment) {
        $post.attachment.value = attachment.value;
        $post.attachment.type = attachment.type;
        $post.attachment.display = attachment.display;
      } else {
        $post.attachment.value = "";
        $post.attachment.type = "";
        $post.attachment.display = "link";
      }

      jQuery("#submitPost").modal();
    },
    showQuickReply() {
      //var qr = jQuery(".quick-reply");
      //qr.removeClass('show');
    },
    async quickReply(anon) {
      var $post = this.submit_modal.$data.post;
      $post.parent_uuid = this.post.data.post_uuid;
      $post.parent_tx = this.post.transaction;
      $post.parent_poster = this.post.data.poster;
      $post.title = "";
      $post.content = this.quick_reply;
      $post.edit = false;

      if (anon) {
        if (
          !await confirm(
            "Are you sure you want to post this?",
            ss => (this.submit_modal.set_status = ss),
            async () => await this.submit_modal.postContent(anon)
          )
        ) {
          return;
        }
      } else {
        await this.submit_modal.postContent(anon);
        if (this.submit_modal.status) {
          alert(this.submit_modal.status);
        }
      }

      if (!this.submit_modal.status) {
        // sucessful
        this.quick_reply = "";
        jQuery("#qreply-" + this.post.data.post_uuid).removeClass("show");
      }
    },
    reply() {
      var $post = this.submit_modal.$data.post;
      $post.parent_uuid = this.post.data.post_uuid;
      $post.parent_tx = this.post.transaction;
      $post.parent_poster = this.post.data.poster;
      $post.title = "";
      //$post.content = "";
      $post.edit = false;
      //$post.attachment.value = "";
      //$post.attachment.type = "";
      //$post.attachment.display = "link";

      jQuery("#submitPost").modal();
    },
    getHost(href) {
      return Helpers.GetHost(href);
    },
    async upvote() {
      if (this.post.my_vote) {
        //if (this.post.data.poster != this.identity) {
        window._VueApp.$refs.upvote.modal(this.post);
        //}
        return;
      }

      const identity = await GetScatterIdentity();
      if (!identity.account) {
        alert("You must be logged in to upvote comments!");
        return;
      }

      const eos = GetEOS(await GetScatter());
      var contract = await eos.contract("novuspheredb");
      var eostxArg = {
        account: identity.account,
        json: JSON.stringify({
          protocol: "novusphere",
          method: "forum_vote",
          data: {
            txid: this.post.o_transaction
          }
        })
      };
      var eostx = await contract.transaction(tx => {
        tx.push(eostxArg, {
          authorization: [
            {
              actor: identity.account,
              permission: identity.auth
            }
          ]
        });
      });

      this.post.my_vote = {
        account: identity.account,
        txid: this.post.o_transaction
      };
      this.post.up = (this.post.up ? this.post.up : 0) + 1;
    }
  },
  watch: {
    post: function() {
      this.load();
    }
  },
  data() {
    return {
      quick_reply: "",
      post_content: "",
      identity: "",
      is_moderated: false,
      is_nsfw: false
    };
  }
};
</script>