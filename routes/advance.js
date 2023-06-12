const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bodyParser = require("body-parser");
const https = require("https");
const { response } = require("express");
const { send } = require("process");

router.use(express.static("public"));
router.use(bodyParser.urlencoded({extended: true}));

const config = {
    user: "admin",
    password: "password",
    database: "TreeDatabase",
    server: "database-1.cwzmrb2zxpnu.ca-central-1.rds.amazonaws.com",
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    },
    options: {
        // encrypt: true, // for azure
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
};

const appId = "dzj438gav6mx5g5pr5p29xzxi";

router.get("/", (req, res) => {
    res.render("advancePage");
});

router.get("/comToBotVise", async (req, res) => {
    let result = "";
    if(Object.keys(req.query).length !== 0){
        try {
            disp = "block";
            let queryResult = undefined;
            let nameOfTree = req.query.name.replace("-", " ");

            if(req.query.typeName === "botanical"){
                queryResult = "common";
            }else{
                queryResult = "botanical";
            }

            await sql.connect(config);
            result = await sql.query(`SELECT ${queryResult} FROM CommonName WHERE ${req.query.typeName} = '${nameOfTree}'`);

            if(result.recordset.length === 0){
                res.render("oops")
            }else{
                res.render("comToBotVise", {
                    display : "block",
                    typeName : req.query.typeName,
                    result : result
                });
            }
        } catch (err) {
            console.log(err);
        }
    }else{
        res.render("comToBotVise", {
            display : "none"
        });
    }
});

router.post("/comToBotVisa", (req, res) => {
    let name = req.body.name.replace(" ", "-");
    res.redirect("/advance/comToBotVise?typeName=" + req.body.typeName + "&name=" + name);
});

router.get("/locFromName", (req, res) => {
    let result = {};
    if(Object.keys(req.query).length !== 0){
        console.log(req.query);
        https.get(req.query.url, (response) => {
            let responseData = "";
          
            response.on("data", (data) => {
                responseData += data;
            });
    
            response.on("end", () => {
                if(responseData.length === 3){
                    res.render("oops");
                }else{
                    result =  JSON.parse(responseData);
                    res.render("location", {result: result});
                }
            });
        });
    }else{
        res.render("location", {result: result});
    }
});

router.post("/locFromName", async (req, res) => {
    let url = "";
    if(req.body.typeName === "common"){
        url = "https://data.winnipeg.ca/resource/hfwk-jp4h.json?common_name=" + req.body.name;
    }else{
        url = "https://data.winnipeg.ca/resource/hfwk-jp4h.json?botanical_name=" + req.body.name;
    }

    res.redirect("/advance/locFromName?url=" + encodeURIComponent(url));
});

router.get("/nearTree", async (req, res) => {
    let result = "";
    if(Object.keys(req.query).length !== 0){
        
    }else{
        res.render("nearTree", result);
    }
});

router.post("/nearTree", (req, res) => {
    res.redirect("/advance/nearTree?common=" + req.body.common + "&lat=" + req.body.lat + "&lng=" + req.body.lng);
});

//google maps api key AIzaSyA8RhpUGeVfmJ3ZAgNkE-IPyD15ZBJRvZs




module.exports = router;


