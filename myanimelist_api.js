const { default: axios } = require("axios");
const { LoginInformation, Sequelize } = require("./models/index");

const base = "https://myanimelist.net/";

/**
 * Code Verifier = Code Challenge if method is plain 
 */
function generate_code_verifier() {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
    let gen = "";

    for (let i = 0; i < 128; i++) {
        gen += alphabet[between(0, alphabet.length - 1)];
    }

    return gen;
}

function between(min, max) {
    return Math.floor(
        Math.random() * (max - min) + min
    )
}

function assert_enable(e) {
    if (!e) {
        throw new Error("Client not enabled, please log in first using the OAuth Url in the console.")
    }
}

module.exports.Client = class {
    id = null;
    verifier_code = null;
    access_token = null;
    refresh_token = null;

    client_enabled = false;

    constructor(client_id) {
        this.id = client_id;
        this.verifier_code = generate_code_verifier();
    }

    initOAuthProcess() {
        /*${redirect ? `&redirect_uri=${redirect}` : ""}*/
        LoginInformation.findOne({
            where: {
                access_expire: { [Sequelize.Op.gte]: new Date(Date.now() - 2415600) }
            }
        }).then(li => {
            console.log("Found still unexpired tokens. Using those or open the url to reset.");
            this.setOAuthResult({ access_token: li.access_token, refresh_token: li.refresh_token, expires_in: li.access_expire - new Date() });
        });

        return base + `v1/oauth2/authorize?response_type=code&client_id=${this.id}&code_challenge=${this.verifier_code}&code_challenge_method=plain`;
    }

    challengeAccepted(authorization_code) {
        const url = base + `v1/oauth2/token`
        const body = `client_id=${this.id}&grant_type=authorization_code&code=${authorization_code}&code_verifier=${this.verifier_code}`;
        return axios.post(url, body, { headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Basic " + this.id } })
            .then(r => r.data)
            .then(json => this.updateDb(json));
    }

    refreshTokens() {
        this.client_enabled = false;
        const url = base + `v1/oauth2/token`
        const body = `client_id=${this.id}&grant_type=refresh_token&refresh_token=${this.refresh_token}`;
        return axios.post(url, body, { headers: { "Content-Type": "application/x-www-form-urlencoded", "Authorization": "Basic " + this.id } })
            .then(r => r.data)
            .then(json => this.updateDb(json));
    }

    updateDb(json) {
        LoginInformation
            .create({ api: "myanimelist", access_token: json.access_token, refresh_token: json.refresh_token, access_expire: new Date(Date.now() + json.expires_in), refresh_expire: null })
            .then(result => console.log("Login or Refresh successful"));
        this.setOAuthResult(json);
    }

    setOAuthResult(data) {
        const { expires_in, access_token, refresh_token } = data;
        this.access_token = access_token;
        this.refresh_token = refresh_token;
        setTimeout(() => this.refreshTokens(), expires_in - 10000);
        this.client_enabled = true;
    }

    getAnimelist(limit = 30) {
        const client_enabled = this.client_enabled;
        const url = `https://api.myanimelist.net/v2/users/@me/animelist?fields=list_status&limit=${limit}`
        const token = this.access_token;

        return {
            _npage: null,
            next: async function () {
                assert_enable(client_enabled);
                try {
                    const result = await axios.get(url, { headers: { 'Authorization': 'Bearer ' + token } }).then(r => r.data);
                    console.log(result)
                    return { done: false, value: result.data };
                } catch (e) {
                    return { done: true };
                }
            },
            [Symbol.asyncIterator]: function () { return this; }
        }
    }

    getAccessToken() {
        return this.access_token;
    }
}