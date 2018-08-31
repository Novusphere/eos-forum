<template>
      <div class="modal fade" tabindex="-1" role="dialog" id="settings">
        <div class="modal-dialog modal-full" role="document">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Settings</h5>
              <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div class="modal-body">
                <div class="text-center">
                    <p class="text-danger">
                        <strong>Warning:</strong> You should not modify these settings unless you know what you're doing! 
                        If you incorrectly change something, click "reset" then "save" to restore the default settings.
                    </p>
                </div>
                  <div class="form-group row">
                    <div class="col-sm-12">
                      <textarea rows="10" class="form-control" placeholder="Content" v-model="settings"></textarea>
                    </div>
                  </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-success" data-dismiss="modal" v-on:click="save()">save</button>
                <button type="button" class="btn btn-outline-warning" v-on:click="reset()">reset</button>
                <button type="button" class="btn btn-outline-danger" data-dismiss="modal">close</button>
            </div>
          </div>
        </div>
      </div>
</template>

<script>
import { GetNovusphere } from "../novusphere.js";
import { GetEOS, ScatterConfig, ScatterEosOptions } from "../eos.js";
import { storage, DEFAULT_STORAGE, SaveStorage } from "../storage.js";

export default {
  name: "SettingsModal",
  async mounted() {
    this.load();
  },
  methods: {
    async load(txid) {
      this.settings = JSON.stringify(storage.settings, null, 2);
    },
    reset() {
      this.settings = JSON.stringify(DEFAULT_STORAGE.settings, null, 2);
    },
    save() {
        storage.settings = JSON.parse(this.settings);
        SaveStorage();
    }
  },
  data() {
    return {
      settings: ""
    };
  }
};
</script>
