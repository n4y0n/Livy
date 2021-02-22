const express = require("express");

const { authenticatev1, generate_code_verifier } = require("./myanimelist_api")

const { myanimelist, anilist } = require("./secrets.json");

const app = express();

app.get("/test", (req, res) => {
    authenticatev1(myanimelist.ClientID, generate_code_verifier()).then(r => {
        console.log(r.request)
        res.sendStatus(200);
    })
})

app.use((req, res) => {
    console.log("Data Location: %s", req.headers.location)
    console.log("Data Host: %s", req.headers.host)
    res.sendStatus(200);
})

app.listen(3000, () => console.log("Listening on port: %s", 3000))