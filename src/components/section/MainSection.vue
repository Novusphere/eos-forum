<template>
    <div class="ml-3 mr-3">
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
                  This is an experimental Reddit-style forum built on EOS by the <a href="https://novusphere.io">Novusphere community</a>,
                  using the <a href="https://github.com/eoscanada/eosio.forum">eosio.forum</a> contract.
                  Special thanks to <a href="https://www.eoscanada.com/">EOS Canada</a>, <a href="https://greymass.com/">Greymass</a> and <a href="https://www.genereos.io/">GenerEOS</a>.
                </p> 
                <p class="text-center">
                  This site is hosted entirely from <a href="https://github.com/Novusphere/novusphere-eos/tree/gh-pages">GitHub Pages</a> and is fully <a href="https://github.com/Novusphere/novusphere-eos">open source</a>.
                  Developers of eos-forum take no responsibility for the content of the forum.
                  No images, files or media are hosted by eos-forum, please contact the respective site owners hosting content in breach of DMCA.
                </p>
              <div class="row">
                  <div class="col-12">
                      <div class="text-center">
                        <img src="https://cdn.novusphere.io/static/atmos.svg" style="width: 12.5%">
                        <img src="https://cdn.novusphere.io/static/eos.svg" style="width: 12.5%">
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
export default {
  name: "MainSection",
  async mounted() {},
  methods: {},
  data() {
    return {};
  }
};
</script>
