export default class LynxWallet {
    static async detect(identity) {
        if (window.lynxMobile) {
            var lynx = window.lynxMobile;
            return new LynxWallet(lynx, identity);
        }
        return null; // fail
    }

    constructor(lynx, identity) {
        this.lynx = lynx;
        this.identity = identity;
    }

    async setIdentity(g_identity) {
        const lynx = this.lynx;
        const identity = await lynx.requestSetAccountName();

        this.identity.account = identity;
        this.identity.publicKey = '';
        this.identity.auth = 'active'; // assume
        this.identity.atmos = '0.000';
        this.identity.token = '0.000';
        this.identity.notifications = 0;
        
        await this.identity.update(true);
    }

    async forgetIdentity() {
        this.identity.setDefault();
    }

    async executeActions(auth, actions) {
        const lynx = this.lynx;

        var lynx_actions = actions.map(function (a) {
            return {
                account: a.contract,
                name: a.name,
                data: a.data,
                authorization: auth.authorization
            };
        });

        try { 
            var eostx = await lynx.transact(lynx_actions);
            if (eostx == null) {
                _alert('eostx is null');
            }
            else if (!eostx.transaction_id) {
                _alert('eostx.transaction_id is not set');
            }
            return eostx.transaction_id;
        }
        catch (err) {
            _alert('An error occured from transact()');
            _alert(err);

            throw err;
        }
    }

    async sign(pub, data, reason) {
        const lynx = this.lynx;
        return await lynx.requestArbitrarySignature({
            data: data,
            whatFor: reason ? reason : '',
        });
    }
}