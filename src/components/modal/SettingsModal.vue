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
                  <a class="nav-link active" data-toggle="tab" href="#settings-mod" role="tab">Moderation</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-toggle="tab" href="#settings-anonid" role="tab">Anon Id</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-toggle="tab" href="#settings-theme" role="tab">Theme</a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" data-toggle="tab" href="#settings-api" role="tab">Raw</a>
                </li>
              </ul>
              <div class="tab-content mt-2">
                <div class="tab-pane fade show active" id="settings-mod" role="tabpanel">
                  <div class="text-center">
                      <p class="">
                          Use this panel to control your delegated moderation settings.
                          <a target="_blank" href="https://github.com/Novusphere/eos-forum-mod-list">Click here to learn more</a>.
                      </p>
                  </div>
                  <form class="mx-4">
                    <div class="form-group row">
                      <label class="col-2 col-form-label">Known</label>
                      <div class="col-8">
                        <select class="form-control" v-model="mod_list_value" @change="modListChange()">
                          <option v-for="e in mod_list" :key="e.name" :value="e.endpoint">{{ e.name }}</option>
                        </select>
                      </div>
                      <div class="col-2">
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-2 col-form-label"></label>
                      <div class="col-8">
                        <input type="text" class="form-control" v-model="new_mod" placeholder="endpoint">
                      </div>
                      <div class="col-2">
                        <button type="button" class="btn btn-outline-primary" v-on:click="addMod()">add</button>
                      </div>
                    </div>
                    <div v-for="(mod, index) in mods" :key="index" class="form-group row">
                      <label class="col-2 col-form-label"></label>
                      <div class="col-8">
                        <input type="text" readonly class="form-control" :value="mod">
                      </div>
                      <div class="col-2">
                        <button type="button" class="btn btn-outline-danger" v-on:click="removeMod(index)">
                          <font-awesome-icon :icon="['fas', 'times']" ></font-awesome-icon>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
                <div class="tab-pane fade" id="settings-anonid" role="tabpanel">
                  <div class="text-center">
                      <p class="">
                          Use this panel to control your anonymous identity. 
                          This is used when posting anonymously to identify your posts.
                          You can regenerate a new anonymous identity at any time.
                      </p>
                  </div>
                  <form class="mx-4">
                    <div class="form-group row">
                      <label class="col-2 col-form-label">Name</label>
                      <div class="col-8">
                        <input type="text" class="form-control" v-model="anon_name" placeholder="name">
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-2 col-form-label">Key</label>
                      <div class="col-8">
                        <input type="text" class="form-control" v-model="anon_key" placeholder="identity key">
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-2 col-form-label"></label>
                      <div class="col-8">
                        <input type="text" class="form-control" v-model="anon_identity" readonly placeholder="identity public key">
                      </div>
                    </div>
                    <div class="text-center">
                        <button type="button" class="btn btn-outline-primary" v-on:click="newAnonId()">new</button>
                        <button type="button" class="btn btn-outline-primary" v-on:click="saveAnonId()" data-dismiss="modal">save</button>
                    </div>
                  </form>
                </div>
                <div class="tab-pane fade" id="settings-api" role="tabpanel">
                  <div class="text-center">
                      <p class="text-alert">
                          <strong>Warning:</strong> You should not modify these settings unless you know what you're doing! 
                          If you incorrectly change something, click "reset" then "save" to restore the default settings.
                      </p>
                  </div>
                  <form class="mx-4">
                    <div class="form-group row">
                      <div class="col-sm-12">
                        <textarea rows="10" class="form-control" placeholder="Content" v-model="settings"></textarea>
                      </div>
                    </div>
                    <div class="text-center">
                      <button type="button" class="btn btn-outline-primary" data-dismiss="modal" v-on:click="save()">save</button>
                      <button type="button" class="btn btn-outline-primary" v-on:click="reset()">reset</button>
                      <button type="button" class="btn btn-outline-danger" v-on:click="forgetAll()">forget all</button>
                    </div>
                  </form>
                </div>
                <div class="tab-pane fade" id="settings-theme" role="tabpanel">
                  <div class="text-center">
                      <p class="">
                          Use this panel to control your theme settings.
                      </p>
                  </div>
                  <form class="mx-4">
                    <div class="form-group row">
                      <label class="col-2 col-form-label">Known</label>
                      <div class="col-8">
                        <select class="form-control" v-model="theme_list_value" @change="themeListChange()">
                          <option value="https://eos-forum.org/static/css/theme/night.css">night theme</option>
                          <option value="https://eos-forum.org/static/css/theme/day.css">day theme</option>
                        </select>
                      </div>
                      <div class="col-2">
                      </div>
                    </div>
                    <div class="form-group row">
                      <label class="col-2 col-form-label"></label>
                      <div class="col-8">
                        <input type="text" class="form-control" v-model="new_theme" placeholder="theme css url">
                      </div>
                      <div class="col-2">
                        <button type="button" class="btn btn-outline-primary" v-on:click="saveTheme()">save</button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div class="modal-footer">
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script>
import ecc from "eosjs-ecc";

