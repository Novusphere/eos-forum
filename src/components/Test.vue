<template>
    <div id="test">
      go away this is for testing
    </div>
</template>

<script>
import { GetNovusphere } from "@/novusphere";
import { GetEOS } from "@/eos";
//import IPFS from "ipfs";
//import render from "render-media";

import requests from "@/requests";

const novusphere = GetNovusphere();
var data = {};

export default {
  name: "Test",
  async mounted() {
    const novusphere = GetNovusphere();

    var test = await requests.get('https://api.jikan.moe/v3/search/anime?q=gundam&page=1');
    console.log(test);

    //console.log("ipfs creating");
    //const ipfs = new IPFS();
    //ipfs.on("ready", () => {
    //  console.log("ready");
      //const validCID = "QmTxagTmP2s5sjzgSxMvunRaHoqbD6P45Wwa9wMrcNmEWL";
      /*ipfs.files.get(validCID, function(err, files) {
        files.forEach(file => {
          console.log(file.path);
          console.log(file.content.toString("utf8"));
        });
      });*/
    //  const validCID = "QmRJeKa1SSdmdi6ba4GioYgJ2XFxvddTbhxkdvY6K3hnmk"; // video
    //  var _file = {
    //    name: "hello.mp4",
    //    createReadStream: function(opts) {
    //      console.log(opts);
    //      var stream = ipfs.files.catReadableStream(validCID, {
    //        offset: opts.start,
    //        length: opts.end && opts.end - opts.start
    //      });
    //      return stream;
    //    }
    //  };
    //  render.append(_file, "#test");

      //const validCID = "QmcKHbKHV39oHztW5Qugtm9ku1ZnwSdbBeu6RzMtgxh1vM"; // image
      /*const stream = ipfs.files.getReadableStream(validCID);

      stream.on("data", file => {
        // write the file's path and contents to standard out
        console.log(file.type);
        console.log(file.path);
        console.log(file.content);

        var _file = {
          name: "hello.png",
          createReadStream: function(opts) {
            console.log(opts);
            return file.content;
          }
        };
        render.append(_file, "#test");
        file.content.resume();

        console.log('OK');

      });*/

    //  console.log("alright");
    //});
  },
  methods: {},
  data() {
    return data;
  }
};
</script>
