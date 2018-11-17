<template>
    <div>
        <PostHistoryModal ref="history_modal"></PostHistoryModal>
        <HeaderSection :load="load">
            <span class="title mr-3"><router-link :to="'/u/' + account">{{account}}</router-link></span>
            <a target="_blank" class="btn btn-sm btn-outline-primary ml-1" :href="'https://eosq.app/account/' + account">view on chain</a>
            <PostSorter ref="sorter" :change="load"></PostSorter>
            <button class="btn btn-sm btn-outline-danger" v-on:click="toggleBlock()">{{ is_blocked ? 'unblock' : 'block' }}</button>
        </HeaderSection>
        <MainSection>
        <div>
            <div class="row mb-4">
                <div class="col-md-6 col-12">
                    <div class="row">
                        <div class="col-md-6 col-5">Balances</div>
                        <div class="col-md-6 col-7">{{balances.atmos}} ATMOS</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Comments</div>
                        <div class="col-md-6 col-7">{{comments}}</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Threads</div>
                        <div class="col-md-6 col-7">{{threads}}</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Last Activity</div>
                        <div class="col-md-6 col-7">{{ last_activity }}</div>
                    </div>
                </div>
                <div class="col-md-6 col-12">
                    
                </div>
            </div>
            <div class="row mb-2" v-for="p in posts" :key="p.o_id">
              <Post :history_modal="$refs.history_modal" :post="p" :show_content="true"></Post>
            </div>
            <div class="row mb-4">
                <div class="col-12">
                  <div class="float-right">
                      <Pager :pages="pages" :current_page="current_page"></Pager>
                  </div>
                </div>
            </div>
        </div>
        </MainSection>
    </div>
</template>

<script>
import ui from "@/ui";

import {
  GetEOS,
  GetIdentity,
  ScatterEosOptions
} from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { storage, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "UserProfile",
  components: {
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection,
    Pager: Pager,
    Post: Post,
    PostSorter: PostSorter
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
    this.$refs.sorter.by = "time";
    this.load();
  },
  computed: {
  },
  methods: {
    async load() {
      var profile = await ui.views.UserProfile(this.$route.query.page, this.$route.params.account, this.$refs.sorter.getSorter());
      
      this.current_page = profile.current_page;
      this.account = profile.account;
    
      this.is_blocked = profile.is_blocked;
      this.balances.atmos = profile.balance_atmos;
      this.comments = profile.n_comments;
      this.threads = profile.n_threads;
      this.last_activity = profile.last_activity;
      this.posts = profile.posts;
      this.pages = profile.pages;
    },
    async toggleBlock() {
      await ui.actions.BlockUser(this.account, this.is_blocked);
      await this.load();
    }
  },
  data() {
    return {
      is_blocked: false,
      account: "",
      balances: {
        atmos: 0
      },
      comments: 0,
      threads: 0,
      last_activity: "",
      posts: [],
      current_page: 1,
      pages: 0
    };
  }
};
</script>