import ui from "@/ui";
import { storage, DEFAULT_STORAGE, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";

export default {
  name: "SettingsModal",
  async mounted() {
    this.load();
  },
  computed: {
    anon_identity() {
      if (!this.anon_key) {
        return "";
      }
      return ecc.privateToPublic(this.anon_key);
    }
  },
  methods: {
    async load(txid) {
      this.settings = JSON.stringify(storage.settings, null, 2);
      this.mods = storage.moderation.mods;
      this.new_theme = storage.settings.theme;
      this.anon_key = storage.anon_id.key;
      this.anon_name = storage.anon_id.name;
      await this.loadReccomendedMods();
    },
    async loadReccomendedMods() {
      this.mod_list = await ui.actions.GetReccomendedModList();
    },
    modListChange() {
      this.new_mod = this.mod_list_value;
    },
    themeListChange() {
      this.new_theme = this.theme_list_value;
    },
    reset() {
      this.settings = JSON.stringify(DEFAULT_STORAGE.settings, null, 2);
    },
    save() {
      storage.settings = JSON.parse(this.settings);
      this.theme = storage.settings.theme;
      this.mods = storage.moderation.mods;
      SaveStorage();
    },
    forgetAll() {
      window.__forgetStorage();
    },
    saveTheme() {
      storage.settings.theme = this.new_theme;
      this.theme = this.new_theme;
      SaveStorage();
    },
    async addMod() {
      if (storage.moderation.mods.includes(this.new_mod)) {
        return;
      }

      var key = moderation.dateToKey(new Date());
      if ((await moderation.resolve(this.new_mod, key)) == null) {
        if (
          !await confirm(
            '"' +
              this.new_mod +
              '" does not seem like a valid moderation endpoint, are you sure you want to add it?'
          )
        ) {
          return;
        }
      }

      storage.moderation.mods.push(this.new_mod);
      moderation.resetCache();
      SaveStorage();

      this.mods = storage.moderation.mods;
      this.new_mod = "";
    },
    removeMod(index) {
      storage.moderation.mods.splice(index, 1);
      moderation.resetCache();
      SaveStorage();

      this.mods = storage.moderation.mods;
    },
    async newAnonId() {
      this.anon_key = await ecc.randomKey();
    },
    saveAnonId() {
      if (this.anon_name.length > 12) {
        alert('Anonymous name must be less than 13 characters');
        return;
      }
      storage.anon_id.name = this.anon_name;
      storage.anon_id.key = (this.anon_key && ecc.isValidPrivate(this.anon_key)) ? this.anon_key : "";
      SaveStorage();
    }
  },
  data() {
    return {
      settings: "",
      theme: storage.settings.theme,
      mods: [],
      mod_list: [],
      mod_list_value: "",
      new_mod: "",
      theme_list_value: "",
      new_theme: "",
      anon_name: "",
      anon_key: ""
    };
  }
};
</script>
