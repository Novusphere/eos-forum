<template>
    <div v-if="this.attachment && this.attachment.value" 
        :id="this.id" 
        :class="this.collapse ? 'row collapse' : 'row'">

        <div class="col-md-12">
            <div v-if="iframe" class="text-center">
              <iframe :src="this.show_iframe ? attachment.value : ''" 
                    style="max-width: 100%" 
                    :height="attachment.height" 
                    :width="attachment.width" 
                    frameborder="0" 
                    allow="encrypted-media" 
                    allowfullscreen>
              </iframe>
            </div>
            <div v-if="img" class="text-center">
                <img :src="attachment.value">
            </div>
            <div v-if="mp4" class="text-center">
                <video style="width: 100%" controls>
                    <source :src="attachment.value" type="video/mp4">
                </video>
            </div>
            <div v-if="mp3" class="text-center">
                <audio style="width: 100%" controls>
                    <source :src="attachment.value" type="audio/mpeg">
                </audio>
            </div>
            <div v-if="link">
                <div class="text-center">
                    <a target="_blank" :href="attachment.value">{{attachment.value}}</a>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
  name: "PostAttachment",
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
    iframe() {
      return this.hasAttachment("iframe");
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

