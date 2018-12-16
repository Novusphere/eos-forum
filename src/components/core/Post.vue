<template>
   <div>
      <!-- POST -->
      <div class="post">
         <div class="topwrap">
            <div class="userinfo float-left">
                <div v-if="!thread && !post.referendum" class="postthumbnail">
                  <img :src="thumbnail" class="img-fluid" alt="thumbnail">
                </div>
                <div class="text-center" v-if="!post.referendum">
                    <a href="javascript:void(0)" class="up" v-on:click="upvote()">
                        <font-awesome-icon :icon="['far', 'thumbs-up']" ></font-awesome-icon>
                        {{ post.up }}
                    </a>
                </div>
                <div class="text-center" v-else>
                  <div>
                    <font-awesome-icon :icon="['fas', 'user']" ></font-awesome-icon> 
                    {{ post.referendum.details.total_participants }}
                  </div>
                </div>
                <div class="text-center">
                  <font-awesome-icon v-if="post.is_pinned" :icon="['fas', 'thumbtack']" ></font-awesome-icon>
                  <font-awesome-icon v-if="is_spam" :icon="['fas', 'exclamation-triangle']" ></font-awesome-icon>     
                  <font-awesome-icon v-if="is_nsfw" :icon="['fas', 'eye-slash']" ></font-awesome-icon>     
                </div>                
            </div>
            <div class="posttext float-left">
                <p v-if="offsite">
                    <a :href="post.o_attachment.value" class="title">
                       {{ post.data.json_metadata.title }}
                    </a>
                    <span class="offsite" v-if="offsite">({{ offsite }})</span>
                </p>
                <p v-else>
                    <router-link v-if="post.id" :to="thread_link" class="title">
                        {{ post.data.json_metadata.title }}
                    </router-link>
                </p>
                
                <post-attachment
                  v-if="thread"
                  ref="post_attachment" 
                  :attachment="post.data.json_metadata.attachment"
                  :id="'content-' + post.data.post_uuid"
                  :collapse="false">
                </post-attachment>

                <p v-html="post_content_html"></p>

                <div v-if="post.referendum">
                  <div v-for="(o, i) in post.referendum.options" :key="i" class="mb-1">
                    <input v-if="identity.account" class="form-check-input" type="radio" name="vote" :value="i" v-model="vote_value">
                    <div class="progress">
                      <div class="progress-bar" role="progressbar" :style="'width: ' + post.referendum.details.votes[i].percent + '%; background-color: ' + referendumColor(i)">
                        {{ o }} ({{ post.referendum.details.votes[i].percent }}%)
                      </div>
                    </div>
                  </div>
                  <div class="text-center" v-if="identity.account && !post.referendum.expired">
                    <a href="javascript:void(0)" class="btn btn-primary" v-on:click="referendumVote()">vote</a>
                  </div>
                </div>
            </div>
            <div class="clearfix"></div>
         </div>
         <div class="postinfobot">
            <div class="posted">
                <ul class="list-inline">
                    <li class="list-inline-item">
                        <router-link v-if="!thread && post.transaction" :to="thread_link">
                            <font-awesome-icon :icon="['fas', 'reply']" ></font-awesome-icon>
                            <span v-if="!post.parent">{{ post.total_replies }} comments</span>
                        </router-link>
                        <a v-else href="javascript:void(0)" v-on:click="showQuickReply()">
                            <font-awesome-icon :icon="['fas', 'reply']" ></font-awesome-icon>
                            reply
                        </a>
                    </li>
                    <li v-if="post.referendum" class="list-inline-item">
                      <img src="https://cdn.novusphere.io/static/eos3.svg" style="display: inline-block; height: 2em">
                      {{ post.referendum.details.total_eos.toFixed(4) }}
                    </li>
                    <li v-if="is_mine && thread && !post.referendum" class="list-inline-item">
                      <router-link v-if="is_op" :to="{ name: 'EditThread', params: { sub: sub, edit_id: post.o_transaction } }">
                        <font-awesome-icon :icon="['fas', 'edit']" ></font-awesome-icon>
                        edit
                      </router-link>
                      <a v-else href="javascript:void(0)" v-on:click="showQuickEdit()">
                        <font-awesome-icon :icon="['fas', 'edit']" ></font-awesome-icon>
                        edit
                      </a>
                    </li>
                    <li class="list-inline-item" v-if="!post.referendum">
                        <font-awesome-icon :icon="['fas', 'clock']" ></font-awesome-icon>  
                        {{ new Date(post.createdAt * 1000).toLocaleString() }}
                        
                        <router-link  v-if="post.id && is_edit" :to="{ name: 'History', params: { id: post.o_transaction } }">
                          <font-awesome-icon :icon="['fas', 'history']" ></font-awesome-icon>  
                      </router-link>
                    </li>
                    <li class="list-inline-item" v-else>
                      <span v-if="post.referendum.expired" class="text-danger">expired</span>
                      <span v-else>expires on {{ new Date(post.referendum.expires_at * 1000).toLocaleString() }}</span>
                    </li>
                    <li class="list-inline-item">
                        <a v-if="reddit.author" :href="`https://www.reddit.com/user/${reddit.author}`">
                          by 
                          <font-awesome-icon :icon="['fab', 'reddit']" ></font-awesome-icon> 
                          {{ poster_name }} 
                        </a>
                        <router-link v-else-if="post.transaction" :to="{ name: 'UserProfile', params: { account: post.data.poster } }">
                          by 
                          <font-awesome-icon v-if="is_anon_alias" :icon="['fas', 'user-secret']" ></font-awesome-icon> 
                          {{ poster_name }}
                        </router-link>
                    </li>
                    <li class="list-inline-item" v-if="!thread || post.depth == 0">
                        in 
                        <router-link v-if="post.id" :to="{ name: 'Sub', params: { sub: post.data.json_metadata.sub } }">
                          {{ post.data.json_metadata.sub }}
                        </router-link>
                    </li>
                    <li class="list-inline-item" v-if="post.depth > 0">
                        <a v-if="reddit.author" :href="reddit.permalink">
                          <font-awesome-icon :icon="['fab', 'reddit']" ></font-awesome-icon> 
                          permalink
                        </a>
                        <router-link v-else-if="post.transaction" :to="perma_link">
                          permalink
                        </router-link>
                    </li>
                    <li class="list-inline-item">
                      <a :href="`https://eosq.app/tx/${post.transaction}`">
                        <font-awesome-icon :icon="['fas', 'link']" ></font-awesome-icon>  
                      </a>      
                    </li>
                </ul>
            </div>

            <div :class="'row quick-reply ' + ((show_quick_reply || show_quick_edit) ? '': 'collapse')" :id="'qreply-' + post.data.post_uuid">
              <div class="col-sm-12">
                <textarea rows="2" class="form-control" placeholder="Content" v-model="quick_reply"></textarea>
              </div>
              <div class="col-sm-12 text-center" v-if="status">
                <span>{{ status }}</span>
              </div>
              <div class="col-sm-12 mt-1 mb-2">
                <button v-if="identity.account" type="button" class="btn btn-sm btn-outline-primary" v-on:click="quickReply(false)">{{ show_quick_edit ? 'edit' : 'post' }}</button>
                <button v-if="show_quick_reply" type="button" class="btn btn-sm btn-outline-primary" v-on:click="quickReply(true)">post anon</button>
              </div>
            </div>

            <div class="clearfix"></div>
         </div>

        <div style="margin-left:5px; margin-bottom: 1px;" v-for="child in post.children" :key="child.o_id">
          <div v-if="!(child.hide)">
            <post :post="child" :thread="thread"></post>
          </div>
        </div>

      </div>
      <!-- POST -->
   </div>
