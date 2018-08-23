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
      var eos = GetEOS();
      var test = await eos.getTransaction({
        block_num_hint: 9250295,
        id: '6048934cad3c75db4f2e00249e28fdf34682e113c02ae5c0ccb3bbea090bd48a'
      });
      /*var test = await eos.getActions({
          'account_name': 'eosforumtest',
          'pos': 0,
          'offset': 19
      });*/
      console.log(test);
      /*for (var i = 0; i < test.actions.length; i++) {
        var act = test.actions[i].action_trace.act;
        console.log(act.name + ' ' + act.data.poster + ' ' + act.data.post_uuid);
      }*/
  },
  methods: {
  },
  data() {
    return data;
  }
}
</script>
