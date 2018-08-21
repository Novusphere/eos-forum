<template>
    <div :class="'col-md-12 mb-3 post ' + (((p.depth%2)==1) ? 'post-odd' : '')">
            <span style="font-weight: bold; font-size: 20px">
                <div v-if="!(p.data.reply_to_post_uuid) || (p.parent && !(p.parent.data.reply_to_post_uuid) && !historyModal)">
                    <div v-if="this.hasAttachment('link')">
                        <span class="title"><a target="_blank" :href="attachment">{{ title }}</a></span>
                        <span class="text-xsmall">({{this.getHost(attachment)}})</span>

                        <span v-if="p.new_replies" class="badge badge-danger text-xsmall">new ({{p.new_replies}})</span>
                    </div>
                    <div v-else>
                        <span class="title"><router-link :to="threadLink">{{ title }}</router-link></span>
                        <span class="text-xsmall"><router-link :to="'/e/' + sub">(eos.{{sub}})</router-link></span>
                     
                        <span v-if="p.new_replies" class="badge badge-danger text-xsmall">new ({{p.new_replies}})</span>
                    </div>
                </div>
            </span>
            <div style="font-size: x-small">
                <ul class="list-inline">
                  <li v-if="showContent" class="list-inline-item"><a class="post-collapse" data-toggle="collapse" :href="'#post-' + p.transaction"></a></li>
                  <li class="list-inline-item" v-if="!showContent">
                    <router-link :to="threadLink">{{ p.total_replies }} comments</router-link>
                  </li>
                  <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                  <li class="list-inline-item">by <a :href="'https://bloks.io/account/' + p.data.poster">{{ p.data.poster }}</a></li>
                  <li class="list-inline-item"><a :href="'https://bloks.io/transaction/' + p.transaction">on chain</a></li>
                  <li v-if="historyModal && p.depth > 0" class="list-inline-item"><router-link :to="permaLink">permalink</router-link></li>
                  <li v-if="historyModal && showContent && p.data.json_metadata.edit" class="list-inline-item"><a href="javascript:void(0)" v-on:click="history()">history</a></li>
                </ul>
            </div>
            <div :id="'post-' + p.transaction" class="post-attachment collapse show" v-if="showContent">

                        <PostAttachment
                            ref="postAttachment" 
                            :attachment="p.data.json_metadata.attachment"
                            :id="'content-' + p.data.post_uuid"
                            :collapse="(p.depth > 0)"
                            :showFrame="showFrame">
                        </PostAttachment>
                
                <p class="post-content" v-html="this.postContent">
                
                </p>

                <div style="font-size: x-small">
                    <ul class="list-inline">
                        <li class="list-inline-item" v-if="showContent && submitModal">
                            <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="reply()">reply</button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" v-on:click="edit()">edit</button>
                        </li>
                        <li class="list-inline-item" v-if="p.depth > 0 && p.data.json_metadata.attachment && p.data.json_metadata.attachment.value">
                            <button 
                                v-on:click="showAttachment()"
                                data-toggle="collapse" :data-target="'#content-' + p.data.post_uuid"
                                type="button" class="btn btn-sm btn-outline-danger">
                                show attachment
                            </button>
                        </li>
                    </ul>
                </div>
    
                <div v-for="child in p.children" :key="child.transaction">
                    <div v-if="!(child.hide)">
                        <Post :submitModal="submitModal"
                            :historyModal="historyModal" 
                            :post="child" 
                            :showContent="true">
                        </Post>
                    </div>
                </div>
            </div>
    </div>  
</template>

<script>
import jQuery from "jquery";
import { MarkdownParser } from "../markdown";

import PostAttachment from "./PostAttachment.vue";

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
    showContent: {
      type: Boolean,
      required: false,
      default: true
    },
    submitModal: {
      type: Object,
      required: false
    },
    historyModal: {
      type: Object,
      required: false
    }
  },
  async mounted() {
    this.load();
  },
  computed: {
    title: function() {
      var title = this.post.data.json_metadata.title;
      if (!title && this.post.parent && this.post.parent.data.json_metadata.title) {
        title = this.post.parent.data.json_metadata.title;
      }

      if (!this.showContent && title.length > 80)
        return title.substring(0, 80) + "...";

      return title;
    },
    sub: function() {
      return this.post.data.json_metadata.sub;
    },
    attachment: function() {
      return this.post.data.json_metadata.attachment.value;
    },
    permaLink: function() {
      var path = "/e/" + this.sub + "/";
      if (this.post.parent) {
        path += this.post.parent.o_transaction + "/";
      }
      path += this.post.transaction;
      return path;
    },
    threadLink: function() {
      var txid = this.post.parent
        ? this.post.parent.o_transaction
        : this.post.o_transaction;
      return "/e/" + this.sub + "/" + txid;
    }
  },
  methods: {
    load: function() {
      if (this.showContent) {
        // md parse
        var md = new MarkdownParser(this.p.data.content);
        this.postContent = md.html;

        // only allow one attachment through
        if (md.attachments.length > 0) {
          this.p.data.json_metadata.attachment = md.attachments[0];
        }

        if (this.hasAttachment("iframe")) {
          // only load iframe automatically if p.depth == 0 (start of thread)
          if (this.p.depth == 0) {
            this.$refs.postAttachment.showFrame = true;
          }
        }

        this.showFrame = (this.p.depth == 0);
      }
    },
    showAttachment: function() {
      // only load iframe in p.depth>0 when requested
      this.showFrame = !this.showFrame;
    },
    hasAttachment: function(type) {
      return (
        this.post.data.json_metadata.attachment &&
        this.post.data.json_metadata.attachment.value &&
        (type ? this.post.data.json_metadata.attachment.display == type : true)
      );
    },
    history: async function() {
      await this.historyModal.load(this.p.o_transaction);
      jQuery("#postHistory").modal();
    },
    edit: function() {
      var $post = this.submitModal.$data.post;
      var p = this.p;

      // dupe existing post into submit
      $post.parent_uuid = p.data.post_uuid;
      $post.title = p.data.json_metadata.title;
      $post.content = p.data.content;
      $post.edit = true;
      $post.edit_account = p.data.poster;

      var attachment = p.data.json_metadata.attachment;
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
    reply: function() {
      var $post = this.submitModal.$data.post;
      $post.parent_uuid = this.$data.p.data.post_uuid;
      $post.title = "";
      //$post.content = "";
      $post.edit = false;
      //$post.attachment.value = "";
      //$post.attachment.type = "";
      //$post.attachment.display = "link";

      jQuery("#submitPost").modal();
    },
    getHost: function(href) {
      if (href.indexOf("magnet:") == 0) return "magnet link";

      var parser = document.createElement("a");
      parser.href = href;
      return parser.host;
    }
  },
  watch: {
    post: function() {
      this.p = this.post;
      this.load();
    }
  },
  data() {
    return {
      p: this.post,
      postContent: "",
      showFrame: false
    };
  }
};
</script>