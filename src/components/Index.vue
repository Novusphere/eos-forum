<template>
  <div class="container">
     <div class="row">
      <div class="col-md-8">
        <div class="row mb-2" style="border:1px solid black;" v-for="p in posts" :key="p.id">
          <div class="col-md-12">
              <span style="font-weight: bold; font-size: 20px">
                <router-link :to="'/e/' + p.data.json_metadata.sub + '/' + p.transaction">{{ p.data.title }}</router-link>
                <router-link style="font-size: x-small" :to="'/e/' + p.data.json_metadata.sub">(self.{{p.data.json_metadata.sub}})</router-link>  
              </span>
              <div style="font-size: 13px">
                <ul class="list-inline">
                  <li class="list-inline-item">
                    <router-link :to="'/e/' + p.data.json_metadata.sub + '/' + p.transaction">{{ p.total_replies+1 }} comments</router-link>
                  </li>
                  <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                  <li class="list-inline-item">by <a :href="'https://eostracker.io/accounts/' + p.data.account">{{ p.data.account }}</a></li>
                  <li class="list-inline-item"><a :href="'https://eostracker.io/transactions/' + p.transaction">view on chain</a></li>
                </ul>
              </div>
            </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="row">
           <div class="col-md-12">
             <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#submitPost">Submit new post</button>
           </div>
        </div>
      </div>
    </div>
    <div class="modal fade" tabindex="-1" role="dialog" id="submitPost">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">New Submission</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <form>
              <div class="form-group row">
                <label for="inputTitle" class="col-sm-2 col-form-label">Title</label>
                <div class="col-sm-10">
                  <input type="email" class="form-control" id="inputTitle" placeholder="Title" v-model="post.title">
                </div>
              </div>
              <div class="form-group row">
                <label for="inputContent" class="col-sm-2 col-form-label">Content</label>
                <div class="col-sm-10">
                  <textarea rows="10" class="form-control" id="inputContent" placeholder="Content" v-model="post.content"></textarea>
                </div>
              </div>
              <fieldset class="form-group">
                <div class="row">
                  <legend class="col-form-label col-sm-2 pt-0"></legend>
                  <div class="col-sm-10">
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentType" value="" checked v-model="post.attachment.type">
                      <label class="form-check-label">No attachment</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentType" value="url" v-model="post.attachment.type">
                      <label class="form-check-label">URL</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentType" value="ipfs" v-model="post.attachment.type">
                      <label class="form-check-label">IPFS</label>
                    </div>
                  </div>
                </div>
              </fieldset>
              <fieldset class="form-group" v-if="post.attachment.type != ''">
                <div class="row">
                  <legend class="col-form-label col-sm-2 pt-0"></legend>
                  <div class="col-sm-10">
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentDisplay" value="iframe" checked v-model="post.attachment.display">
                      <label class="form-check-label">iframe</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentDisplay" value="img" v-model="post.attachment.display">
                      <label class="form-check-label">image</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentDisplay" value="mp4" v-model="post.attachment.display">
                      <label class="form-check-label">mp4</label>
                    </div>
                    <div class="form-check form-check-inline">
                      <input class="form-check-input" type="radio" name="attachmentDisplay" value="mp3" v-model="post.attachment.display">
                      <label class="form-check-label">mp3</label>
                    </div>
                  </div>
                </div>
              </fieldset>
              <div class="form-group row" v-if="post.attachment.type != ''">
                <label for="inputAttachment" class="col-sm-2 col-form-label"></label>
                <div class="col-sm-10">
                  <input class="form-control" id="inputAttachment" placeholder="IPFS hash / URL" v-model="post.attachment.value">
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-primary" v-on:click="postContent(post)">Post</button>
            <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { GetEOS, ScatterConfig, ScatterEosOptions } from "../eos"
import { v4 as uuidv4 } from "uuid"
import jQuery from "jquery"

export default {
  name: "Index",
  mounted: async function() {
    var novusphere = GetNovusphere();
    var apiResult = await novusphere.api(
      {
        'aggregate': novusphere.config.collection,
        'maxTimeMS': 1000,
        'cursor': {},
        'pipeline': [
          { 
              "$match": 
              { 
                'data.json_metadata.sub': 'novusphere', 
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
              "$skip": 0
          },
          {
              "$limit": 25
          }]
      });

    var payload = apiResult.cursor.firstBatch;
    this.$data.posts = payload;
  },
  methods: {
   postContent: async function(post) {
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
            title: post.title,
            account: eosAccount,
            certify: 0,
            content: post.content,
            post_uuid: uuidv4(),
            json_metadata: JSON.stringify({
              sub: 'novusphere',
              attachment: {
                value: post.attachment.value,
                type: post.attachment.type,
                display: post.attachment.display
              }
            }),
            reply_to_account: "",
            reply_to_post_uuid: ""
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

     jQuery('#submitPost').modal('hide');
     this.$router.push('/e/novusphere/' + eostx.transaction_id);
   }
  },
  data() {
    return {
      posts: [], // for posts being displayed
      post: { // for making a new post
        title: '',
        content: '',
        attachment: {
          value: '',
          type: '',
          display: 'iframe'
        }
      }
    };
  }
};
</script>