<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="confirmModal">
        <div class="modal-dialog" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Confirm</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
                <div class="text-center">
                    {{ text }}
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success" data-dismiss="modal" v-on:click="resolve(true)">ok</button>
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal" v-on:click="resolve(false)">cancel</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import jQuery from "jquery";

export default {
  name: "ConfirmModal",
  async mounted() {
      //
      // override alert
      //
      var _this = this;
      window.confirm = function(message, args) {
          return new Promise((resolve) => {
                _this.text = message;
                _this.resolve = resolve;
                args = jQuery.extend(args ? args : {}, {backdrop: 'static', keyboard: false});
                jQuery("#confirmModal").modal(args);
          });
      };
  },
  methods: {},
  data() {
    return {
        resolve: null,
        text: ''
    };
  }
};
</script>
