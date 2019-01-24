<template>
  <!-- POST -->
  <div
    @click="openPost"
    class="post">
    <template v-if="post.depth !== 0">
      <div
        @click.stop="togglePost()"
        class="post-toggle">
        <font-awesome-icon
          class="toggle-icon"
          :icon="['fas', hide ? 'plus-circle' : 'minus-circle']"
        />
        <font-awesome-icon class="user" :icon="['fas', reddit ? 'reddit' : 'user-secret']" />
        <li class="list-inline-item">
          <a v-if="reddit.author"
            @click.stop
            :href="`https://www.reddit.com/user/${reddit.author}`">
            <font-awesome-icon :icon="['fab', 'reddit']" />
            {{ poster_name }}
          </a>
          <router-link
            v-else-if="post.transaction"
            @click.stop
            :to="{ name: 'UserProfile', params: { account: post.data.poster } }">
            <font-awesome-icon v-if="is_anon_alias" :icon="['fas', 'user-secret']" />
            {{ poster_name }}
          </router-link>
        </li>
        <div class="date">
          {{ new Date(post.createdAt * 1000).toLocaleString() }}
        </div>
        <div class="flex-center received-tips">
          <div :key="key" class="flex-center" v-for="(tip, key) in received_tips">
            <img class="tip-icon" :src="$root.icons[key].logo" :title="`${tip}-${key}`" />
            <div class="tip-amount"> x {{ tip }} </div>
          </div>
        </div>
      </div>
    </template>
    <div class="post-body" :class="{'hidden': hide === true && post.depth !== 0}">
      <div class="topwrap">

        <div class="userinfo float-left">
          <div v-if="!thread && !post.referendum"
            class="postthumbnail">
            <img :src="thumbnail"
              class="img-fluid"
              alt="thumbnail">
          </div>

          <div v-if="!post.referendum"
            class="text-center">
            <a
              class="up"
              @click.stop="upvote()">
              <font-awesome-icon :icon="['far', 'thumbs-up']" />
              {{ post.up }}
            </a>
          </div>

          <div v-else class="text-center">
            <div>
              <font-awesome-icon :icon="['fas', 'user']" />
              {{ post.referendum.details.total_participants }}
            </div>
          </div>

          <div class="text-center">
            <font-awesome-icon v-if="post.is_pinned" :icon="['fas', 'thumbtack']" />
            <font-awesome-icon v-if="is_spam" :icon="['fas', 'exclamation-triangle']" />
            <font-awesome-icon v-if="is_nsfw" :icon="['fas', 'eye-slash']" />
          </div>
        </div>

        <div class="posttext float-left">
          <div>
              <div class="flex-center">
                <a @click.stop="$emit('openPost', selectedPostID, post.data.json_metadata.sub)" class="title" target="_blank">
                  {{ post.data.json_metadata.title }}
                </a>
                <a v-if="offsite" :href="post.o_attachment.value" class="offsite" target="_blank">
                  ({{ offsite }})
                </a>
                <template v-if="post.depth === 0">
                  <div class="flex-center received-tips">
                    <div :key="key" class="flex-center" v-for="(tip, key) in received_tips">
                      <img class="tip-icon" :src="$root.icons[key].logo" :title="`${tip}-${key}`" />
                      <div class="tip-amount"> x {{ tip }} </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="post.depth === 0">
                <li class="list-inline-item">
                  <a v-if="reddit.author"
                    @click.stop
                    :href="`https://www.reddit.com/user/${reddit.author}`">
                    <font-awesome-icon :icon="['fab', 'reddit']" />
                    {{ poster_name }}
                  </a>
                  <router-link
                    v-else-if="post.transaction"
                    @click.stop
                    :to="{ name: 'UserProfile', params: { account: post.data.poster } }">
                    <font-awesome-icon v-if="is_anon_alias" :icon="['fas', 'user-secret']" />
                    {{ poster_name }}
                  </router-link>
                </li>
                <li v-if="!thread || post.depth == 0"
                  class="list-inline-item">
                  in
                  <router-link
                    @click.stop
                    v-if="post.id"
                    :to="{ name: 'Sub', params: { sub: post.data.json_metadata.sub } }">
                    {{ post.data.json_metadata.sub }}
                  </router-link>
                </li>
              </div>
          </div>
          <div>
            <post-attachment
              ref="post_attachment"
              :attachment="post.data.json_metadata.attachment"
              :id="'content-' + post.data.post_uuid"
              :collapse="false">
            </post-attachment>
          </div>
          <div v-if="post.referendum">
            <div v-for="(o, i) in post.referendum.options" :key="i" class="mb-1">
              <input v-if="identity.account && !is_multi_referendum" class="form-check-input" type="radio" name="vote" :value="i" v-model="vote_value">
              <input v-if="identity.account && is_multi_referendum" class="form-check-input" type="checkbox" name="vote2" v-model="vote_value_multi[i]">
              <div class="progress">
                <div class="referendumbar progress-bar" role="progressbar" :style="'width: ' + post.referendum.details.votes[i].percent + '%; background-color: ' + referendumColor(i)">
                  {{ o }} ({{ post.referendum.details.votes[i].percent }}%)
                </div>
              </div>
            </div>

            <div class="text-center" v-if="identity.account">
              <a class="btn btn-sm btn-outline-primary" :class="{'referendum' : post.referendum}" @click.stop="referendumVote()" v-if="!post.referendum.expired">vote</a>
              <a class="btn btn-sm btn-outline-secondary" @click.stop="referendumExpire()" v-if="!post.referendum.expired && post.data.poster == identity.account">expire</a>
              <a class="btn btn-sm btn-outline-secondary" @click.stop="referendumClean()" v-if="post.data.poster == identity.account">clean</a>
            </div>
          </div>

          <p v-if="post_content_html" v-html="post_content_html" />
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="postinfobot">
        <div class="posted">
          <ul class="list-inline">
            <li class="list-inline-item">
              <router-link @click.stop v-if="!thread && post.transaction" :to="thread_link">
                  <font-awesome-icon :icon="['fas', 'reply']" />
                  <span v-if="!post.parent">{{ post.total_replies }} comments</span>
              </router-link>
              <a class="reply" v-else @click.stop="showQuickReply()">
                <font-awesome-icon :icon="['fas', 'reply']" />
                reply
              </a>
            </li>
            <li v-if="post.referendum" class="list-inline-item">
              <img src="https://cdn.novusphere.io/static/eos3.svg" style="display: inline-block; height: 2em">
              {{ post.referendum.details.total_eos.toFixed(4) }}
            </li>
            <li v-if="is_mine && thread && !post.referendum" class="list-inline-item">
              <router-link @click.stop v-if="is_op" :to="{ name: 'EditThread', params: { sub: sub, edit_id: post.o_transaction } }">
                <font-awesome-icon :icon="['fas', 'edit']" />
                edit
              </router-link>
              <a v-else @click.stop="showQuickEdit()">
                <font-awesome-icon :icon="['fas', 'edit']" />
                edit
              </a>
            </li>
            <li class="list-inline-item" v-if="post.depth === 0">
              <template v-if="!post.referendum">
                <font-awesome-icon :icon="['fas', 'clock']" />
                {{ new Date(post.createdAt * 1000).toLocaleString() }}
              </template>
              <router-link
                @click.stop
                v-if="post.id && is_edit"
                :to="{ name: 'History', params: { id: post.o_transaction } }">
                <font-awesome-icon :icon="['fas', 'history']" />
              </router-link>
            </li>
            <li v-if="post.referendum" class="list-inline-item">
              <span v-if="post.referendum.expired" class="text-danger">expired</span>
              <span v-else>expires on {{ new Date(post.referendum.expires_at * 1000).toLocaleString() }}</span>
            </li>
            <li v-if="post.depth > 0"
              class="list-inline-item">
              <a
                @click.stop
                v-if="reddit.author"
                :href="reddit.permalink">
                <font-awesome-icon :icon="['fab', 'reddit']" />
                permalink
              </a>
              <router-link
                @click.stop
                v-else-if="post.transaction"
                :to="perma_link">
                permalink
              </router-link>
            </li>
            <li class="list-inline-item">
              <a @click.stop :href="`https://eosq.app/tx/${post.transaction}`">
                <font-awesome-icon :icon="['fas', 'link']" />
              </a>
            </li>
          </ul>
        </div>

        <div :class="'quick-reply ' + ((show_quick_reply || show_quick_edit) ? '': 'collapse')"
          :id="'qreply-' + post.data.post_uuid">
          <div class="col-sm-12">
            <textarea rows="2" class="form-control" placeholder="Content" v-model="quick_reply"></textarea>
          </div>
          <div class="col-sm-12 text-center" v-if="status">
            <span>{{ status }}</span>
          </div>
          <div class="col-sm-12 mt-1 mb-2">
            <button v-if="identity.account" type="button" class="btn btn-sm btn-outline-primary" @click="quickReply(false)">{{ show_quick_edit ? 'edit' : 'post' }}</button>
            <button v-if="show_quick_reply" type="button" class="btn btn-sm btn-outline-primary" @click="quickReply(true)">post anon</button>
          </div>
        </div>

        <div class="clearfix"></div>
      </div>
    </div>
    <template v-if="post.depth <= 5">
      <div
        v-for="child in post.children"
        :key="child.o_id">
        <div>
          <post
            v-if="hide === false"
            class="post-child"
            :post="child"
            :thread="thread"
          />
        </div>
      </div>
    </template>

  </div>
  <!-- POST -->
