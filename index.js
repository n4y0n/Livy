const express = require("express");

const { Client } = require("./myanimelist_api");
const { myanimelist } = require("./secrets.json");

const mal = new Client(myanimelist.ClientID);

const app = express();

app.get("/auth_callback", (req, res) => {
    if (req.query.code) {
        mal.challengeAccepted(req.query.code).then(result => res.sendStatus(200));
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

app.listen(3000, () => {
    console.log("Myanimelist OAuth URL: %s", mal.initOAuthProcess());
    console.log("Listening on port: %s", 3000)
})