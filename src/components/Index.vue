<template>
  <div>
    <SubmitPostModal ref="submitModal" :sub="sub" :postContentCallback="postContent"></SubmitPostModal>
    <Header>
      <span style="font-size: xx-large"><router-link :to="'/e/' + sub">{{ sub }}</router-link></span>
      <button type="button" class="btn btn-primary ml-3" data-toggle="modal" data-target="#submitPost">submit new post</button>
    </Header>
    <MainSection>
      <div>
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
    </MainSection>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { MigratePost } from "../migrations"
import jQuery from "jquery"

import Post from './Post.vue'
import SubmitPostModal from './SubmitPostModal.vue'
import Header from './Header'
import MainSection from './MainSection'

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "Index",
  components: {
    'Post': Post,
    'SubmitPostModal': SubmitPostModal,
    'Header': Header,
    'MainSection': MainSection
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