</template>

<script>
import { FORUM_BRAND } from "@/ui/constants";
import ui from "@/ui";
import requests from "@/requests";
import { GetIdentity, GetTokensInfo } from "@/eos";
import { MarkdownParser } from "@/markdown";
import { moderation } from "@/moderation";
import PostAttachment from "@/components/core/PostAttachment.vue";

import { Post } from "@/types/post";

export default {
  name: "Post",
  components: {
    PostAttachment,
  },
  props: {
    preview: {
      type: Boolean,
      required: false,
      default: false,
    },
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
    received_tips() {
      const tips = {};
      this.post.children.forEach(child => {
        if (child.tips) {
          child.tips.forEach(tip => {
            if (tips[tip.symbol] === undefined) {
              tips[tip.symbol] = Number(tip.amount);
            } else {
              tips[tip.symbol] += Number(tip.amount);
            }
          })
        }
      })
      return tips;
    },
    is_multi_referendum() {
      return this.post.referendum && this.post.referendum.type == 'multi-select-v1';
    },
    multi_vote_value() {
      var value = 0;
      for (var i = 0; i < this.vote_value_multi.length; i++) {
        if (this.vote_value_multi[i]) {
          value |= (1 << i);
        }
      }
      return value;
    },
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
        this.post.data.json_metadata.attachment.type == "url" &&
        this.post.data.json_metadata.attachment.value
      ) {
        return ui.helpers.GetHost(this.post.data.json_metadata.attachment.value);
      }
      return null;
    },
    sub() {
      return this.thread
        ? this.thread.data.json_metadata.sub
        : this.post.data.json_metadata.sub;
    },
    selectedPostID() {
      return this.post.parent ? this.post.parent.o_id : this.thread
      ? this.thread.o_id || this.thread.o_transaction : this.post.o_id || this.post.o_transaction;
    },
    selectedPostTitle() {
      return this.thread ? this.thread.getUrlTitle() : this.post.getUrlTitle();
    },
    thread_link() {
      const id = this.selectedPostID;
      return {
        name: "Thread",
        params: {
          sub: this.sub,
          id: id,
          title: this.selectedPostTitle,
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
      // var t = this.post.data.json_metadata.attachment.thumbnail;
      let t;
      // if (!t) {
        if (this.reddit.author) {
          t = "https://cdn.novusphere.io/static/reddit.png";
        } else {
          t = FORUM_BRAND.logo;
        }
      // }
      return t;
    }
  },
  async mounted() {
    if (this.$root.icons.length === 0) {
      const response = await GetTokensInfo();
      const icons = {};
      response.forEach(x => {
        icons[x.symbol] = x;
      })
      this.$root.icons = icons;
    }
    this.hide = this.is_spam ? true : false;
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
          anon_id: anon ? await ui.helpers.GenerateAnonData(content) : null
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
    async referendumClean() {
      await ui.actions.Referendum.CleanProposal(this.post.transaction);
    },
    async referendumExpire() {
      await ui.actions.Referendum.Expire(this.post.transaction);
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
        this.is_multi_referendum ? this.multi_vote_value : this.vote_value
      );
      alert(
        `Snapshots are taken every hour, so it may take awhile before your vote is processed. Below is your transaction id. ${txid}`,
        {
          title: "Thanks for voting!",
          text_class: "text-success"
        }
      );
    },
    togglePost() {
      this.hide = !this.hide;
      this.$forceUpdate();
    },
    openPost() {
      if (screen.width > 600) {
        this.$emit('openPost', this.selectedPostID, this.post.data.json_metadata.sub)
      } else {
        this.$router.push(this.thread_link);
      }
    }
  },
  data() {
    return {
      vote_value_multi: [ 0, 0, 0, 0, 0, 0, 0, 0 ],
      vote_value: 0,
      referendum_colors: [
        "#dc3545",
        "#28a745",
        "#98FB98",
        "#48D1CC",
        "#A52A2A",
        "#9932CC",
        "#FFE4E1",
        "#FFDAB9"
      ],
      status: "",
      identity: {},
      show_quick_reply: false,
      show_quick_edit: false,
      quick_reply: "",
      is_nsfw: false,
      is_spam: false,
      hide: false,
    };
  }
};
</script>

<style scoped>
.referendum {
  display: none;
}
.modal .referendum {
  display: inherit;
}
.post-toggle {
  height: 20px;
  color: black;
  display: flex;
  align-items: center;
}
.toggle-icon {
  margin-right: 5px;
}
.post-toggle:hover, .reply:hover, .up:hover, .title:hover {
  cursor:pointer;
}

.tip-icon {
  height: 25px !important;
  width: 25px!important;
}
.date {
  margin-left: 15px;
}
.tip-amount {
  margin: 3px;
}
.received-tips {
  margin-left: 10px;
  margin-right: 10px;
}
</style>