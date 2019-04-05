<template>
  <!-- POST -->
  <div
    v-if="!(!showChildren && hide_spam_threads && is_spam)"
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
        <li class="list-inline-item">
          <a v-if="reddit.author"
            @click.stop
            :href="`https://www.reddit.com/user/${reddit.author}`">
            <font-awesome-icon class="fas" :icon="['fab', 'reddit']" />
            {{ poster_name }}
          </a>
          <router-link
            v-else-if="post.transaction"
            @click.native.stop
            :class="{'disabled': is_anon_alias}"
            :to="{ name: 'UserProfile', params: { account: post.data.poster } }">

            <img v-if="post.user_icons.length > 0" v-for="(icon, i) in post.user_icons" :key="i" width="25" height="25" :src="icon">     
            <font-awesome-icon v-if="post.user_icons.length == 0" class="fas" :icon="['fas', is_anon_alias ? 'user-secret' : 'user-circle']" />

            {{ poster_name }}
          </router-link>
        </li>
        <div class="date">
          {{ created_at }}
        </div>
        <div class="flex-center received-tips ml-1">
          <div
            :title="`${tip} ${key}`"
            @click.stop.prevent="goToSub(key)"
            :key="key"
            class="flex hover"
            v-for="(tip, key) in received_tips">
            <img v-if="key in $root.icons" class="tip-icon" :src="$root.icons[key].logo" />
            <span v-else>{{ key }}</span>
            <div class="tip-amount"> x {{ tip }} </div>
          </div>
        </div>
      </div>
    </template>
    <div class="post-body" :class="{'hidden': hide === true && post.depth !== 0}">
      <div class="flex-column">

        <div class="userinfo">
          <div v-if="is_op" class="post-icon" >
            <div>
              <img class="hover" @click.stop.prevent="goToSub()" :src="thumbnail" alt="thumbnail">
            </div>
            <div v-if="post.referendum && post.referendum.details" class="text-center">
              <div>
                <font-awesome-icon :icon="['fas', 'user']" />
                {{ post.referendum.details.total_participants }}
              </div>
            </div>
          </div>
          <div>
              <div class="flex-center">

                <a @click.stop="$emit('openPost', selectedPostID, post.data.json_metadata.sub)" class="title" target="_blank">
                  {{ post.data.json_metadata.title }}
                </a>
                <div v-if="post.is_pinned || is_spam || is_nsfw" class="text-center ml-1 mr-1">
                  <font-awesome-icon v-if="post.is_pinned" :icon="['fas', 'thumbtack']" />
                  <font-awesome-icon v-if="is_spam" :icon="['fas', 'exclamation-triangle']" />
                  <font-awesome-icon v-if="is_nsfw" :icon="['fas', 'eye-slash']" />
                </div>
                <a v-if="offsite" :href="post.data.json_metadata.attachment.value" class="offsite" target="_blank">
                  ({{ offsite }})
                </a>
                <template v-if="is_op">
                  <div class="flex-center received-tips ml-1">
                    <div
                      :title="`${tip} ${key}`"
                      @click.stop.prevent="goToSub(key)"
                      :key="key"
                      class="flex hover"
                      v-for="(tip, key) in received_tips"
                    >
                        <img v-if="key && (key in $root.icons)" class="tip-icon" :src="$root.icons[key].logo"/>
                        <div v-else>{{ key }}</div>
                        <div class="tip-amount"> x {{ tip }} </div>
                    </div>
                  </div>
                </template>
              </div>
              <div v-if="is_op">
                <li class="list-inline-item">
                  <a v-if="reddit.author"
                    @click.stop
                    :href="`https://www.reddit.com/user/${reddit.author}`">
                    <font-awesome-icon :icon="['fab', 'reddit']" />
                    {{ poster_name }}
                  </a>
                  <router-link
                    v-else-if="post.transaction"
                    @click.native.stop
                    :class="{'disabled': is_anon_alias}"
                    :to="{ name: 'UserProfile', params: { account: post.data.poster } }">
                    
                    <img v-if="post.user_icons.length > 0" v-for="(icon, i) in post.user_icons" :key="i" width="25" height="25" :src="icon">
                    <font-awesome-icon v-if="post.user_icons.length == 0"  class="fas" :icon="['fas', is_anon_alias ? 'user-secret' : 'user-circle']" />

                    {{ poster_name }}
                  </router-link>
                </li>
                <li v-if="!thread || is_op"
                  class="list-inline-item">
                  in
                  <router-link
                    @click.native.stop
                    v-if="post.id"
                    :to="{ name: 'Sub', params: { sub: post.data.json_metadata.sub } }">
                    {{ post.data.json_metadata.sub }}
                  </router-link>
                </li>
              </div>
          </div>
          <div v-if="is_op" class="op-upvote">
            <a
              class="up"
              @click.stop="upvote()">
              <font-awesome-icon :icon="['fas', 'caret-up']" />
              {{ post.up }}
            </a>
          </div>
        </div>

        <div
          class="posttext float-left"
          :class="{
            'op-posttext': is_op
          }"
        >
          <div>
            <post-attachment
              ref="post_attachment"
              :attachment="post.data.json_metadata.attachment"
              :id="'content-' + post.data.post_uuid"
              :collapse="false">
            </post-attachment>
          </div>
          <div v-if="post.referendum && post.referendum.details">

            <div v-for="(o, i) in post.referendum.options" :key="i" class="mb-1">
              <div class="progress">
                <input v-if="identity.account && !is_multi_referendum" class="checkbox" type="radio" name="vote" :value="i" v-model="vote_value">
                <input v-if="identity.account && is_multi_referendum" class="checkbox" type="checkbox" name="vote2" v-model="vote_value_multi[i]">
                <div class="referendumbar progress-bar" role="progressbar" :style="'width: ' + post.referendum.details.votes[i].percent + '%; background-color: ' + referendumColor(i)">
                  {{ o }} ({{ post.referendum.details.votes[i].percent }}%)
                </div>
              </div>
            </div>

            <div class="text-center" v-if="identity.account">
              <a class="btn btn-sm btn-primary" :class="{'referendum' : post.referendum}" @click.stop="referendumVote()" v-if="!post.referendum.expired">vote</a>
              <a class="btn btn-sm btn-outline-secondary" @click.stop="referendumExpire()" v-if="!post.referendum.expired && post.data.poster == identity.account">expire</a>
              <a class="btn btn-sm btn-outline-secondary" @click.stop="referendumClean()" v-if="post.data.poster == identity.account">clean</a>
            </div>
          </div>
          
          <p v-if="post_content_html()" v-html="post_content_html()" />
        </div>
        <div class="clearfix"></div>
      </div>
      <div class="postinfobot">
        <div class="posted">
          <ul class="list-inline">
            <li class="list-inline-item">
              <a
                v-if="!is_op"
                class="up"
                style="margin-right: 10px;display: inline"
                @click.stop="upvote()">
                <font-awesome-icon :icon="['fas', 'caret-up']" />
                {{ post.up }}
              </a>
              <a
                v-if="!thread && post.transaction && !showAsFeed"
                class="link"
                @click.stop.prevent="$router.push(thread_link)"
              >
                <font-awesome-icon :icon="['fas', 'reply']" />
                <span v-if="!post.parent ">{{ post.total_replies }} comments</span>
              </a>
              <a class="reply" v-else-if="showAsFeed">
                <font-awesome-icon :icon="['fas', 'reply']" />
                reply
              </a>
              <a class="reply" v-else @click.stop="showQuickReply()">
                <font-awesome-icon :icon="['fas', 'reply']" />
                reply
              </a>
            </li>
            <li v-if="post.referendum && post.referendum.details && (post.referendum.details.total != undefined)" class="list-inline-item">
              <img src="https://cdn.novusphere.io/static/eos3.svg" style="display: inline-block; height: 2em">
              {{ post.referendum.details.total.toFixed(4) }}
            </li>
            <li v-if="is_mine && thread && !post.referendum" class="list-inline-item">
              <div
                class="hover"
                @click.stop="is_op ?
                $router.push({
                  name: 'EditThread',
                  params: {
                    sub: sub,
                    edit_id: post.o_transaction
                  }
                }) :
                showQuickEdit()">
                <font-awesome-icon :icon="['fas', 'edit']" />
                edit
              </div>
            </li>
            <li class="list-inline-item" v-if="is_op">
              <template v-if="!post.referendum">
                <font-awesome-icon :icon="['fas', 'clock']" />
                {{ created_at }}
              </template>
            </li>
            <li class="list-inline-item">
              <router-link
                @click.native.stop
                v-if="post.id && is_edit"
                :to="{ name: 'History', params: { id: post.o_transaction } }">
                <font-awesome-icon :icon="['fas', 'history']" />
              </router-link>
            </li>
            <li v-if="post.referendum" class="list-inline-item">
              <span v-if="post.referendum.expired" class="text-danger">expired</span>
              <span v-else>expires on {{ new Date(post.referendum.expires_at * 1000).toLocaleString() }}</span>
            </li>
            <li v-if="!is_op"
              class="list-inline-item">
              <a
                @click.stop
                v-if="reddit.author"
                target="_blank"
                :href="'https://reddit.com' + reddit.permalink">
                <font-awesome-icon :icon="['fab', 'reddit']" />
                permalink
              </a>
              <router-link
                @click.native.stop
                v-else-if="post.transaction"
                :to="perma_link">
                permalink
              </router-link>
            </li>
            <li class="list-inline-item">
              <a @click.stop
                :href="`https://eosq.app/tx/${post.transaction}`"
                target="_blank">
                <font-awesome-icon :icon="['fas', 'link']" />
              </a>
            </li>
            <li class="list-inline-item" v-if="post.depth >= 5">
              <a
                @click="
                  $root.mode = 'zen',
                  $router.push(zen_mode)
                "
                class="hover black follow-discussion"
              >
                follow the discussion
              </a>
            </li>
          </ul>
        </div>

        <div :class="'quick-reply ' + ((show_quick_reply || show_quick_edit) ? '': 'collapse')"
          :id="'qreply-' + post.data.post_uuid">
          <div class="col-sm-12">
            <textarea @click.stop rows="2" class="form-control" placeholder="Content" v-model="quick_reply"></textarea>
          </div>
          <div class="col-sm-12 text-center" v-if="status">
            <span>{{ status }}</span>
          </div>
          <div class="col-sm-12 mt-1 mb-2">
            <button v-if="identity.account" type="button" class="btn btn-sm btn-primary" @click="quickReply(false)">{{ show_quick_edit ? 'Edit' : 'Post' }}</button>
            <button v-if="show_quick_reply" type="button" class="btn btn-sm btn-primary" @click="quickReply(true)">Post ID</button>
            <button v-if="identity.account" type="button" class="btn btn-sm btn-primary" @click="addTip()">Tip</button>
          </div>
        </div>

        <div class="clearfix"></div>
      </div>
    </div>
    <template v-if="showChildren && post.depth < 5">
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
import { BRANDS, FORUM_BRAND } from "@/ui/constants";
import ui from "@/ui";
import requests from "@/requests";
import { storage } from "@/storage";
import { GetIdentity, GetTokensInfo } from "@/eos";
import { MarkdownParser } from "@/markdown";
import { moderation } from "@/moderation";
import PostAttachment from "@/components/core/PostAttachment.vue";
import moment from 'moment';
import { Post } from "@/types/post";

