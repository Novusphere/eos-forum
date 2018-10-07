<template>
  <div>
    <link rel="stylesheet" type="text/css" :href="theme"> 

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
              <ul class="nav nav-tabs" role="tablist">
                <li class="nav-item">
                  <a class="nav-link active" data-toggle="tab" href="#settings-api" role="tab">Raw</a>
                </li>
              </ul>
              <div class="tab-content mt-2">
                <div class="tab-pane fade show active" id="settings-api" role="tabpanel">
                  <div class="text-center">
                      <p class="text-alert">
                          <strong>Warning:</strong> You should not modify these settings unless you know what you're doing! 
                          If you incorrectly change something, click "reset" then "save" to restore the default settings.
                      </p>
                  </div>
                  <div class="form-group row">
                    <div class="col-sm-12">
                      <textarea rows="10" class="form-control" placeholder="Content" v-model="settings"></textarea>
                    </div>
                  </div>
                  <div class="text-center">
                    <button type="button" class="btn btn-outline-primary" data-dismiss="modal" v-on:click="save()">save</button>
                    <button type="button" class="btn btn-outline-secondary" v-on:click="reset()">reset</button>
                    <button type="button" class="btn btn-outline-danger" v-on:click="forgetAll()">forget all</button>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline-secondary" data-dismiss="modal">close</button>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script>
import { GetNovusphere } from "@/novusphere";
import { GetEOS, ScatterConfig, ScatterEosOptions } from "@/eos";
import { storage, DEFAULT_STORAGE, SaveStorage } from "@/storage";

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
      this.theme = storage.settings.theme;
      SaveStorage();
    },
    forgetAll() {
      window.__forgetStorage();
    }
  },
  data() {
    return {
      settings: "",
      theme: storage.settings.theme
    };
  }
};
</script>
