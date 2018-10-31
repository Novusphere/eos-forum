const UPDATE_IDENTITY_SPEED = 5000;

export default class Identity {
    constructor() {
        this.setDefault();
    }
    
    setDefault() {
        this.account = '';
        this.auth = '';
        this.atmos = '0.000';
        this.notifications = 0;

        window.dispatchEvent(new Event('identity'));
    }

    async update(forced) {
        var g_identity = this;

        if (g_identity.account) {
            window.dispatchEvent(new Event('identityUpdate'));
        }
    
        if (!forced) {
            setTimeout(this.update, UPDATE_IDENTITY_SPEED);
        } else {
            window.dispatchEvent(new Event('identity'));
        }
    }
};