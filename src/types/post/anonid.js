import ecc from "eosjs-ecc";

class PostAnonId {
    constructor(anon_id) {
        anon_id = Object.assign({
            name: "",
            pub: "",
            sig: "",
        }, anon_id);

        this.name = anon_id.name ? anon_id.name : "";
        this.pub = anon_id.pub ? anon_id.pub : "";
        this.sig = anon_id.sig ? anon_id.sig : "";
        this.verified = false;
    }

    verify(content) {
        if (this.sig && this.pub) {
            this.verified = ecc.verify(this.sig, content, this.pub, 'utf8');
        }
    }
}

export { PostAnonId };