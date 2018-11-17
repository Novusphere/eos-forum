<template>
    <div :class="'col-md-12 mb-3 post ' + ((post.depth>0) ? 'post-child' : '')">
      <div class="row">
        <div class="col-md-1">
          <router-link :to="thread_link">
            <img style="height:70px; width:auto;" :src="thumbnail ? thumbnail : 'https://cdn.novusphere.io/static/atmos.svg'">
          </router-link>
        </div>
        <div class="col-md-11">
          <!-- title -->
          <span style="font-weight: bold; font-size: 20px">
                <div v-if="is_show_title">
                  <!-- links to off-site content -->
                  <span v-if="post.o_attachment && post.o_attachment.type == 'url'">
                        <span class="title"><a target="_blank" :href="post.o_attachment.value">{{ title }}</a></span>
                        <span class="text-xsmall domain">(<span class="domain-offsite">{{this.getHost(post.o_attachment.value)}}</span> in <router-link :to="'/e/' + sub">self.{{sub}}</router-link>)</span>
                  </span>
                  <!-- links to on site content -->
                  <span v-else>
                        <span class="title"><router-link :to="thread_link">{{ title }}</router-link></span>
                        <span v-if="sub" class="text-xsmall domain"><router-link :to="'/e/' + sub">(self.{{sub}})</router-link></span>
                  </span>
                    
                  <span v-if="post.new_replies" class="badge badge-danger text-xsmall">new ({{post.new_replies}})</span>
                </div>
          </span>
          <div class="text-xsmall post-buttons">
                <ul class="list-inline">
                  <li v-if="show_content" class="list-inline-item">
                    <a class="post-collapse" data-toggle="collapse" :href="'#post-' + post.transaction"></a>
                  </li>
                  <li class="list-inline-item" v-if="!post.referendum">
                    <a :class="(post.my_vote ? 'text-mine': '')" href="javascript:void(0)" v-on:click="upvote()">
                      <font-awesome-icon :icon="['fas', 'arrow-up']" ></font-awesome-icon> 
                      {{post.up}} upvotes
                    </a>
                  </li>
                  <li class="list-inline-item" v-if="!show_content">
                    <router-link :to="thread_link">{{ post.total_replies }} comments</router-link>
                  </li>
                  <li class="list-inline-item"><router-link :to="thread_link">{{ new Date(post.createdAt * 1000).toLocaleString() }}</router-link></li>
                  <li v-if="!reddit.author" class="list-inline-item">
                    by <router-link :to="'/u/' + post.data.poster" :class="((post.data.poster == identity) ? 'text-mine' : 'author')">{{ poster_name }}</router-link>
                    <span v-if="op != 'eosforumanon' && post.data.poster == op" class="badge badge-success">op</span>
                  </li>
                  <li v-else class="list-inline-item">
                    by <a :href="'https://www.reddit.com/user/' + reddit.author" class="author">{{ poster_name }}</a>
                  </li>
                  <li class="list-inline-item"><a :href="'https://eosq.app/tx/' + post.transaction">on chain</a></li>
                  <li v-if="reddit.author" class="list-inline-item"><a :href="'https://reddit.com' + reddit.permalink">on reddit</a></li>
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
                
        <p style="font-weight: bold" v-if="!reddit.author && post.createdAt >= 1540774751 && post.data.poster == 'eosforumanon'">
          <span v-if="this.post.data.json_metadata.anon_id.verified">
            Anon ID: {{ post.data.json_metadata.anon_id.pub }}
          </span>
          <span v-else>
            Anon ID: unknown / unverified
          </span>
        </p>
        <p class="post-content" v-html="post_content"></p>

        <div class="text-xsmall post-buttons-bottom">
          <ul class="list-inline">
            <li class="list-inline-item" v-if="history_modal && post.depth > 0">
              <router-link :to="perma_link">permalink</router-link>
            </li>
            <li class="list-inline-item" v-if="show_content && submit_modal && (identity || is_anon_sub) && (post.data.poster == identity)">
              <a href="javascript:void(0)" v-on:click="edit()">edit</a>
            </li>
            <li class="list-inline-item" v-if="show_content && submit_modal /*&& (identity || is_anon_sub)*/">
              <a href="javascript:void(0)" class="highlight" data-toggle="collapse" :data-target="'#qreply-' + post.data.post_uuid" v-on:click="showQuickReply()">quick-reply</a>
            </li>
            <li class="list-inline-item" v-if="show_content && submit_modal /*&& (identity || is_anon_sub)*/">
              <a href="javascript:void(0)" class="highlight" v-on:click="reply()">reply</a>
            </li>
            <li class="list-inline-item" v-if="show_content && submit_modal && (identity || is_anon_sub)">
              <router-link :to="perma_link" class="highlight" v-if="is_max_depth && post.children.length>0">view replies</router-link>
            </li>
            <li class="list-inline-item" v-if="(is_child || (!submit_modal && this.hasAttachment('iframe'))) && post.o_attachment && post.o_attachment.value">
                <a href="javascript:void(0)" class="highlight"
                  v-on:click="showAttachment()"
                  data-toggle="collapse" :data-target="'#content-' + post.data.post_uuid">
                    show attachment
                </a>
            </li>

            <li class="list-inline-item" v-if="show_content && !submit_modal && post.referendum">
              <router-link :to="thread_link">{{ post.total_replies }} comments</router-link>
            </li>
            <li class="list-inline-item" v-if="post.referendum">
              <a href="javascript:void(0)" class="text-success" v-on:click="referendumVote(1)">
                <font-awesome-icon :icon="['fas', 'thumbs-up']" ></font-awesome-icon> 
                ({{ post.referendum.details.for_percent.toFixed(2) }}%)
              </a>
            </li>
            <li class="list-inline-item" v-if="post.referendum">
              <a href="javascript:void(0)" class="text-danger" v-on:click="referendumVote(0)">
                <font-awesome-icon :icon="['fas', 'thumbs-down']" ></font-awesome-icon>
                ({{ post.referendum.details.against_percent.toFixed(2) }}%)
              </a>
            </li>
            <li class="list-inline-item" v-if="post.referendum && post.data.poster == identity">
              <a href="javascript:void(0)" class="text-danger" v-on:click="referendumExpire()">
                expire
              </a>
            </li>
            <li class="list-inline-item" v-if="post.referendum && post.data.poster == identity">
              <a href="javascript:void(0)" class="text-danger" v-on:click="referendumClean()">
                clean
              </a>
            </li>
            <li class="list-inline-item" v-if="post.referendum">
              eos: {{ post.referendum.details.total_eos.toFixed(4) }}
            </li>
            <li class="list-inline-item" v-if="post.referendum">
              participants: {{ post.referendum.details.total_participants }}
            </li>
            <li class="list-inline-item" v-if="post.referendum">
              <span v-if="post.referendum.expired" class="text-danger">expired</span>
              <span v-else>expires on {{ new Date(post.referendum.expires_at * 1000).toLocaleString() }}</span>
            </li>
          </ul>
        </div>

        <div class="row collapse quick-reply" :id="'qreply-' + post.data.post_uuid">
          <div class="col-sm-12">
            <textarea rows="2" class="form-control" placeholder="Content" v-model="quick_reply"></textarea>
          </div>
          <div class="col-sm-2 mt-1 mb-2">
            <button v-if="identity" type="button" class="btn btn-sm btn-outline-primary" v-on:click="quickReply(false)">post</button>
            <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="quickReply(true)">post anon</button>
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

