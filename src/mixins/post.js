export default {
  methods: {
    $_openPost (postID, sub, title){
      this.selectedPostID = postID;
      history.pushState({},"",`${window.__PRE_ROUTE__}/e/${sub}/${postID}/${title}`);
    },
    $_closePost () {
      this.selectedPostID = undefined;
      history.pushState({},"",`${window.__PRE_ROUTE__}/`);
    },
  }
}