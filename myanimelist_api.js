const base = "https://myanimelist.net/";

const codes = new Map();

/**
 * Method is "plain" by default
 * Get Authorization code url
 */
module.exports.genAuthUrlv1 = async function (client_id, redirect) {
    const challengeCode = generate_code_verifier();
    codes.set(client_id, challengeCode);
    return base + `v1/oauth2/authorize?response_type=code&client_id=${client_id}&code_challenge=${challengeCode}${redirect ? `&redirect_uri=${redirect}` : ""}&code_challenge_method=plain`;
}

/**
 * Exchange authorization code for refresh and access tokens url
 */
module.exports.genTokenExchangeUrl = async function () {
    return base + `v1/oauth2/token`
}

module.exports.getVerificationCode = function (client_id) {
    const code = codes.get(client_id);
    codes.delete(client_id);
    return code;
}

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