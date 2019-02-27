<template>
  <div v-if="this.attachment && this.attachment.value"
    :id="this.id"
    :class="this.collapse ? 'row collapse' : 'row'">

    <div class="col-md-12">
      <Tweet v-if="twitterID" :id="twitterID" />
      <div v-else-if="telegramID" :id="random_id + '-telegram'">
        <!-- append -->
      </div>
      <div v-else-if="iframe" class="text-center">
        <iframe :src="this.show_iframe ? attachment.value : ''"
          style="max-width: 100%"
          :height="attachment.height"
          :width="attachment.width"
          frameborder="0"
          allow="encrypted-media"
          allowfullscreen>
        </iframe>
      </div>
      <div v-else-if="markdown">
        <p v-html="markdown_html"></p>
      </div>
      <div v-else-if="img">
        <img class="limit-height" :src="attachment.value">
      </div>
      <div v-else-if="mp4" class="text-center">
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
import { Tweet } from "vue-tweet-embed";
import { MarkdownParser } from "@/markdown";
import telegram from "@/telegram";

export default {
  name: "PostAttachment",
  components: {
    Tweet
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

    // unfortunately, there's no vue component for this :(
    if (this.telegramID) {
      var child = document.getElementById(this.random_id + "-telegram");
      var script = document.createElement("script");
      script.setAttribute("data-telegram-post", this.telegramID);
      script.setAttribute("data-telegram-rn", this.random_id);
      script.setAttribute("data-width", "100%");
      child.appendChild(script);

      telegram(window);
    }
  },
  computed: {
    twitterID() {
      if (this.attachment.value.includes("twitframe.com/show")) {
        const s = this.attachment.value.match(/status\/[0-9]+/);
        if (s && s.length > 0) {
          return s[0].split("/")[1];
        }
      }
      return "";
    },
    telegramID() {
      if (this.attachment.type == "url") {
        const t_me = "://t.me/";
        const t_me_i = this.attachment.value.indexOf(t_me);
        if (t_me_i > -1) {
          const s = this.attachment.value.substring(t_me_i + t_me.length);
          return s;
        }
      }
      return "";
    },
    iframe() {
      return (
        this.hasAttachment("iframe") &&
        !this.attachment.value.includes("twitframe.com/show")
      );
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
    markdown() {
      return this.hasAttachment("markdown");
    },
    markdown_html() {
      var md = new MarkdownParser(this.attachment.value);
      return md.html;
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
      random_id: (Math.random() * 0x7FFFFFFF) | 0,
      show_iframe: false
    };
  }
};
</script>

<style scoped>
.limit-height {
  max-height: 500px;
  width: auto;
}
</style>