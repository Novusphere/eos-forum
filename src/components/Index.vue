<template>
  <div>
    <SubmitPostModal ref="submitModal" :sub="sub" :postContentCallback="postContent"></SubmitPostModal>
    <HeaderSection>
      <span class="title mr-3"><router-link :to="'/e/' + sub">{{ sub }}</router-link></span>
      <button v-if="!isSubscribed" v-on:click="subscribe(true)"  type="button" class="btn btn-outline-primary ml-1">subscribe</button>
      <button v-if="isSubscribed" v-on:click="subscribe(false)" type="button" class="btn btn-outline-danger ml-1">unsubscribe</button>
      <button type="button" class="btn btn-outline-secondary ml-1" data-toggle="modal" data-target="#submitPost">new</button>
    </HeaderSection>
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
        <div class="row mb-4">
            <div class="col-12">
              <div class="float-right">
                  <router-link v-if="currentPage>1" class="btn btn-outline-primary" :to="'/e/' + sub + '?page=' + (currentPage-1)">&larr; prev</router-link>
                  <router-link v-if="currentPage<pages" class="btn btn-outline-primary" :to="'/e/' + sub + '?page=' + (currentPage+1)">next &rarr;</router-link>
              </div>
            </div>
        </div>
      </div>
    </MainSection>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { MigratePost, ApplyPostEdit } from "../migrations"
import { storage, SaveStorage } from "../storage"
import jQuery from "jquery"

import Post from './Post.vue'
import SubmitPostModal from './SubmitPostModal.vue'
import HeaderSection from './HeaderSection'
import MainSection from './MainSection'

const MAX_ITEMS_PER_PAGE = 25;
const DEFAULT_SUB = 'all';

export default {
  name: "Index",
  components: {
    'Post': Post,
    'SubmitPostModal': SubmitPostModal,
    'HeaderSection': HeaderSection,
    'MainSection': MainSection
  },
  watch: {
    '$route.query.page': function () {
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
      var sub = ((this.$route.params.sub) ? (this.$route.params.sub) : DEFAULT_SUB).toLowerCase();
      var novusphere = GetNovusphere();
      var apiResult;

      var MATCH_QUERY = {
        //'name': 'post',
        'data.json_metadata.sub': sub, 
        'data.reply_to_post_uuid': '',
        'createdAt': { '$gte': 1531434299 } /* Last eosforumtest contract redeploy */
      };

      if (sub == 'all') {
        MATCH_QUERY['data.json_metadata.sub'] = { '$exists': true, '$ne': '' };
      }

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
                "$sort": {
                  "createdAt": -1
                }
            },
            {
                "$skip": (currentPage-1) * MAX_ITEMS_PER_PAGE
            },
            {
                "$limit": MAX_ITEMS_PER_PAGE
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
                    "recent_edit": {
                      "$arrayElemAt": [ {"$filter": {
                       
                        "input": "$replies",
                        "as": "reply",
                        "cond": {
                            "$and": [ 
                              {"$eq": ["$$reply.data.json_metadata.edit", true]},
                              {"$eq": ["$$reply.data.json_metadata.parent_uuid", "$data.post_uuid"]},
                              {"$eq": ["$$reply.data.poster", "$data.poster"]}
                            ]
                        }

                      }}, -1 ] 
                    },
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
            }]
      });

      var payload = apiResult.cursor.firstBatch;
      
      for (var i = 0; i < payload.length; i++) {
        var post = payload[i];
        MigratePost(post);
        
        if (post.recent_edit)
          ApplyPostEdit(post, post.recent_edit);

        var old_replies = storage.new_posts[post.data.post_uuid];
        post.new_replies = (old_replies == undefined) ? (post.total_replies + 1) : (post.total_replies - old_replies); 
        post.new_replies = Math.max(post.new_replies, 0); // bug fix
      }

      // push data to this
      this.isSubscribed = storage.subscribed_subs.includes(sub);
      this.posts = payload;
      this.pages = numPages;
      this.currentPage = currentPage;
      this.sub = sub;
   },
   postContent: function(txid) {
     this.$router.push('/e/' + this.sub + '/' + txid);
   },
   subscribe: function(sub) {
     if (sub) {
       if (storage.subscribed_subs.includes(this.sub))
          return;
       storage.subscribed_subs.push(this.sub);
       //console.log(storage.subscribed_subs);
       SaveStorage();

       this.isSubscribed = true;
     }
     else {

       // remove all
       for (;;) {
          var i = storage.subscribed_subs.indexOf(this.sub);
          if (i < 0)
            break;
          storage.subscribed_subs.splice(i, 1);
          //console.log(storage.subscribed_subs);
       }

       SaveStorage();

       this.isSubscribed = false;
     }
   }
  },
  data() {
    return {
      isSubscribed: false,
      currentPage: 0,
      pages: 0,
      sub: '',
      posts: [], // for posts being displayed
    };
  }
};
</script>