<template>
  <div>
    <div class="text-center">
      <ul class="list-inline">
        <li class="list-inline-item"><router-link to='/e/novusphere'>/e/novusphere</router-link></li>
        <li class="list-inline-item"><router-link to='/e/eos'>/e/eos</router-link></li>
        <li class="list-inline-item"><router-link to='/e/general'>/e/general</router-link></li>
        <li class="list-inline-item"><router-link to='/e/movies'>/e/movies</router-link></li>
        <li class="list-inline-item"><router-link to='/e/test'>/e/test</router-link></li>
      </ul>
    </div>
    <div class="ml-3">
      <h1><router-link :to="'/e/' + sub">/e/{{ sub }}</router-link></h1>
    </div>
    <div class="container">
      <div class="row">
        <div class="col-md-8">
          <div v-if="posts.length == 0">
            <div class="text-center">
              <h1>There doesn't seem to be any posts here! Why not make one?</h1>
            </div>
          </div>
          <div class="row mb-2" v-for="p in posts" :key="p.transaction">
            <Post :post="p" :showContent="false"></Post>
          </div>
          <div class="row">
            <div class="col-md-2" v-if="currentPage>1">
              <router-link :to="'/e/' + sub + '?page=' + (currentPage-1)">&larr; prev</router-link>
            </div>
            <div class="col-md-2" v-if="currentPage<pages">
              <router-link :to="'/e/' + sub + '?page=' + (currentPage+1)">next &rarr;</router-link>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="row">
            <div class="col-md-12">
              <div class="row">
                  <div class="col-md-6">
                      <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 100%">
                  </div>
                  <div class="col-md-6">
                      <img src="https://cdn.novusphere.io/static/eos.svg" style="width: 100%">
                  </div>
              </div>
            </div>
            <div class="col-md-12">
              <div class="row mt-3">
                  <div class="col-md-4"></div>
                  <div class="col-md-4">
                    <a class="btn btn-success" href="https://github.com/Novusphere/novusphere-eos">GitHub (Source)</a>
                  </div>
                  <div class="col-md-4"></div>
              </div>
              <div class="row mt-3">
                  <div class="col-md-4"></div>
                  <div class="col-md-4">
                    <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#submitPost">Submit new post</button>
                  </div>
                  <div class="col-md-4"></div>
              </div>
              <div class="row mt-3 ml-3">
                <p class="text-center">
                  This is an experimental reddit-style forum built on EOS by the Novusphere community,
                  using the <a href="https://github.com/eoscanada/eosio.forum">eosio.forum</a> contract deployed by EOSCanada.
                  You can follow development on our <a href="https://discord.gg/PtXzUVr">Discord</a>.
                  You need the <a href="https://get-scatter.com/">Scatter</a> browser plugin to post.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SubmitPostModal :sub="sub" :postContentCallback="postContent"></SubmitPostModal>
    </div>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import jQuery from "jquery"

import Post from './Post.vue'
import SubmitPostModal from './SubmitPostModal.vue'

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "Index",
  components: {
    'Post': Post,
    'SubmitPostModal': SubmitPostModal
  },
  watch: {
    '$route.query.page': function (id) {
      this.load();
    },
    '$route.params.sub': function() {
      this.load();
    }
  },
  mounted: function() {
    this.load();
  },
  methods: {
   load: async function() {
      var currentPage = parseInt(((this.$route.query.page) ? (this.$route.query.page) : 1));
      //console.log(currentPage);
      var sub = ((this.$route.params.sub) ? (this.$route.params.sub) : 'novusphere');
      var novusphere = GetNovusphere();
      var apiResult;

      apiResult = await novusphere.api({
          'count': novusphere.config.collection,
          'maxTimeMS': 1000,
          'query': { // only find top level posts
            'data.json_metadata.sub': sub, 
            'data.reply_to_post_uuid': '' 
          }
      });

      var numPages = Math.ceil(apiResult.n / MAX_ITEMS_PER_PAGE);

      apiResult = await novusphere.api({
          'aggregate': novusphere.config.collection,
          'maxTimeMS': 1000,
          'cursor': {},
          'pipeline': [
            { 
                "$match": { 
                  'data.json_metadata.sub': sub, 
                  'data.reply_to_post_uuid': '' 
                } 
            },
            { 
                "$lookup": {
                    "from": "novusphere",
                    "localField": "data.post_uuid",
                    "foreignField": "data.reply_to_post_uuid",
                    "as": "replies"
                }
            },
            { 
                "$project": {
                    "transaction": "$transaction",
                    "createdAt": "$createdAt",
                    "data": "$data",
                    "total_replies": { "$size": "$replies" }
                } 
            },
            {
                "$sort": {
                  "createdAt": -1
                }
            },
            {
                "$skip": (currentPage-1) * MAX_ITEMS_PER_PAGE
            },
            {
                "$limit": MAX_ITEMS_PER_PAGE
            }]
      });

      var payload = apiResult.cursor.firstBatch;
      
      for (var i = 0; i < payload.length; i++) {
        var p = payload[i];
        p.children = [];
        p.depth = 0;

        var attachment = p.data.json_metadata.attachment;

        // transform ipfs --> url
        if (attachment && attachment.value && attachment.type == 'ipfs') {
            attachment.type = 'url';
            attachment.value = 'https://ipfs.io/ipfs/' + attachment.value;
        }
      }

      this.$data.posts = payload;
      this.$data.pages = numPages;
      this.$data.currentPage = currentPage;
      this.$data.sub = sub;
  },
  postContent: function(txid) {
     this.$router.push('/e/' + this.sub + '/' + txid);
   }
  },
  data() {
    return {
      currentPage: 0,
      pages: 0,
      sub: '',
      posts: [], // for posts being displayed
    };
  }
};
</script>