const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bodyParser = require("body-parser");
const https = require("https");
const http = require("http");
const { response } = require("express");
const { send } = require("process");
const { join } = require("path");
const IP = require('ip');

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
    let locationArray = [];
    if(Object.keys(req.query).length !== 0){
        https.get(req.query.url, (response) => {
            let responseData = "";
          
            response.on("data", (data) => {
                responseData += data;
            });
    
            response.on("end", () => {
                if(responseData.length === 3){
                    res.render("oops");
                }else{
                    let point = {
                        lat: req.query.lat,
                        lng: req.query.lng
                    }
                    result =  JSON.parse(responseData);

                    for(let i = 0; i < result.length; i++){
                        locationArray.push({
                            lat: parseFloat(result[i].location.latitude),
                            lng: parseFloat(result[i].location.longitude)
                        });
                    }

                    function distance(mk1, mk2){
                        var R = 3958.8; // Radius of the Earth in miles
                        var rlat1 = mk1.lat * (Math.PI/180); // Convert degrees to radians
                        var rlat2 = mk2.lat * (Math.PI/180); // Convert degrees to radians
                        var difflat = rlat2-rlat1; // Radian difference (latitudes)
                        var difflon = (mk2.lng-mk1.lng) * (Math.PI/180); // Radian difference (longitudes)
                  
                        var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
                        return d;
                    }

                    locationArray.sort((loc1, loc2) => {
                        let dist1 = distance(loc1, point);
                        let dist2 = distance(loc2, point);

                        if(dist1 < dist2) return -1;
                        else if(dist1 > dist2) return 1;
                        else return 0;
                    });

                    res.render("nearTree", {
                        locationArray: locationArray,
                        myLat: req.query.lat,
                        myLng: req.query.lng
                    });
                }
            });
        });
    }else{
        res.render("nearTree", {
            locationArray: locationArray,
            myLat: req.query.lat,
            myLng: req.query.lng
        });
    }
});

router.post("/nearTree", (req, res) => {
    let url = "";
    if(req.body.typeName === "common"){
        url = "https://data.winnipeg.ca/resource/hfwk-jp4h.json?common_name=" + req.body.name;
    }else{
        url = "https://data.winnipeg.ca/resource/hfwk-jp4h.json?botanical_name=" + req.body.name;
    }

    res.redirect("/advance/nearTree?url=" + encodeURIComponent(url) + "&lat=" + req.body.lat + "&lng=" + req.body.lng);
});

router.post("/nearYou", (req, res) => {
    let url = "";
    if(req.body.typeName === "common"){
        url = "https://data.winnipeg.ca/resource/hfwk-jp4h.json?common_name=" + req.body.name;
    }else{
        url = "https://data.winnipeg.ca/resource/hfwk-jp4h.json?botanical_name=" + req.body.name;
    }

    const ipAddress = IP.address();
    const URL = "http://ip-api.com/json/";

    http.get(URL, (response) => {
        response.on("data", (data) => {
            const geoLocation  =JSON.parse(data);
            res.redirect("/advance/nearYou?url=" + encodeURIComponent(url) + "&lat=" + geoLocation.lat + "&lng=" + geoLocation.lon);
        });
    });
});

router.get("/nearYou", (req, res) =>{
    let locationArray = [];
    if(Object.keys(req.query).length !== 0){
        https.get(req.query.url, (response) => {
            let responseData = "";
          
            response.on("data", (data) => {
                responseData += data;
            });
    
            response.on("end", () => {
                if(responseData.length === 3){
                    res.render("oops");
                }else{
                    let point = {
                        lat: req.query.lat,
                        lng: req.query.lng
                    }
                    result =  JSON.parse(responseData);

                    for(let i = 0; i < result.length; i++){
                        locationArray.push({
                            lat: parseFloat(result[i].location.latitude),
                            lng: parseFloat(result[i].location.longitude)
                        });
                    }

                    function distance(mk1, mk2){
                        var R = 3958.8; // Radius of the Earth in miles
                        var rlat1 = mk1.lat * (Math.PI/180); // Convert degrees to radians
                        var rlat2 = mk2.lat * (Math.PI/180); // Convert degrees to radians
                        var difflat = rlat2-rlat1; // Radian difference (latitudes)
                        var difflon = (mk2.lng-mk1.lng) * (Math.PI/180); // Radian difference (longitudes)
                  
                        var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
                        return d;
                    }

                    locationArray.sort((loc1, loc2) => {
                        let dist1 = distance(loc1, point);
                        let dist2 = distance(loc2, point);

                        if(dist1 < dist2) return -1;
                        else if(dist1 > dist2) return 1;
                        else return 0;
                    });

                    res.render("nearYouTree", {
                        locationArray: locationArray,
                        myLat: req.query.lat,
                        myLng: req.query.lng
                    });
                }
            });
        });
    }else{
        res.render("nearYouTree", {
            locationArray: locationArray,
            myLat: req.query.lat,
            myLng: req.query.lng
        });
    }
});

//google maps api key AIzaSyA8RhpUGeVfmJ3ZAgNkE-IPyD15ZBJRvZs




module.exports = router;


