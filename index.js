const { default: axios } = require("axios");
const FormData = require("form-data");
const express = require("express");

const { genAuthUrlv1, getVerificationCode, genTokenExchangeUrl } = require("./myanimelist_api")

const { myanimelist } = require("./secrets.json");

const app = express();

app.get("/mlogin", (req, res) => {
    genAuthUrlv1(myanimelist.ClientID)
        .then(authUrl => {
            console.log("OAuth URL: %s", authUrl);
            res.send({
                authUrl
            });
        })
});

app.get("/auth_callback", (req, res) => {
    if (req.query.code) {
        console.log("Code: %s", req.query.code);
        const verification_code = getVerificationCode(myanimelist.ClientID);
        genTokenExchangeUrl().then(url => {
            const form = new FormData();
            form.append("client_id", myanimelist.ClientID);
            form.append("client_secret", "");
            form.append("grant_type", "authorization_code");
            form.append("code", req.query.code);
            form.append("code_verifier", verification_code);
            form.append("redirect_uri", "http://localhost:3000")

            return axios.post(url, form, { headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        }).then(r => {
            console.log(r.body);
            res.sendStatus(200);
        })
    } else {
        res.sendStatus(401);
    }
})


app.use((req, res) => {
    console.log(req.query)
    console.log(req.params)
    console.log(req.body)
    console.log(req.url)
    res.sendStatus(200);
})

app.listen(3000, () => console.log("Listening on port: %s", 3000))