import ui from "@/ui";

import requests from "@/requests";
import { MarkdownParser } from "@/markdown";
import { GetIdentity } from "@/eos";
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
    reddit() {
      return this.post.data.json_metadata.reddit;
    },
    poster_name() {
      if (this.reddit.author) {
        return this.reddit.author + "[reddit]";
      } else if (
        this.post.data.poster == "eosforumanon" &&
        this.post.data.json_metadata.anon_id.name
      ) {
        return this.post.data.json_metadata.anon_id.name.substring(0, 12) + '[anon]'
      }
      else {
        return this.post.data.poster;
      }
    },
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
      var title = this.post.getTitle();
      if (!this.show_content && title.length > 80)
        return title.substring(0, 80) + "...";

      return title;
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
    thumbnail() {
      return this.post.data.json_metadata.attachment.thumbnail;
    },
    attachment() {
      return this.post.data.json_metadata.attachment.value;
    },
    perma_link() {
      var path = "/e/" + this.sub + "/";
      if (this.post.parent) {
        path += this.post.parent.o_id + "/";
      }
      path += this.post.getUrlTitle() + "/" + this.post.o_id;
      return path;
    },
    thread_link() {
      var txid = this.post.parent ? this.post.parent.o_id : this.post.o_id;
      return "/e/" + this.sub + "/" + txid + "/" + this.post.getUrlTitle();
    }
  },
  methods: {
    async load() {
      const identity = await GetIdentity();
      this.identity = identity.account;

      this.is_moderated = await moderation.isBlocked(
        this.post.createdAt,
        this.post.o_transaction,
        this.post.data.poster
      );

      this.is_nsfw =
        (this.post.tags && this.post.tags.includes("nsfw")) ||
        (this.post.depth == 0 &&
          (await moderation.isNsfw(
            this.post.createdAt,
            this.post.o_transaction
          )));

      if (this.show_content) {
        var md = new MarkdownParser(
          this.post.data.content,
          this.post.createdAt
        );

        this.post_content = md.html;

        // only allow one attachment through
        if (md.attachments.length > 0) {
          this.post.o_attachment = md.attachments[0];
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
    async referendumClean() {
      await ui.actions.Referendum.CleanProposal(this.post.transaction);
    },
    async referendumExpire() {
      await ui.actions.Referendum.Expire(this.post.transaction);
    },
    async referendumVote(vote) {
      if (this.post.referendum.expired) {
        alert('This proposal has expired and can no longer be voted on');
        return;
      }

      var txid = await ui.actions.Referendum.Vote(this.post.transaction, vote);
      alert(`Snapshots are taken every hour, so it may take awhile before your vote is processed. Below is your transaction id. ${txid}`, 
        {
          title: 'Thanks for voting!',
          text_class: 'text-success'
        });
    },
    async history() {
      await this.history_modal.load(this.post.o_transaction);
      jQuery("#postHistory").modal();
    },
    async edit() {
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

      this.submit_modal.showModal();
    },
    showQuickReply() {
      //var qr = jQuery(".quick-reply");
      //qr.removeClass('show');
    },
    async quickReply(anon) {
      this.submit_modal.$data.identity = (await GetIdentity()).account;

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
    async reply() {

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

      this.submit_modal.showModal();
    },
    getHost(href) {
      return ui.helpers.GetHost(href);
    },
    async upvote() {
      if (this.post.my_vote) {
        window._VueApp.$refs.upvote.modal(this.post);
        return;
      }
      try {
        this.post.up = await ui.actions.UpvoteFree(this.post);
      } catch (reason) {
        console.log(reason);
        alert(reason);
      }
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