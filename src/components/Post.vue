<template>
    <div :class="'col-md-12 mb-3 post ' + (((p.depth%2)==1) ? 'post-odd' : '')">
      <div class="row">
        <div class="col-md-12">
            <span style="font-weight: bold; font-size: 20px">
                <div v-if="!(p.data.reply_to_post_uuid) || (p.parent && !(p.parent.data.reply_to_post_uuid) && !historyModal)">
                    <span v-if="this.hasAttachment('link')">
                        <span class="title"><a target="_blank" :href="attachment">{{ title }}</a></span>
                        <span class="text-xsmall">({{this.getHost(attachment)}})</span>
                    </span>
                    <span v-else>
                        <span class="title"><router-link :to="threadLink">{{ title }}</router-link></span>
                        <span v-if="sub" class="text-xsmall"><router-link :to="'/e/' + sub">(eos.{{sub}})</router-link></span>
                     </span>
                     <span v-if="p.new_replies" class="badge badge-danger text-xsmall">new ({{p.new_replies}})</span>
                </div>
            </span>
            <div style="font-size: x-small">
                <ul class="list-inline">
                  <li v-if="showContent" class="list-inline-item"><a class="post-collapse" data-toggle="collapse" :href="'#post-' + p.transaction"></a></li>
                  <li class="list-inline-item">
                    <a :class="(p.my_vote ? 'text-success': '')" href="javascript:void(0)" v-on:click="upvote()">▲ {{p.up}} upvotes</a>
                  </li>
                  <li class="list-inline-item" v-if="!showContent">
                    <router-link :to="threadLink">{{ p.total_replies }} comments</router-link>
                  </li>
                  <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                  <li class="list-inline-item">by <router-link :to="'/u/' + p.data.poster">{{ p.data.poster }}</router-link></li>
                  <li class="list-inline-item"><a :href="'https://bloks.io/transaction/' + p.transaction">on chain</a></li>
                  <li v-if="historyModal && p.depth > 0" class="list-inline-item"><router-link :to="permaLink">permalink</router-link></li>
                  <li v-if="historyModal && showContent && p.data.json_metadata.edit" class="list-inline-item"><a href="javascript:void(0)" v-on:click="history()">history</a></li>
                </ul>
            </div>
        </div>
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
import {
  GetEOS,
  GetScatter,
  ScatterConfig,
  ScatterEosOptions,
  GetScatterIdentity
} from "../eos";

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
    title() {
      var title = this.post.data.json_metadata.title;
      if (
        !title &&
        this.post.parent &&
        this.post.parent.data.json_metadata.title
      ) {
        title = this.post.parent.data.json_metadata.title;
      }

      if (!this.showContent && title.length > 80)
        return title.substring(0, 80) + "...";

      return title;
    },
    sub() {
      return this.post.data.json_metadata.sub;
    },
    attachment() {
      return this.post.data.json_metadata.attachment.value;
    },
    permaLink() {
      var path = "/e/" + this.sub + "/";
      if (this.post.parent) {
        path += this.post.parent.o_transaction + "/";
      }
      path += this.post.transaction;
      return path;
    },
    threadLink() {
      var txid = this.post.parent
        ? this.post.parent.o_transaction
        : this.post.o_transaction;
      return "/e/" + this.sub + "/" + txid;
    }
  },
  methods: {
    async load() {
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

        this.showFrame = this.p.depth == 0;
      }
    },
    showAttachment() {
      // only load iframe in p.depth>0 when requested
      this.showFrame = !this.showFrame;
    },
    hasAttachment(type) {
      return (
        this.post.data.json_metadata.attachment &&
        this.post.data.json_metadata.attachment.value &&
        (type ? this.post.data.json_metadata.attachment.display == type : true)
      );
    },
    async history() {
      await this.historyModal.load(this.p.o_transaction);
      jQuery("#postHistory").modal();
    },
    edit() {
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
    reply() {
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
    getHost(href) {
      if (href.indexOf("magnet:") == 0) {
        return "magnet link";
      }

      var parser = document.createElement("a");
      parser.href = href;
      return parser.host;
    },
    async upvote() {
      if (this.post.my_vote) {
        return;
      }

      const identity = await GetScatterIdentity();
      if (!(identity.account)) {
        alert('You must have Scatter to upvote comments!');
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

      this.post.my_vote = { account: identity.account, txid: this.post.o_transaction };
      this.post.up = (this.post.up ? this.post.up : 0) + 1;
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