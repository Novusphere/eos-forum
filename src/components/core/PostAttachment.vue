<template>
  <div v-if="this.attachment && this.attachment.value"
    :id="this.id"
    :class="this.collapse ? 'row collapse' : 'row'">

    <div class="col-md-12">
      <Tweet v-if="twitterID" :id="twitterID" />
      <div v-else-if="iframe">
        <iframe :src="this.show_iframe ? attachment.value : ''"
          style="max-width: 100%"
          :height="attachment.height"
          :width="attachment.width"
          frameborder="0"
          allow="encrypted-media"
          allowfullscreen>
        </iframe>
      </div>
      <div v-else-if="img">
        <img class="limit-height" :src="attachment.value">
      </div>
      <div v-else-if="mp4">
        <video class="limit-height" controls>
          <source :src="attachment.value" type="video/mp4">
        </video>
      </div>

      <div v-else-if="mp3">
        <audio class="limit-height" controls>
          <source :src="attachment.value" type="audio/mpeg">
        </audio>
      </div>

      <div v-else-if="link">
        <div>
          <a target="_blank" :href="attachment.value">{{attachment.value}}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Tweet } from 'vue-tweet-embed'
export default {
  name: "PostAttachment",
  components: {
    Tweet,
  },
  props: {
    attachment: {
      type: Object,
      required: false,
      default: null
    },
    id: {
      type: String,
      required: true
    },
    collapse: {
      type: Boolean,
      required: true
    }
  },
  async mounted() {
    this.show_iframe = !this.collapse;
  },
  computed: {
    twitterID () {
      return this.attachment.value.includes('twitframe.com/show') && this.attachment.value.split('/')[this.attachment.value.split('/').length - 1].toString();
    },
    iframe() {
      return this.hasAttachment("iframe") && !this.attachment.value.includes('twitframe.com/show');
    },
    img() {
      return this.hasAttachment("img");
    },
    mp4() {
      return this.hasAttachment("mp4");
    },
    mp3() {
      return this.hasAttachment("mp3");
    },
    link() {
      return this.hasAttachment("link");
    },
    any() {
      return (
        this.attachment && this.attachment.value && this.attachment.display
      );
    }
  },
  methods: {
    hasAttachment(type) {
      return this.attachment.display == type;
    }
  },
  data() {
    return {
      show_iframe: false
    };
  }
};
</script>

<style scoped>
.limit-height {
  max-height:500px;
  width: auto
}
</style>