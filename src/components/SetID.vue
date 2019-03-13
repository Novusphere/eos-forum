<template>

  <layout :load="load">

    <template slot="topic">
      <span>Settings</span>
    </template>

    <template slot="content">
      <div class="tab-pane">
        <div class="text-center">
          <p>
            Use this panel to set your ID.
            This is used when posting anonymously to identify your posts.
            You can regenerate a new ID / Key at any time.
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
              <button type="button" class="btn btn-primary" @click="newAnonId()">new</button>
              <button type="button" class="btn btn-primary" @click="saveAnonId()" data-dismiss="modal">save</button>
          </div>
        </form>
      </div>
    </template>
  </layout>

</template>


<script>
import ecc from "eosjs-ecc";

import ui from "@/ui";
import { storage, DEFAULT_STORAGE, SaveStorage } from "@/storage";
import { moderation } from "@/moderation";
import { LoadAccountState } from "@/accountstate";

import Pager from "@/components/core/Pager";
import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import Layout from "@/components/section/Layout";

export default {
  name: "Settings",
  components: {
    Pager,
    Post,
    PostSorter,
    Layout
  },
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
    async save() {
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
    async saveAnonId() {
      if (this.anon_name.length > 12) {
        alert("Anonymous name must be less than 13 characters");
        return;
      }
      storage.anon_id.name = this.anon_name;
      storage.anon_id.key =
        this.anon_key && ecc.isValidPrivate(this.anon_key) ? this.anon_key : "";

      if (storage.anon_id.key) {
        await LoadAccountState();
        SaveStorage();

        this.$forceUpdate();

        // download

        const json = JSON.stringify({
          name: storage.anon_id.name,
          key: storage.anon_id.key,
          identity: ecc.privateToPublic(storage.anon_id.key)
        });

        var a = window.document.createElement("a");
        a.href = window.URL.createObjectURL(
          new Blob([json], { type: "application/json" })
        );
        a.download = "forum-anonid.json";

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

      } else {
        SaveStorage();
      }
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