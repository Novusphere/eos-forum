<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="submitPost">
        <div class="modal-dialog modal-full" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ replyUuid ? (post.edit ? 'Edit' : 'Reply') : 'New Submission' }}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div v-if="preview">
              <div class="modal-body">
                <p class="post-content" v-html="markdownPost">

                </p>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-primary" v-on:click="preview = false">back</button>
              </div>
            </div>
            <div v-else>
              <div class="modal-body">
                <form>
                  <div class="form-group row" v-if="!replyUuid || (post.edit && post.title)">
                    <label for="inputTitle" class="col-sm-2 col-form-label">Title</label>
                    <div class="col-sm-10">
                      <input type="text" class="form-control" id="inputTitle" placeholder="Title" v-model="post.title">
                    </div>
                  </div>
                  <div class="form-group row">
                    <label for="inputContent" class="col-sm-2 col-form-label">Content</label>
                    <div class="col-sm-10">
                      <textarea rows="10" class="form-control" id="inputContent" placeholder="Content" v-model="post.content"></textarea>
                    </div>
                  </div>
                  <div class="form-group row">
                    <label class="col-sm-2 col-form-label"></label>
                    <div class="col-sm-10">
                      {{ markdownPost.length }} / {{ 1024 * 10 }}
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
                          <input class="form-check-input" type="radio" name="attachmentDisplay" value="link" checked v-model="post.attachment.display">
                          <label class="form-check-label">link</label>
                        </div>
                        <div class="form-check form-check-inline">
                          <input class="form-check-input" type="radio" name="attachmentDisplay" value="iframe" v-model="post.attachment.display">
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
                <div class="row">
                  <div class="col-md-12">
                    <div class="text-center">
                      <span style="font-weight: bold">{{status}}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" v-on:click="postContent(false)">post</button>
                <button type="button" class="btn btn-outline-primary" v-on:click="postContent(true)" v-if="isAnonSub">post anon</button>
                <button type="button" class="btn btn-outline-secondary" v-on:click="preview = true">preview</button>
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import { GetNovusphere } from "../novusphere"
import { GetEOS, ScatterConfig, ScatterEosOptions, GetScatterIdentity } from "../eos"
import { GetEOSService } from '../eos-service'
import { MarkdownParser } from "../markdown"
import { v4 as uuidv4 } from "uuid"
import jQuery from "jquery"

export default {
  name: "SubmitPostModal",
  props: {
      replyAccount: {
          type: String,
          required: false,
          default: ''
      },
      replyUuid: {
          type: String,
          required: false,
          default: ''       
      },
      sub: {
          type: String,
          required: true,
          default: '',
      },
      postContentCallback: {
          type: Function,
          required: false,
          default: () => {}
      }
  },
  methods: {
    makePost: function(account) {
        var post = this.$data.post;

        if (post.edit) {
          if (account != post.edit_account) {
            this.$data.status = 'This is not your post, you cannot edit it!';
            return;
          }
        }

        if (post.content.length == 0) {
          this.$data.status = 'Post must have at least 1 character of content';
          return;
        }

        if (post.content.length > 1024 * 10) {
          this.$data.status = 'Post is too long, over limit by ' + ((1024*10) - post.content.length) + ' characters';
          return;
        }

        var eosPost = {
                    poster: account,
                    reply_to_poster: this.replyAccount,
                    reply_to_post_uuid: this.replyUuid,
                    certify: 0,
                    content: post.content,
                    post_uuid: uuidv4(),
                    json_metadata: JSON.stringify({
                        'title': post.title,
                        'type': 'novusphere-forum',
                        'sub': this.sub,
                        'parent_uuid': post.parent_uuid,
                        'edit': post.edit,
                        'attachment': {
                            'value': post.attachment.value.trim(),
                            'type': post.attachment.type,
                            'display': (post.attachment.value) ? post.attachment.display : ''
                        }
                      })
          };

          return eosPost;
    },
    postContent: async function(anon) {
        var post = this.$data.post;
        const eosService = GetEOSService();

        var eosAccount, eosAuth;

        if (anon) {
          eosAccount = eosService.config.anonymousAccount;
        }
        else {
          //
          // not anonymous post: so get scatter identity
          //
          this.status = 'Getting Scatter identity...';

          try {
            var identity = await GetScatterIdentity();
            eosAccount = identity.account;
            eosAuth = identity.auth;
          }
          catch (ex) {
              this.status += ' Failed!';
              console.log(ex);
              return;
          }
        }

        var txid;
        this.status = 'Creating tx and broadcasting to EOS...';
        try {
            var eosPost = this.makePost(eosAccount);
            if (!eosPost)
              return;

            if (anon) {
              // use eos-service to make anonymous post
              var eostx = await eosService.anonymousPost(eosPost);
              if (eostx.error)
              {
                this.status = 'Error: ' + eostx.error;
                console.log(eostx.error);
                return;
              }
            }
            else {
              // make scatter eos instance
              
              const eos = GetEOS();
              var eosforum = await eos.contract("eosforumdapp");
              var eostx = await eosforum.transaction(tx => {
                  tx.post(eosPost,
                  {
                      authorization: [
                      {
                          actor: eosAccount,
                          permission: eosAuth
                      }]
                  });
              });
            }

            txid = eostx.transaction_id;
        }
        catch (ex) {
            this.status += ' Failed!';
            console.log(ex);
            return;
        }

        this.status = 'Waiting for Novusphere to index...';

        var novusphere = GetNovusphere();
        await novusphere.waitTx(txid, 500, 1000);

        jQuery('#submitPost').modal('hide');
        this.$data.post.status = '';

        this.postContentCallback(txid);

        this.status = '';
    }
  },
  computed: {
    markdownPost: function() {
      var md = new MarkdownParser(this.post.content);
      return md.html;
    },
    isAnonSub: function() {
      return (this.sub == 'anon') || (this.sub.indexOf('anon-') == 0);
    }
  },
  data() {
    return {        
      status: '',
      preview: false,
      post: { // for making a new post
        edit: false,
        edit_account: '',

        parent_uuid: '',
        title: '',
        content: '',
        attachment: {
          value: '',
          type: '',
          display: 'link'
        }
      }
    }
  }
}
</script>