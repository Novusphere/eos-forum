<template>
    <div></div>
</template>

<script>
import { GetNovusphere } from '../novusphere'
import { GetEOS, ScatterConfig, ScatterEosOptions } from "../eos"

const novusphere = GetNovusphere();
var data = {};

export default {
  name: "Test",
  async mounted() {
      var eos = GetEOS(window.scatter);
      //var test = await eos.getTransaction('191bc59e34945e4bf95fdb7834693172d0682d2e4461e6a924500e3c0fd54fc3');
      var test = await eos.getActions({
          'account_name': 'eosforumtest',
          'pos': 0,
          'offset': 19
      });
      console.log(test);
      for (var i = 0; i < test.actions.length; i++) {
        var act = test.actions[i].action_trace.act;
        console.log(act.name + ' ' + act.data.poster + ' ' + act.data.post_uuid);
      }
  },
  methods: {
  },
  data() {
    return data;
  }
}
</script>
