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
        mal.challengeAccepted(req.query.code).then(result => res.sendStatus(200)).catch(e => res.sendStatus(500));
    } else {
        res.sendStatus(401);
    }
})

app.get("/start_backup", (req, res) => {
    mal.getAnimelist();
    res.sendStatus(200);
})


app.use((req, res) => {
    res.sendStatus(200);
})

app.listen(3000, () => {
    sequelize.sync().then(async () => {
        const { url, update } = await mal.initOAuthProcess();

        console.log("Myanimelist OAuth URL: %s", url);
        
        if (update) opn(url);

        console.log("Listening on: %s:%s", os.networkInterfaces()["Wi-Fi"][0].address, 3000)
    })
})