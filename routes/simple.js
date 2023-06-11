const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bodyParser = require("body-parser");
const https = require("https");
// const { type, render } = require("express/lib/response");


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

router.get("/allTrees", async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT * FROM CommonName`;
        res.render("allTrees", {result : result});
    } catch (err) {
        console.log(err);
    }
});


//Have to work on it....
// router.get("/top5/parks", async (req, res) => {
//     try {
//         await sql.connect(config);
//         const result = await sql.query`WITH ParkCount as (SELECT Tree.park, count(Tree.treeId) as NoOfTree FROM Tree INNER JOIN Neighbourhood ON Tree.park = Neighbourhood.park AND Tree.street = Neighbourhood.street AND Tree.streetFrom = Neighbourhood.streetFrom AND Tree.streetTo = Neighbourhood.streetTo WHERE Tree.park <> 'Not In Park' GROUP BY Tree.park) SELECT TOP 5 park FROM ParkCount ORDER BY NoOfTree DESC`;
//         res.send(result);
//         // res.render("top5", {
//         //     result : result,
//         //     left : "Park Name = ",
//         //     right : "Number of Trees = "
//         // });
//     } catch (err) {
//         console.log(err);
//     }
// });

router.get("/top5/streets", async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`SELECT TOP 5 Street.street, COUNT(Tree.treeId) AS NoOfTrees FROM Tree INNER JOIN Street ON Tree.street = Street.street GROUP BY Street.street ORDER BY NoOfTrees DESC`;
        // res.send(result);
        res.render("top5", {
            result : result,
            left : "Street Name = ",
            right : "Number of Trees = ",
            leftKey : "street",
            rightKey : "NoOfTrees"
        });
    } catch (err) {
        console.log(err);
    }
});

router.get("/top5/speices", async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query`WITH speciesNumber as (SELECT Tree.botanical, CommonName.common, count(treeId) as total FROM Tree INNER JOIN CommonName ON Tree.botanical = CommonName.botanical GROUP BY Tree.botanical, CommonName.common) SELECT TOP 5 botanical, common FROM speciesNumber ORDER BY total DESC`;
        // res.send(result);
        res.render("top5", {
            result : result,
            left : "Botanical Name = ",
            right : "Common Name = ",
            leftKey : "botanical",
            rightKey : "common"
        });
    } catch (err) {
        console.log(err);
    }
});

//Have to work on it....
// router.get("/top5/neighMostTree", async (req, res) => {
//     try {
//         await sql.connect(config);
//         const result = await sql.query`WITH neighborTree as (SELECT neighbor, count(Tree.treeId) as total FROM Neighbourhood INNER JOIN Tree ON Neighbourhood.park = Tree.park AND Neighbourhood.street = Tree.street AND Neighbourhood.streetFrom = Tree.streetFrom AND Neighbourhood.streetTo = Tree.streetTo GROUP BY neighbor) SELECT TOP 5 neighbor FROM neighborTree ORDER BY total DESC`;
//         // res.send(result);
//         res.render("top5", {
//             result : result,
//             left : "Street Name = ",
//             right : "Number of Trees = ",
//             leftKey : "street",
//             rightKey : "NoOfTrees"
//         });
//     } catch (err) {
//         console.log(err);
//     }
// });

// router.get("/top5/elecMostTree", async (req, res) => {
//     try {
//         await sql.connect(config);
//         const result = await sql.query`WITH elecTree as (SELECT elecWard, count(Tree.treeId) as total FROM Neighbourhood INNER JOIN Tree ON Neighbourhood.park = Tree.park AND Neighbourhood.street = Tree.street AND Neighbourhood.streetFrom = Tree.streetFrom AND Neighbourhood.streetTo = Tree.streetTo INNER JOIN Ward ON Neighbourhood.neighbor = Ward.neighbor GROUP BY elecWard ) SELECT TOP 5 elecWard FROM elecTree ORDER BY total DESC`;
//         // res.send(result);
//         res.render("top5", {
//             result : result,
//             left : "Botanical Name = ",
//             right : "Common Name = ",
//             leftKey : "botanical",
//             rightKey : "common"
//         });
//     } catch (err) {
//         console.log(err);
//     }
// });

router.get("/searchByName", async (req, res) => {
    res.render("searchByName");
});

router.post("/searchByName", async (req, res) => {
    try {
        await sql.connect(config);
        const result = await sql.query(`SELECT (${req.body.typeName}) from CommonName where (${req.body.typeName}) LIKE '%' + '${req.body.letter}' + '%'`);
        if(result.recordset.length === 0){
            res.render("oops");
        }
        res.render("searchByNameResult", {
            typeName : req.body.typeName,
            letter : req.body.letter,
            result : result
        });
    } catch (err) {
        console.log(err);
    }
});



module.exports = router;


// dzj438gav6mx5g5pr5p29xzxi


//Secret
// 3u9h9vubn58wmhu8fe9m8tefskr6woqys0t3r6dcniczhujq32

