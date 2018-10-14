<template>
  <div>
    <PostHistoryModal ref="history_modal"></PostHistoryModal>
    <HeaderSection :load="load">
      <span class="title mr-3">search</span>
    </HeaderSection>
    <MainSection>
      <div>
        <div class="row mb-2">
            <ul>
                <li v-for="sub in subs" :key="sub._id">
                    <router-link :to="'/e/' + sub._id">/e/{{ sub._id }}</router-link> 
                    - {{ sub.count }} posts
                </li>
            </ul>
        </div>
      </div>
    </MainSection>
  </div>
</template>

<script>
import jQuery from "jquery";

import { GetScatter, GetScatterIdentity } from "@/eos";
import { GetNovusphere } from "@/novusphere";
import { forum } from "@/novusphere-forum";
import { MigratePost, ApplyPostEdit } from "@/migrations";
import { storage, SaveStorage } from "@/storage";

import Post from "@/components/core/Post";
import PostSorter from "@/components/core/PostSorter";

import PostHistoryModal from "@/components/modal/PostHistoryModal";

import HeaderSection from "@/components/section/HeaderSection";
import MainSection from "@/components/section/MainSection";

const MAX_ITEMS_PER_PAGE = 25;

export default {
  name: "Search",
  components: {
    Post: Post,
    PostSorter: PostSorter,
    PostHistoryModal: PostHistoryModal,
    HeaderSection: HeaderSection,
    MainSection: MainSection
  },
  watch: {},
  async mounted() {
    this.load();
  },
  methods: {
    async load() {
      const novusphere = GetNovusphere();
      var subs = (await novusphere.api({
        aggregate: novusphere.config.collection,
        maxTimeMS: 1000,
        cursor: {},
        pipeline: [
          {
            $match: {
                "data.json_metadata.sub": { $exists: true, $ne: "" },
                "data.json_metadata.edit": false
            }
          },
          {
            $group: {
                _id: "$data.json_metadata.sub",
                count: { $sum: 1 }
            }
          },
          {
              $sort: {
                  count: -1
              }
          }
        ]
      })).cursor.firstBatch;

      this.subs = subs;
    }
  },
  data() {
    return {
        subs: []
    };
  }
};
</script>