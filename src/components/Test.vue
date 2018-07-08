<template>
    <div></div>
</template>

<script>
import { GetNovusphere } from '../novusphere'

const novusphere = GetNovusphere();
var data = {};

export default {
  name: "Test",
  async mounted() {
      var query = {
        "find": novusphere.config.database,
        "filter": { 
          'data.title': "NOVUSPHERE", 
          'data.json_metadata.type': { '$exists': true } 
        },
        "maxTimeMS": 1
      };
      var payload = await novusphere.api(query);
      console.log(payload);
  },
  methods: {
  },
  data() {
    return data;
  }
}
</script>
