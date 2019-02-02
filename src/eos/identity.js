const UPDATE_IDENTITY_SPEED = 5000;

export default class Identity {
    constructor() {
        this.setDefault();
    }
    
    setDefault() {
        this.account = '';
        this.publicKey = '';
        this.auth = '';
        this.atmos = '0.000';
        this.token = '0.000';
        this.notifications = 0;

        if (this._updater) {
            clearInterval(this.updater);
        }

        window.dispatchEvent(new Event('identity'));
    }

    async update(forced) {
        var g_identity = this;
        if (g_identity.account) {
            window.dispatchEvent(new Event('identityUpdate'));

            if (!this._updater) {
                this._updater = setInterval(() => this.update(), UPDATE_IDENTITY_SPEED);
            }
        }
        if (forced) {
            window.dispatchEvent(new Event('identity'));
        }
    }
};