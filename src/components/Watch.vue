<template>
  <div class="container">
     <div class="row">
         <div v-if="videoUrl" class="col-md-12">
            <video width="320" height="240" controls style="width: 100%">
                <source :src="videoUrl" type="video/mp4">
                Your browser does not support the video tag.
            </video> 
          </div>
          <div class="col-md-12">
              <p>
                  <strong>Indexer:</strong>
                  <a :href="'https://eostracker.io/accounts/' + indexer">{{ indexer }}</a>
              </p>
              <p>
                  <strong>Tx:</strong>
                  <a :href="'https://eostracker.io/transactions/' + txid">{{ txid }}</a>
              </p>
              <p>
                <strong>Source:</strong>
                  <a :href="videoUrl">{{ videoUrl }}</a>
              </p>
              <p>
                <strong>Description:</strong>
                <blockquote>
                    {{ description }}
                </blockquote>
              </p>
          </div>
      </div> 
  </div>
</template>

<script>
import { GetEOS, ScatterConfig, ScatterEosOptions } from '../eos'

var watchData = {
    txid: '',
    videoUrl: '',
    ipfsHash: '',
    description: '',
    indexer: '',
};

export default {
  name: "Watch",
  mounted() {
      async function load(scatter, txid) {
            watchData.txid = txid;

            const eos = GetEOS(scatter);
            var tx = await eos.getTransaction(txid);
            var actions = tx.trx.trx.actions;
            if (actions && actions.length >= 1) {
                var action = actions.find(a => a.account == 'eosforumtest');
                try
                {
                    var metadata = JSON.parse(action.data.json_metadata);

                    if (metadata.data && metadata.dataFormat && metadata.type && metadata.description) { // valid
                        watchData.indexer = action.data.account;
                        watchData.description = metadata.description;

                        if (metadata.dataFormat == 'ipfs') 
                            watchData.videoUrl = 'https://ipfs.io/ipfs/' + metadata.data;
                        else if (metadata.dataFormat == 'url')
                            watchData.videoUrl = metadata.data;
                    }
                }
                catch (ex) {
                    return;
                }
            }
       }

      var txid = this.$route.params.id;
      load(null, txid);
      /*if (window.scatter) {
          load(window.scatter, txid);
      }
      else {
          document.addEventListener('scatterLoaded', scatterExtension => {
                load(window.scatter, txid);
          });
      }*/
  },
  methods: {
  },
  data() {
    return watchData;
  }
};
</script>