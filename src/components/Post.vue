<template>
    <div :class="'col-md-12 mb-3 post ' + (((p.depth%2)==1) ? 'post-odd' : '')">
            <span style="font-weight: bold; font-size: 20px">
                <div v-if="p.depth == 0">
                    <div v-if="p.data.json_metadata.attachment && p.data.json_metadata.attachment.value && p.data.json_metadata.attachment.display == 'link'">
                        <a :href="p.data.json_metadata.attachment.value">{{ p.data.json_metadata.title }}</a>
                        <span style="font-size: x-small">({{this.getHost(p.data.json_metadata.attachment.value)}})</span>  
                    </div>
                    <div v-else>
                        <router-link :to="'/e/' + p.data.json_metadata.sub + '/' + p.transaction">{{ p.data.json_metadata.title }}</router-link>
                        <router-link style="font-size: x-small" :to="'/e/' + p.data.json_metadata.sub">(eos.{{p.data.json_metadata.sub}})</router-link>
                    </div>
                </div>
            </span>
            <div style="font-size: x-small">
                <ul class="list-inline">
                  <li class="list-inline-item" v-if="!showContent">
                    <router-link :to="'/e/' + p.data.json_metadata.sub + '/' + p.transaction">{{ p.total_replies }} comments</router-link>
                  </li>
                  <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                  <li class="list-inline-item">by <a :href="'https://eostracker.io/accounts/' + p.data.poster">{{ p.data.poster }}</a></li>
                  <li class="list-inline-item"><a :href="'https://eostracker.io/transactions/' + p.transaction">view on chain</a></li>
                  <li class="list-inline-item"></li>
                </ul>
            </div>

            <div v-if="showContent">
                <div
                    :id="'content-' + p.data.post_uuid" 
                    :class="p.depth > 0 ? 'row collapse' : 'row'" 
                    v-if="p.data.json_metadata.attachment && p.data.json_metadata.attachment.value">
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
                        <div v-if="p.data.json_metadata.attachment.display == 'link'">
                            <div class="text-center">
                                <a target="_blank" :href="p.data.json_metadata.attachment.value">{{p.data.json_metadata.attachment.value}}</a>
                            </div>
                        </div>
                    </div>
                </div>
                
                <p class="post-content" v-html="md(p.data.content) ">
                
                </p>

                <div style="font-size: x-small">
                    <ul class="list-inline">
                        <li class="list-inline-item" v-if="showContent">
                            <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="reply()">reply</button>
                            <button type="button" class="btn btn-sm btn-outline-warning" v-on:click="edit()">edit</button>
                        </li>
                        <li class="list-inline-item" v-if="p.depth > 0 && p.data.json_metadata.attachment && p.data.json_metadata.attachment.value">
                            <button 
                                data-toggle="collapse" :data-target="'#content-' + p.data.post_uuid"
                                type="button" class="btn btn-sm btn-outline-danger">
                                show attachment
                            </button>
                        </li>
                    </ul>
                </div>
    
                <div v-for="child in p.children" :key="child.transaction">
                    <div v-if="!(child.hide)">
                        <Post :submitModal="submitModal" :post="child" :showContent="true" ></Post>
                    </div>
                </div>
            </div>
    </div>
</template>

<script>
import jQuery from 'jquery'
import { markdown } from '../markdown'

export default {
  name: "Post",
  props: {
      post: {
          type: Object,
          required: true
      },
      showContent: {
          type: Boolean,
          required: false,
          default: true
      },
      submitModal: {
          type: Object,
          required: false
      }
  },
  async mounted() {
  },
  methods: {
      md: function(text) {
          return markdown(text);
      },
      edit: function() {
        var $post = this.submitModal.$data.post;
        var p = this.$data.p;

        // dupe existing post into submit
        $post.parent_uuid = p.data.post_uuid;
        $post.title = '';
        $post.content = p.data.content;
        $post.edit = true;
        $post.edit_account = p.data.poster;

        var attachment = p.data.json_metadata.attachment;
        if (attachment) {
            $post.attachment.value = attachment.value;
            $post.attachment.type = attachment.type;
            $post.attachment.display = attachment.display;
        }
        else {
            $post.attachment.value = '';
            $post.attachment.type = '';
            $post.attachment.display = 'link';
        }
        jQuery('#submitPost').modal();
      },
      reply: function () {
        var $post = this.submitModal.$data.post;
        $post.parent_uuid = this.$data.p.data.post_uuid;
        $post.edit = false;

        jQuery('#submitPost').modal();
      },
      getHost: function(href) {
          if (href.indexOf('magnet:') == 0)
            return 'magnet link';

          var parser = document.createElement('a');
          parser.href = href;
          return parser.host;
      }
  },
  watch: {
      'post': function(val) {
          this.$data.p = val;
      }
  },
  data() {
    return {
        p: this.post
    }
  }
}
</script>