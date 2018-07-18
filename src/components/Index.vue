<template>
  <div>
    <div class="header">
        <ul class="list-inline">
          <li class="list-inline-item"><router-link to='/e/novusphere'>novusphere</router-link></li>
          <li class="list-inline-item"><router-link to='/e/eos'>eos</router-link></li>
          <li class="list-inline-item"><router-link to='/e/general'>general</router-link></li>
          <li class="list-inline-item"><router-link to='/e/anon'>anon</router-link></li>
          <li class="list-inline-item"><router-link to='/e/movies'>movies</router-link></li>
          <li class="list-inline-item"><router-link to='/e/music'>music</router-link></li>
          <li class="list-inline-item"><router-link to='/e/bounties'>bounties</router-link></li>
          <li class="list-inline-item"><router-link to='/e/dev'>dev</router-link></li>
          <li class="list-inline-item"><router-link to='/e/test'>test</router-link></li>
        </ul>
    </div>
    <div class="header-second mb-3">
      <div class="ml-3">
        <span style="font-size: xx-large"><router-link :to="'/e/' + sub">{{ sub }}</router-link></span>
        <button type="button" class="btn btn-primary ml-3" data-toggle="modal" data-target="#submitPost">submit new post</button>
      </div>
    </div>
    <div class="container">
      <SubmitPostModal ref="submitModal" :sub="sub" :postContentCallback="postContent"></SubmitPostModal>
      <div class="row">
        <div class="col-md-8">
          <div v-if="posts.length == 0">
            <div class="text-center">
              <h1>There doesn't seem to be any posts here! Why not make one?</h1>
            </div>
          </div>
          <div class="row mb-2" v-for="p in posts" :key="p.transaction">
            <Post :submitModal="$refs.submitModal" :post="p" :showContent="false"></Post>
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
                <p class="text-center">
                  This is an experimental Reddit-style forum built on EOS by the Novusphere community,
                  using the <a href="https://github.com/eoscanada/eosio.forum">eosio.forum</a> contract deployed by EOSCanada.
                  You can follow development on our <a href="https://discord.gg/PtXzUVr">Discord</a>.
                  You need the <a href="https://get-scatter.com/">Scatter</a> browser plugin to post.
                  <a href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">Here is a guide</a> on markdown syntax, it's pretty much the same as Reddit.
                </p> 
                <p class="text-center">
                  This site is hosted entirely from <a href="https://github.com/Novusphere/novusphere-eos/tree/gh-pages">GitHub Pages</a>  and is fully <a href="https://github.com/Novusphere/novusphere-eos">open source</a>.
                  Developers of eos-forum take no responsibility for the content of the forum.
                  No images, files or media are hosted by eos-forum, please contact the respective site owners hosting content in breach of DMCA.
                </p>
              <div class="row mt-3 mb-3">
                  <div class="col-md-6">
                      <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 100%">
                  </div>
                  <div class="col-md-6">
                      <img src="https://cdn.novusphere.io/static/eos.svg" style="width: 100%">
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { MigratePost } from "../migrations"
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

      var MATCH_QUERY = { 
        'data.json_metadata.sub': sub, 
        'data.reply_to_post_uuid': '',
        'createdAt': { '$gte': 1531434299 } /* Last eosforumtest contract redeploy */
      };

      apiResult = await novusphere.api({
          'count': novusphere.config.collection,
          'maxTimeMS': 1000,
          'query': MATCH_QUERY
      });

      var numPages = Math.ceil(apiResult.n / MAX_ITEMS_PER_PAGE);

      apiResult = await novusphere.api({
          'aggregate': novusphere.config.collection,
          'maxTimeMS': 1000,
          'cursor': {},
          'pipeline': [
            { 
                "$match": MATCH_QUERY
            },
            { 
                "$lookup": {
                    "from": novusphere.config.collection,
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
                    "total_replies": { 
                      "$size": {
                        "$filter": {
                          "input": "$replies",
                          "as": "reply",
                          "cond": {
                            "$ne": [ "$$reply.data.json_metadata.edit", true  ]
                          }
                        }
                      }
                    }
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
        MigratePost(payload[i]);
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