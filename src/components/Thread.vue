<template>
  <div class="container">
     <div class="row mb-2">
      <div class="col-md-12">
        <div class="row">
          <div class="col-md-12">
              <span style="font-weight: bold; font-size: 20px">{{ mainPost.data.title }}</span>
            </div>
        </div>
        <div class="col-md-12" style="border:1px solid black;" v-for="p in posts" :key="p.id">
            <ul class="list-inline" style="font-size: 13px">
              <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
              <li class="list-inline-item">by <a :href="'https://eostracker.io/accounts/' + p.data.account">{{ p.data.account }}</a></li>
              <li class="list-inline-item"><a :href="'https://eostracker.io/transactions/' + p.transaction">view on chain</a></li>
            </ul>
            <div class="row" v-if="p.data.json_metadata.attachment && p.data.json_metadata.attachment.value">
              <div class="col-md-12">
                <div v-if="p.data.json_metadata.attachment.display == 'iframe'">
                  <iframe style="width: 100%" :src="p.data.json_metadata.attachment.value" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                </div>
                <div v-if="p.data.json_metadata.attachment.display == 'img'">
                  <img :src="p.data.json_metadata.attachment.value">
                </div>
                <div v-if="p.data.json_metadata.attachment.display == 'mp4'">
                  <video style="width: 100%" controls>
                    <source :src="p.data.json_metadata.attachment.value" type="video/mp4">
                  </video>
                </div>
                <div v-if="p.data.json_metadata.attachment.display == 'mp3'">
                  <audio style="width: 100%" controls>
                    <source :src="p.data.json_metadata.attachment.value" type="audio/mpeg">
                  </audio>
                </div>
              </div>
            </div>
            <p style="">
                {{ p.data.content }}
            </p>
        </div>
      </div>
     </div>
     <div class="row">
      <button class="btn btn-primary mb-3" type="button" data-toggle="modal" data-target="#submitPost">
        reply   
      </button>
     </div>
      <div class="modal fade" tabindex="-1" role="dialog" id="submitPost">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Reply</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-group row">
                <label for="inputContent" class="col-sm-2 col-form-label">Content</label>
                <div class="col-sm-10">
                  <textarea rows="10" class="form-control" id="inputContent" placeholder="Content" v-model="post.content"></textarea>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" v-on:click="postResponse(mainPost, post)">Post</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { GetEOS, ScatterConfig, ScatterEosOptions } from '../eos'
import { v4 as uuidv4 } from "uuid"
import jQuery from "jquery"

export default {
  name: "Thread",
  mounted: async function() {
    await this.loadThread();
  },
  methods: {
    loadThread: async function() {
      var novusphere = GetNovusphere();
      var apiResult = await novusphere.api({
        'find': novusphere.config.collection,
        'maxTimeMS': 1000,
        'filter': {
          'transaction': this.$route.params.id
        }
      });

      var mainPost = apiResult.cursor.firstBatch[0];

      apiResult = await novusphere.api({
          'find': novusphere.config.collection,
          'maxTimeMS': 1000,
          'filter': {
            'data.reply_to_post_uuid': mainPost.data.post_uuid
          }
      });

      var responses = apiResult.cursor.firstBatch;
      responses.splice(0, 0, mainPost);
      //console.log(responses);

      for (var i = 0; i < responses.length; i++) {
        var p = responses[i];
        var attachment = p.data.json_metadata.attachment;

        // transform ipfs --> url
        if (attachment && attachment.value && attachment.type == 'ipfs') {
            attachment.type = 'url';
            attachment.value = 'https://ipfs.io/ipfs/' + attachment.value;
        }
      }
    
      this.$data.mainPost = mainPost;
      this.$data.posts = responses;
    },
    postResponse: async function (parent, post) {
      // get scatter identity
      var identity = await window.scatter.getIdentity({
        accounts: [
          {
            chainId: ScatterConfig.chainId,
            blockchain: ScatterConfig.blockchain
          }
        ]
      });

     const eosAccount = identity.accounts[0].name;
     const eosAuth = identity.accounts[0].authority;
    
     // make scatter eos instance
     const eos = GetEOS(window.scatter);

     var eosPost = {
            title: '',
            account: eosAccount,
            certify: 0,
            content: post.content,
            post_uuid: uuidv4(),
            json_metadata: JSON.stringify({
              sub: 'novusphere',
            }),
            reply_to_account: parent.data.account,
            reply_to_post_uuid: parent.data.post_uuid
     };

     console.log('Creating and broadcasting to EOS...');

     var eosforum = await eos.contract("eosforumtest");
     var eostx = await eosforum.transaction(tx => {
        tx.post(eosPost,
          {
            authorization: [
              {
                actor: eosAccount,
                permission: eosAuth
              }
            ]
          }
        );
      });

      console.log('Waiting for Novusphere to index...');

      var novusphere = GetNovusphere();
      await novusphere.waitTx(eostx.transaction_id, 500, 1000);

      console.log('Reloading thread content...');

      await this.loadThread();

      jQuery('#submitPost').modal('hide');
    }
  },
  data() {
    return {
      mainPost: {
        data: {
          title: ''
        }
      },
      posts: [], // posts in the thread
      post: { // for making a new post
        content: '',
      }
    };
  }
};
</script>