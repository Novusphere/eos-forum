<template>
    <div class="col-md-12 mb-3" style="border:1px solid black;">
            <span style="font-weight: bold; font-size: 20px">
                <div v-if="p.data.json_metadata.attachment && p.data.json_metadata.attachment.value && p.data.json_metadata.attachment.display == 'link'">
                    <a :href="p.data.json_metadata.attachment.value">{{ p.data.title }}</a>
                    <span style="font-size: x-small">({{this.getHost(p.data.json_metadata.attachment.value)}})</span>  
                </div>
                <div v-else-if="p.depth == 0">
                    <router-link :to="'/e/' + p.data.json_metadata.sub + '/' + p.transaction">{{ p.data.title }}</router-link>
                    <router-link style="font-size: x-small" :to="'/e/' + p.data.json_metadata.sub">(eos.{{p.data.json_metadata.sub}})</router-link>
                </div>
            </span>
            <div style="font-size: x-small">
                <ul class="list-inline">
                  <li class="list-inline-item" v-if="!showContent">
                    <router-link :to="'/e/' + p.data.json_metadata.sub + '/' + p.transaction">{{ p.total_replies+1 }} comments</router-link>
                  </li>
                  <li class="list-inline-item">{{ new Date(p.createdAt * 1000).toLocaleString() }}</li>
                  <li class="list-inline-item">by <a :href="'https://eostracker.io/accounts/' + p.data.account">{{ p.data.account }}</a></li>
                  <li class="list-inline-item"><a :href="'https://eostracker.io/transactions/' + p.transaction">view on chain</a></li>
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
                    </div>
                </div>
                
                <p v-html="md(p.data.content) ">
                
                </p>

                <div style="font-size: x-small">
                    <ul class="list-inline">
                        <li class="list-inline-item" v-if="showContent">
                            <button type="button" class="btn btn-sm btn-outline-primary" v-on:click="reply()">reply</button>
                        </li>
                        <li class="list-inline-item" v-if="p.depth > 0 && p.data.json_metadata.attachment && p.data.json_metadata.attachment.value">
                            <button 
                                data-toggle="collapse" :data-target="'#content-' + p.data.post_uuid"
                                type="button" class="btn btn-sm btn-outline-primary">
                                show attachment
                            </button>
                        </li>
                    </ul>
                </div>

                <Post :post="child" :showContent="true" v-for="child in p.children" :key="child.transaction"></Post>
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
      }
  },
  async mounted() {
  },
  methods: {
      md: function(text) {
          return markdown(text);
      },
      reply: function () {
        // set the parent uuid that we're replying to
        var $submitPost = jQuery('#submitPost');
        var $parent_uuid = $submitPost.find('input[name="parent_uuid"]');
        $parent_uuid.val(this.$data.p.data.post_uuid);
        $submitPost.modal();
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