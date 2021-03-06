const express = require("express");
const os = require("os");
const opn = require("opn");

const { sequelize } = require("./models/index")
const { Client } = require("./myanimelist_api");
const { myanimelist } = require("./secrets.json");

const mal = new Client(myanimelist.ClientID);

const app = express();

app.get("/auth_callback", (req, res) => {
    if (req.query.code) {
        mal.challengeAccepted(req.query.code).then(result => res.sendStatus(200)).then(e => console.log("%s", mal.getAccessToken()));
    } else {
        res.sendStatus(401);
    }
})


app.use((req, res) => {
    mal.getAnimelist().next().then(console.log)
    res.sendStatus(200);
})

app.listen(3000, () => {
    sequelize.sync().then(() => {
        const oauthUrl = mal.initOAuthProcess();

        console.log("Myanimelist OAuth URL: %s", oauthUrl);
        opn(oauthUrl);

        console.log("Listening on: %s:%s", os.networkInterfaces()["Wi-Fi"][0].address, 3000)
    })
})