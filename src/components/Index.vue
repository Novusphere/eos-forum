<template>
  <div class="container">
     <div>
        <div class="form-group">
          <label for="metadata"><strong>Metadata:</strong></label>
          <textarea class="form-control" id="metadata" v-model="metadata">></textarea>
        </div>
        <button class="btn btn-primary" type="button" v-on:click="indexContent(metadata)">Index to EOS</button>
    </div> 
  </div>
</template>

<script>
import { Eos, ScatterConfig, ScatterEosOptions } from '../eos'

export default {
  name: "Index",
  methods: {
    indexContent: async function(metadata) {
      // valid json
      try
      {
          JSON.parse(metadata);
          if (metadata.length > 8192)
            throw ('Metadata too large');
      }
      catch (ex) {
        alert('Invalid metadata json!');
        return;
      }

      // get scatter identity
      var identity = await window.scatter.getIdentity({
        accounts: [
          {
            chainId: ScatterConfig.chainId,
            blockchain: ScatterConfig.blockchain
          }
        ]
      });

      const eosAccount = identity.accounts[0].name;
      const eosAuth = identity.accounts[0].authority;

      // make scatter eos instance
      const eos = window.scatter.eos(ScatterConfig, Eos, ScatterEosOptions, 'https');

      // push to eosforum contract
      var eosforum = await eos.contract("eosforumtest");
      var result = await eosforum.transaction(tx => {
        tx.post(
          {
            title: "NOVUSPHERE",
            account: eosAccount,
            certify: 1,
            content: "NOVUSPHERE",
            post_uuid: "NOVUSPHERE",
            json_metadata: metadata,
            reply_to_account: "",
            reply_to_post_uuid: ""
          },
          {
            authorization: [
              {
                actor: eosAccount,
                permission: eosAuth
              }
            ]
          }
        );
      });

      this.$router.push('/watch/' + result.transaction_id);
    }
  },
  data() {
    return {
      metadata: JSON.stringify({
        type: 'mp4/video', 
        description: 'Sintel IPFS test', 
        data: 'QmdZjVhL9MBG9zcMrxzisX6hdsXPqFVAgvyeqe8JpMDudm',
        dataFormat: 'ipfs'
      })
    };
  }
};
</script>