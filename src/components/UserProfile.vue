<template>
    <div>
        <PostHistoryModal ref="historyModal"></PostHistoryModal>
        <HeaderSection>
            <span class="title mr-3"><router-link :to="'/u/' + account">{{account}}</router-link></span>
            <a class="btn btn-outline-secondary ml-1" :href="'https://bloks.io/account/' + account">view on chain</a>
        </HeaderSection>
        <MainSection>
        <div>
            <div class="row mb-2">
                <div class="col-md-6 col-12">
                    <div class="row">
                        <div class="col-md-6 col-5">Balances</div>
                        <div class="col-md-6 col-7">{{balances.eos}} EOS</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5"></div>
                        <div class="col-md-6 col-7">{{balances.atmos}} ATMOS</div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 col-5">Earned</div>
                        <div class="col-md-6 col-7">{{earned.atmos}} ATMOS</div>
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
                        <div class="col-md-6 col-7">{{ lastActivity }}</div>
                    </div>
                </div>
                <div class="col-md-6 col-12">
                    <div class="row">                            
                        <span>CPU - {{cpu}}%</span>
                        <div class="progress" style="width: 100%">
                            <div class="progress-bar bg-warning" role="progressbar" :style="'width: ' + cpu + '%;'"></div>
                        </div>
                    </div>
                    <div class="row">                            
                        <span>Bandwidth - {{bandwidth}}%</span>
                        <div class="progress" style="width: 100%">                            
                            <div class="progress-bar bg-info" role="progressbar" :style="'width: ' + bandwidth + '%;'"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row mb-2" v-for="p in posts" :key="p.transaction">
                <Post 
                :submitModal="null" 
                :historyModal="$refs.historyModal"
                :post="p" 
                :showContent="true">
                </Post>
            </div>
            <div class="row">
                <div class="col-md-2" v-if="currentPage>1">
                    <router-link :to="'/u/' + account + '?page=' + (currentPage-1)">&larr; prev</router-link>
                </div>
                <div class="col-md-2" v-if="currentPage<pages">
                    <router-link :to="'/u/' + account + '?page=' + (currentPage+1)">next &rarr;</router-link>
                </div>
            </div>
        </div>
        </MainSection>
    </div>
</template>

<script>
import { GetNovusphere } from '../novusphere'
import { GetEOS, GetScatter, ScatterConfig, ScatterEosOptions } from "../eos"
import { MigratePost } from "../migrations"

import Post from './Post.vue'
import HeaderSection from './HeaderSection'
import MainSection from './MainSection'
import PostHistoryModal from './PostHistoryModal.vue'

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "UserProfile",
  components: {    
    'PostHistoryModal': PostHistoryModal,
    'HeaderSection': HeaderSection,
    'MainSection': MainSection,
    'Post': Post
  },
  watch: {
    '$route.query.page': function () {
      this.load();
    },
    '$route.params.account': function() {
      this.load();
    }
  },
  mounted: function() {
      this.load();
  },
  methods: {
      load: async function() {
          this.currentPage = parseInt(((this.$route.query.page) ? (this.$route.query.page) : 1));
          this.account = this.$route.params.account;

          const eos = GetEOS();
          const novusphere = GetNovusphere();

          var balanceEos, balanceAtmos, cpu, bandwidth;
          var comments, threads, pages, posts;

          try
          {
            var accountData = await eos.getAccount(this.account);
            //console.log(accountData);

            balanceAtmos = 0;
            balanceEos = [   accountData.core_liquid_balance,
                accountData.total_resources.cpu_weight,
                accountData.total_resources.net_weight]
                .map(v => parseFloat(v))
                .reduce((a, v) => a + ((v) ? v : 0), 0);
                                
            cpu = Math.floor(100 * accountData.cpu_limit.used / accountData.cpu_limit.max);
            bandwidth = Math.floor(100 * accountData.net_limit.used / accountData.net_limit.max);
          }
          catch (ex) {
              // account not found....
              console.log(ex);
              return;
          }
          
          var MATCH_QUERY = {
                    'data.json_metadata.sub': { '$exists': true, '$ne': '' },
                    'data.reply_to_post_uuid': { '$ne': '' }, 
                    'data.poster': this.account,
                    'createdAt': { '$gte': 1531434299 } /* Last eosforumtest contract redeploy */
                };

          comments = (await novusphere.api({
                'count': novusphere.config.collection,
                'maxTimeMS': 1000,
                'query': MATCH_QUERY
            })).n;

          MATCH_QUERY['data.reply_to_post_uuid'] = '';

          threads = (await novusphere.api({
                'count': novusphere.config.collection,
                'maxTimeMS': 1000,
                'query': MATCH_QUERY
            })).n;

          pages = Math.ceil((comments + threads) / MAX_ITEMS_PER_PAGE);

          delete MATCH_QUERY['data.reply_to_post_uuid'];

          posts = (await novusphere.api({
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
                    "$skip": (this.currentPage-1) * MAX_ITEMS_PER_PAGE
                },
                {
                    "$limit": MAX_ITEMS_PER_PAGE
                },
                { 
                    "$lookup": {
                        "from": novusphere.config.collection,
                        "localField": "data.reply_to_post_uuid",
                        "foreignField": "data.post_uuid",
                        "as": "parent"
                    }
                },
                { 
                    "$project": {
                        "transaction": "$transaction",
                        "createdAt": "$createdAt",
                        "data": "$data",
                        "parent": { 
                            "$arrayElemAt": [ "$parent", 0 ] 
                        }
                    }
                },
                {
                    "$match": {
                        "$or": [ 
                            { "parent": null },
                            { "parent.data.json_metadata": { "$ne": null } }
                        ]
                    }
                }]
            })).cursor.firstBatch;

            for (var i = 0; i < posts.length; i++) {
                var p = posts[i];
                MigratePost(p);

                if (p.parent) {
                    if (p.parent.data.json_metadata)
                        p.data.json_metadata.title = p.parent.data.json_metadata.title;
                }
            }

            // push data to this
            this.balances.eos = balanceEos;
            this.balances.atmos = balanceAtmos;
            this.earned.atmos = 0;
            this.cpu = cpu;
            this.bandwidth = bandwidth;
            this.comments = comments;
            this.threads = threads;
            this.lastActivity =  (posts.length) > 0 ? new Date(posts[0].createdAt * 1000).toLocaleString() : 'N/A';
            this.posts = posts;
            this.pages = pages;
      }
  },
  data() {
    return {
        account: '',
        balances: {
            eos: 0,
            atmos: 0
        },
        earned: {
            atmos: 0
        },
        cpu: 0,
        bandwidth: 0,
        comments: 0,
        threads: 0,
        lastActivity: '',
        posts: [],
        currentPage: 1,
        pages: 0
    }
  }
}
</script>
