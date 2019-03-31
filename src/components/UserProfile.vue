<template>

  <layout :load="load">
    <template slot="topic">
      <span>u/{{ account }}</span>
    </template>

    <template slot="content">
      <b-tabs>
        <b-tab title="comments" active>
          <div class="mt-2 mb-2">
            <div class="float-right">
              <pager :pages="pages" :current_page="current_page"></pager>
            </div>
            <div class="clearfix"></div>
          </div>

          <div class="post-container" v-if="!loading">
            <div v-if="posts.length == 0">
              <div class="text-center">
                <h1>There doesn't seem to be any posts here! Why not make one?</h1>
              </div>
            </div>

            <post
              v-for="p in posts"
              class="post-parent"
              :key="p.o_id"
              :showAsFeed="true"
              @openPost="$_openPost"
              :post="p"
            />
            <modal
              @click.native="$_closePost"
              v-if="selectedPostID">
              <thread-modal
                @click.native.stop
                :id="selectedPostID"
              />
            </modal>
          </div>
          <div class="text-center" v-else>
            <h1><font-awesome-icon :icon="['fas', 'spinner']" spin></font-awesome-icon></h1>
          </div>
        </b-tab>
        <b-tab title="threads" >
          Threads...
        </b-tab>
        <b-tab title="blogs">
          Blogs...
        </b-tab>
      </b-tabs>
      <modal @mousedown.native.stop="closeSendAtmosModal()" v-if="showSendAtmosModal">
        <div class="modal-container">
          <div @mousedown.stop class="send-atmos-modal">
            <div>
              Send ATMOS
            </div>
            <div>
              <label> To: </label>
              <div class="form-control">
                {{ account }}
              </div>
            </div>
            <div>
              <label> Amount: </label>
              <input class="form-control" type="text" v-model="modal.amount" />
            </div>
            <div class="footer">
              <button type="button" @click="closeSendAtmosModal()" class="btn btn-danger">
                Cancel
              </button>
              <button type="button" @click="closeSendAtmosModal()" class="btn btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>
      </modal>
    </template>

    <template slot="right_sidebar">
      <div class="block">
        <div class="blocktxt">
          <div> 
            <img v-if="user_icons.length > 0" v-for="(icon, i) in user_icons" :key="i" width="25" height="25" :src="icon">     
            <font-awesome-icon v-else class="fas" :icon="['fas', 'user-circle']" />

            {{ account }} 
          </div>
          <button class="btn btn-primary mt-3" v-on:click="toggleFollow()">
            {{ is_followed ? 'Unfollow' : 'Follow' }}
          </button>
          <button class="btn btn-danger mt-3" v-on:click="toggleBlock()">
            {{ is_blocked ? 'Unblock' : 'Block' }}
          </button>
        </div>
        <div class="divline"></div>
        <div class="blocktxt">
          Balances: {{ balances.atmos }} ATMOS
        </div>
        <div class="blocktxt">
          Comments: {{ comments }}
        </div>
        <div class="blocktxt">
          Threads: {{ threads }}
        </div>
        <div class="blocktxt">
          Last Activity: {{ last_activity }}
        </div>
        <div class="blocktxt">
          <button class="btn btn-primary" @click="showSendAtmosModal = true">
            Send ATMOS
          </button>
        </div>
      </div>
    </template>

  </layout>

</template>

<script>
import ui from "@/ui";

import { GetEOS, GetIdentity, ScatterEosOptions } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import Layout from "@/components/section/Layout";
import Modal from "@/components/modal/Modal.vue";
import ThreadModal from "@/components/ThreadModal.vue";

export default {
  name: "UserProfile",
  components: {
    Layout,
    Pager,
    Post,
    PostSorter,
    Modal,
    ThreadModal
  },
  watch: {
    "$route.query.page": function() {
      this.load();
    },
    "$route.params.account": function() {
      this.load();
    }
  },
  async mounted() {
    //this.$refs.sorter.by = "time";
    this.load();
  },
  computed: {},
  methods: {
    async load() {
      this.loading = true;
      this.account = this.$route.params.account;

      const novusphere = GetNovusphere();
      var profile = await ui.views.UserProfile(
        this.$route.query.page,
        this.$route.params.account,
        novusphere.query.sort.time()
      );

      this.current_page = profile.current_page;
      this.account = profile.account;
      this.user_icons = profile.user_icons;
      this.is_blocked = profile.is_blocked;
      this.is_followed = profile.is_followed;
      this.balances.atmos = profile.balance_atmos;
      this.comments = profile.n_comments;
      this.threads = profile.n_threads;
      this.last_activity = profile.last_activity;
      this.posts = profile.posts;
      this.pages = profile.pages;
      this.loading = false;
    },
    async toggleBlock() {
      if (!this.account) {
        return;
      }

      await ui.actions.ToggleBlockUser(this.account, this.is_blocked);
      this.is_blocked = !this.is_blocked;
    },
    async toggleFollow() {
      if (!this.account) {
        return;
      }

      await ui.actions.ToggleFollowUser(this.account, this.is_followed);
      this.is_followed = !this.is_followed;
    },

    closeSendAtmosModal() {
      this.showSendAtmosModal = false;
      this.modal = {
        amount: 0,
      }
    }
  },
  data() {
    return {
      loading: false,
      is_blocked: false,
      is_followed: false,
      account: "",
      balances: {
        atmos: 0
      },
      comments: 0,
      threads: 0,
      last_activity: "",
      posts: [],
      user_icons: [],
      current_page: 1,
      pages: 0,
      selectedPostID: undefined,
      showSendAtmosModal: false,
      modal: {
        amount: 0,
      }
    };
  }
};
</script>

<style scoped>
.modal-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.send-atmos-modal {
  background-color: white;
  width: 400px;
  padding: 20px;
  color: black;
}

.send-atmos-modal > div {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}
.send-atmos-modal > div > label {
  width: 100px;
  margin: 0;
}
.send-atmos-modal .footer {
  justify-content: flex-end;
  margin: 0;
}
.send-atmos-modal .footer button {
  margin-left: 10px;
}
</style>