</template>

<script>
import { FORUM_BRAND } from "@/ui/constants";
import ui from "@/ui";
import requests from "@/requests";
import { GetIdentity } from "@/eos";
import { MarkdownParser } from "@/markdown";
import { moderation } from "@/moderation";

import PostAttachment from "@/components/core/PostAttachment.vue";

import { Post } from "@/types/post";

export default {
  name: "Post",
  components: {
    PostAttachment
  },
  props: {
    post: {
      type: Object,
      required: true
    },
    thread: {
      type: Object,
      required: false,
      default: null
    }
  },
  computed: {
    is_edit() {
      return (
        this.post.data.json_metadata.edit && this.post.o_id != this.post.id
      );
    },
    is_mine() {
      return (
        this.identity.account && this.post.data.poster == this.identity.account
      );
    },
    is_op() {
      return !this.post.data.reply_to_poster;
    },
    offsite() {
      if (
        this.post.o_attachment.type == "url" &&
        this.post.o_attachment.value
      ) {
        return ui.helpers.GetHost(this.post.o_attachment.value);
      }
      return null;
    },
    sub() {
      return this.thread
        ? this.thread.data.json_metadata.sub
        : this.post.data.json_metadata.sub;
    },
    thread_link() {
      const id = this.post.parent
        ? this.post.parent.o_id
        : this.thread
          ? this.thread.o_id || this.thread.o_transaction
          : this.post.o_id || this.post.o_transaction;

      return {
        name: "Thread",
        params: {
          sub: this.sub,
          id: id,
          title: this.thread
            ? this.thread.getUrlTitle()
            : this.post.getUrlTitle()
        }
      };
    },
    perma_link() {
      var link = this.thread_link;
      link.params.child_id = this.post.o_id || this.post.o_transaction;
      return link;
    },
    post_content_html() {
      var md = new MarkdownParser(this.post.data.content, this.post.createdAt);
      return md.html;
    },
    reddit() {
      return this.post.data.json_metadata.reddit;
    },
    is_anon_alias() {
      return (
        this.post.data.poster == "eosforumanon" &&
        this.post.data.json_metadata.anon_id.name
      );
    },
    poster_name() {
      if (this.reddit.author) {
        return this.reddit.author;
      } else if (this.is_anon_alias) {
        return this.post.data.json_metadata.anon_id.name.substring(0, 12);
      } else {
        return this.post.data.poster;
      }
    },
    thumbnail() {
      var t = this.post.data.json_metadata.attachment.thumbnail;
      if (!t) {
        if (this.reddit.author) {
          t = "https://cdn.novusphere.io/static/reddit.png";
        } else {
          t = FORUM_BRAND.logo;
        }
      }
      return t;
    }
  },
  async mounted() {
    this.identity = await GetIdentity();

    this.is_spam = await moderation.isBlocked(
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
  },
  methods: {
    showQuickEdit() {
      this.show_quick_edit = !this.show_quick_edit;
      this.quick_reply = this.show_quick_edit ? this.post.data.content : "";

      this.show_quick_reply = false;
    },
    showQuickReply() {
      this.show_quick_reply = !this.show_quick_reply;
      if (this.show_quick_edit) {
        this.quick_reply = "";
      }
      this.show_quick_edit = false;
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
    },
    async quickReply(anon) {
      const content = this.quick_reply;
      const attachment = this.post.data.json_metadata.attachment;

      this.setStatus("Generating post...");

      if (anon) {
        await requests.sleep(100); // allow UI thread to update (generating anon id sig can lag)
      }

      var eos_post = {
        poster: anon ? "eosforumanon" : this.identity.account,
        reply_to_poster:
          this.post.data.reply_to_poster || this.post.data.poster, // thread creator
        reply_to_post_uuid:
          this.post.data.reply_to_post_uuid || this.post.data.post_uuid, // thread uuid
        certify: 0,
        content: content,
        post_uuid: ui.helpers.GeneratePostUuid(),
        json_metadata: JSON.stringify({
          title: "",
          type: "novusphere-forum",
          sub: this.sub,
          parent_uuid: this.post.data.post_uuid,
          parent_poster: this.post.data.poster,
          edit: this.show_quick_edit ? true : false,
          attachment: {
            value: this.show_quick_edit ? attachment.value : "",
            type: this.show_quick_edit ? attachment.type : "",
            display: this.show_quick_edit ? attachment.display : ""
          },
          anon_id: anon ? ui.helpers.GenerateAnonData(content) : null
        })
      };

      this.setStatus("Waiting on confirmation / posting service...");

      var txid = await ui.actions.PushNewPost(
        eos_post,
        this.post.transaction,
        anon,
        true,
        this.setStatus,
        true // skip waiting for index
      );

      if (!txid) {
        return;
      }

      // new: instead of refreshing, splice new post into the thread
      if (this.show_quick_edit) {
        this.post.data.content = this.quick_reply;
      } else {
        var new_post = new Post({
          createdAt: parseInt(new Date().getTime() / 1000),
          transaction: txid,
          id: 0,
          name: "post",
          data: eos_post
        });

        await new_post.normalize();

        new_post.depth = this.post.depth + 1;

        this.post.children.splice(0, 0, new_post);
      }

      this.show_quick_reply = false;
      this.show_quick_edit = false;
      this.quick_reply = "";
      this.setStatus("");
    },
    setStatus(message) {
      this.status = message;
    },
    referendumColor(i) {
      return i >= this.referendum_colors.length
        ? this.referendum_colors[0]
        : this.referendum_colors[i];
    },
    async referendumVote() {
      if (!this.identity.account) {
        alert("You must be logged in to vote");
        return;
      }

      if (this.post.referendum.expired) {
        alert("This proposal has expired and can no longer be voted on");
        return;
      }

      var txid = await ui.actions.Referendum.Vote(
        this.post.transaction,
        this.vote_value
      );
      alert(
        `Snapshots are taken every hour, so it may take awhile before your vote is processed. Below is your transaction id. ${txid}`,
        {
          title: "Thanks for voting!",
          text_class: "text-success"
        }
      );
    }
  },
  data() {
    return {
      vote_value: 0,
      referendum_colors: ["#dc3545", "#28a745"],
      status: "",
      identity: {},
      show_quick_reply: false,
      show_quick_edit: false,
      quick_reply: "",
      is_nsfw: false,
      is_spam: false
    };
  }
};
</script>
