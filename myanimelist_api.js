const axios = require("axios").default;

const base = "https://myanimelist.net/";

/**
 * Method is "plain" by default
 * 
 * @param {*} client_id 
 * @param {*} state 
 * @param {*} redirect_uri 
 * @param {*} pkce_code 
 */
module.exports.authenticatev1 = function (client_id, pkce_code) {
    console.log("CHALLENGE CODE: %s", pkce_code);
    const authurl = base + `v1/oauth2/authorize?response_type=code&client_id=${client_id}&code_challenge=${pkce_code}&code_challenge_method=plain`;
    return axios.get(authurl);
}

/**
 * Code Verifier = Code Challenge if method is plain 
 */
module.exports.generate_code_verifier = function () {
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
