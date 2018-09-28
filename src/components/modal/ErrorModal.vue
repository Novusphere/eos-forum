<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="errorModal">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Error</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
                <div class="text-danger text-center">
                    {{ text }}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success" data-dismiss="modal">close</button>
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
          jQuery("#errorModal").modal(args);
      };
  },
  methods: {},
  data() {
    return {
        text: ''
    };
  }
};
</script>