export default {
  name: "Post",
  components: {
    PostAttachment
  },
  props: {
    preview: {
      type: Boolean,
      required: false,
      default: false
    },
    post: {
      type: Object,
      required: true
    },
    thread: {
      type: Object,
      required: false,
      default: null
    },
    showChildren: {
      type: Boolean,
      required: false,
      default: true
    },
    showAsFeed: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  computed: {
    created_at() {
      return moment(this.post.createdAt * 1000).fromNow();
    },
    received_tips() {
      var tips = {};
      this.post.children.forEach(child => {
        if (child.tips) {
          child.tips.filter(t => t.to == this.post.data.poster).forEach(tip => {
            if (tips[tip.symbol] === undefined) {
              tips[tip.symbol] = Number(tip.amount);
            } else {
              tips[tip.symbol] += Number(tip.amount);
            }
          });
        }
      });

      // fix precisions
      for (var sym in tips) {
        tips[sym] = tips[sym].toFixed(4).replace(/([0-9]+(\.[1-9]+)?)(\.?0+$)/,"$1");
      }

      return tips;
    },
    is_multi_referendum() {
      return (
        this.post.referendum && this.post.referendum.type == "multi-select-v1"
      );
    },
    multi_vote_value() {
      var value = 0;
      for (var i = 0; i < this.vote_value_multi.length; i++) {
        if (this.vote_value_multi[i]) {
          value |= 1 << i;
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
      return !this.post.data.reply_to_poster || this.showAsFeed;
    },
    offsite() {
      if (
        this.post.data.json_metadata.attachment.type == "url" &&
        this.post.data.json_metadata.attachment.value
      ) {
        return ui.helpers.GetHost(
          this.post.data.json_metadata.attachment.value
        );
      }
      return null;
    },
    sub() {
      return this.thread
        ? this.thread.data.json_metadata.sub
        : this.post.data.json_metadata.sub;
    },
    selectedPostID() {
      return this.post.parent
        ? this.post.parent.o_id
        : this.thread
          ? this.thread.o_id || this.thread.o_transaction
          : this.post.o_id || this.post.o_transaction;
    },
    selectedPostTitle() {
      return this.thread ? this.thread.getUrlTitle() : this.post.getUrlTitle();
    },
    zen_mode() {
      const id = this.selectedPostID;
      return {
        name: "Thread",
        params: {
          sub: this.sub,
          id: id,
          title: this.selectedPostTitle,
          child_id: this.post.o_id || this.post.o_transaction,
        }
      };
    },
    thread_link() {
      const id = this.selectedPostID;
      return {
        name: "Thread",
        params: {
          sub: this.sub,
          id: id,
          title: this.selectedPostTitle
        }
      };
    },
    perma_link() {
      var link = this.thread_link;
      link.params.child_id = this.post.o_id || this.post.o_transaction;
      return link;
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
      let t = null; // = this.post.data.json_metadata.attachment.thumbnail;
      t = t
        ? t
        : this.sub in BRANDS
          ? BRANDS[this.sub].logo
          : BRANDS["novusphere"].logo;
      return t;
    }
  },
  async mounted() {
    if (this.$root.icons.length === 0) {
      const response = await GetTokensInfo();
      var icons = {};
      response.forEach(x => {
        icons[x.symbol] = x;
      });
      this.$root.icons = icons;
    }

    this.identity = await GetIdentity();

    this.hide_spam_threads = storage.moderation.hide_spam_threads;

    this.is_spam = await moderation.isBlocked(
      this.post.createdAt,
      this.post.o_transaction,
      this.post.data.poster
    );

    this.hide = this.is_spam ? true : false;

    this.is_nsfw =
      (this.post.tags && this.post.tags.includes("nsfw")) ||
      (this.is_op &&
        (await moderation.isNsfw(
          this.post.createdAt,
          this.post.o_transaction
        )));
  },
  methods: {
    post_content_html() {
      let content = this.post.getContent();
      let token;
      // this is really rough lol needs to be improved
      /*if (content.split('#tip')[1]) {
        token = content.split('#tip')[1].split(' ')[2];
        content = content.replace(token, `<img width="25" height="25" src="${this.$root.icons[token].logo}" /> `);
        content = content.replace('#tip', 'tip');
        content = content.split('@')[0];
      }*/

      var md = new MarkdownParser(content, this.post.createdAt);
      return md.html;
    },
    goToSub(token) {
      const brand = Object.keys(BRANDS).find(k => {
        if (BRANDS[k].token_symbol === token) {
          return k;
        }
      })
      if (brand && brand !== this.$route.params.sub) {
        this.$router.push(`/e/${brand}`);
      } else if (!token && this.sub !== this.$route.params.sub) {
        this.$router.push(`/e/${this.sub}`);
      }
    },
    showQuickEdit() {
      this.show_quick_edit = !this.show_quick_edit;
      this.quick_reply = this.show_quick_edit ? this.post.data.content : "";

      this.show_quick_reply = false;
    },
    showQuickReply(e) {
      this.show_quick_reply = !this.show_quick_reply;
      if (this.show_quick_edit) {
        this.quick_reply = "";
      }
      this.show_quick_edit = false;
    },
    async addTip() {
      var brand = BRANDS["novusphere"];
      if (BRANDS[this.sub] && BRANDS[this.sub].token_symbol) {
        brand = BRANDS[this.sub];
      }

      const tip_amount = brand.default_tip || '1';
      const tip = `#tip ${tip_amount} ${brand.token_symbol} @${this.post.data.poster}`;

      this.quick_reply += ' ' + tip;
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
        certify: false,
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
      await ui.actions.Referendum.CleanProposal(
        this.post.referendum.transaction
      );
    },
    async referendumExpire() {
      await ui.actions.Referendum.Expire(this.post.referendum.transaction);
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
        this.post.referendum.transaction,
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
        this.$emit(
          "openPost",
          this.selectedPostID,
          this.post.data.json_metadata.sub,
          this.selectedPostTitle
        );
      } else {
        this.$router.push(this.thread_link);
      }
    }
  },
  data() {
    return {
      vote_value_multi: [0, 0, 0, 0, 0, 0, 0, 0],
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
      hide_spam_threads: false,
      hide: false
    };
  }
};
</script>

<style scoped>
.fas {
  font-size: 20px;
  margin-bottom: -3px;
}
.reply {
  color: teal!important;
  border: 1px solid teal;
  border-radius: 4px;
  padding: 2px;
}
.follow-discussion {
  border-radius: 5px;
  padding: 2px;
  border: 1px solid black;
}
.black {
  color: black !important;
}
.referendum {
  display: none;
}
.modal .referendum {
  display: inherit;
}
.post-toggle {
  color: black;
  display: flex;
  align-items: center;
  white-space: nowrap;
  flex-wrap: wrap;
}
.post-toggle .date {
  font-size: 12px;
}
.toggle-icon {
  margin-right: 5px;
}
.post-toggle:hover,
.reply:hover,
.up:hover,
.title:hover {
  cursor: pointer;
}

.tip-icon {
  height: 25px !important;
  width: 25px !important;
}
.tip-amount {
  margin: 3px;
}
.received-tips {
  margin-right: 10px;
}
.post-icon {
  width: 50px;
  margin-right: 15px;
}
.post-icon img {
  max-width: 50px!important;
}
.userinfo {
  display: flex;
}
.tip:hover {
  cursor: pointer;
}
.hover:hover {
  cursor: pointer;
}
.checkbox {
  height: 100%;
  margin-right: 5px;
  margin-left: 5px;
}
.title {
  color: black!important;
  font-weight: bold;
  font-size: 18px;
}
.op-upvote {
  margin-top:5px;
  display: flex;
  flex:1;
  justify-content:flex-end;
}
.op-upvote .up {
  white-space:nowrap;
}
.post-parent .op-posttext {
  margin-top: 10px;
  margin-bottom: 30px;
}
.up {
  color: black!important;
}
</style>