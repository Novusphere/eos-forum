<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="faq">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">FAQ/Help</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
                <ul class="">
                    <li class="">
                        <strong>This is entirely open source and all data is stored on the EOS blockchain!</strong>
                        The forum software can be found on
                        <a target="_blank" href="https://github.com/Novusphere/eos-forum">GitHub</a>
                        and can be configured to fully run locally, provided you also run a
                        <a target="_blank" href="https://github.com/Novusphere/novusphere-db">novusphere-db</a>
                        node.
                    </li>
                    <li class="">
                        You can post anonymously, for free, on any anon-* sub, for example: 
                        <router-link :to="'/e/anon'">anon</router-link>, 
                        <router-link :to="'/e/anon-general'">anon-general</router-link>
                        (close dialog after you click link).
                    </li>
                    <li class="">
                        For non-anon subs, you need an EOS account and
                        <a target="_blank" href="https://get-scatter.com/">Scatter</a>
                        to post and interact.
                    </li>
                    <li class="">
                        A sub doesn't need to be created, just go to it and start posting!
                    </li>
                    <li class="">
                        A guide to markdown (formatting your post) can be found 
                        <a target="_blank" href="https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet">here</a>
                    </li>
                    <li class="">
                        Our main project website:
                        <a target="_blank" href="https://novusphere.io">novusphere.io</a>
                    </li>
                    <li class="">
                        Our Twitter:
                        <a target="_blank" href="https://twitter.com/thenovusphere">@thenovusphere</a>
                    </li>
                    <li class="">
                        Our Discord:
                        <a target="_blank" href="https://discord.gg/PtXzUVr">clicking here</a>,
                        come chat with us live!
                    </li>
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" data-dismiss="modal">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
export default {
  name: "FaqModal",
  async mounted() {},
  methods: {},
  data() {
    return {
    };
  }
};
</script>
