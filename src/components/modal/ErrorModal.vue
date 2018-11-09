<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="errorModal">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">{{ title }}</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body" style="word-wrap: break-word">
                <div :class="text_class + ' text-center'">
                    {{ text }}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-primary" data-dismiss="modal">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import jQuery from "jquery";

export default {
  name: "ErrorModal",
  async mounted() {
    //
    // override alert
    //
    var _this = this;
    window.alert = function(message, args) {
      _this.text = message;
      _this.title = (args && args.title) ? args.title : 'Error';
      _this.text_class = (args && args.text_class) ? args.text_class : 'text-alert';
      jQuery("#errorModal").modal(args);
    };
  },
  methods: {},
  data() {
    return {
      text_class: "",
      title: "",
      text: ""
    };
  }
};
</script>
