<template>
    <div class="container-fluid main-section">
      <div class="row">
        <div class="col-md-12">
          <div class="ml-2 mr-2">
            <slot></slot>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-md-12">
          <div class="row footer">
            <div class="col-md-12">
                <p class="text-center">
                  This is an experimental Reddit-style forum built on EOS by the <a href="https://novusphere.io">Novusphere Community</a>.
                  Special thanks to <a href="https://www.eoscanada.com/">EOS Canada</a>, <a href="https://greymass.com/">Greymass</a>, <a href="https://www.genereos.io/">GenerEOS</a>, and <a href="https://get-scatter.com/">Scatter</a>.
                </p> 
                <p class="text-center">
                  This site is hosted entirely from <a href="https://github.com/Novusphere/novusphere-eos/tree/gh-pages">GitHub Pages</a> and is fully <a href="https://github.com/Novusphere/novusphere-eos">open source</a>.
                  The developers of this software take no responsibility for the content displayed.
                  No images, files or media are hosted by the forum, please contact the respective site owners hosting content in breach of DMCA.
                </p>
              <div class="row">
                  <div class="col-12">
                      <div class="text-center">
                        <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 12.5%">
                        <img src="https://cdn.novusphere.io/static/eos2.svg" style="width: 12.5%">
                      </div>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>

<script>
import { MarkdownParser } from "@/markdown";

export default {
  name: "MainSection",
  async mounted() {
  },
  methods: {},
  data() {
    return {
      random_header: ""
    };
  }
};
</script>
