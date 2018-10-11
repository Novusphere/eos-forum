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
                <button type="button" class="btn btn-outline-success" v-on:click="resolve(true)">ok</button>
                <button type="button" class="btn btn-outline-danger" v-on:click="resolve(false)">cancel</button>
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
    window.confirm = async function(message, setStatus, okCallback) {
      if (setStatus) {
        setStatus(_this.setStatus);
      }

      var success = true;
      var click_ok;
      _this.text = message;
      
      var oldModal = jQuery('.modal.show');
      oldModal.modal("hide");

      jQuery("#confirmModal").modal({ backdrop: "static", keyboard: false });

      for (;;) {
        click_ok = await new Promise(resolve => {
          _this.resolve = resolve;
        });

        if (click_ok && okCallback) {
          success = await okCallback();
          if (success) {
            break;
          }
        }
        else {
          break;
        }
      }

      jQuery("#confirmModal").modal("hide");
      oldModal.modal();

      if (setStatus) {
        setStatus(null);
      }

      return click_ok;
    };
  },
  methods: {
    setStatus(text) {
      this.text = text;
    }
  },
  data() {
    return {
      resolve: null,
      text: ""
    };
  }
};
</script>
