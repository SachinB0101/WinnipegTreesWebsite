const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const https = require("https");

const simpleRoute = require("./routes/simple");
const advanceRoute = require("./routes/advance");

const PORT = process.env.PORT | 8000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use("/simple", simpleRoute);
app.use("/advance", advanceRoute);

app.set("view engine", "ejs");


app.get("/", (req, res) => {
    const url = "https://api.openweathermap.org/data/2.5/weather?q=Winnipeg,Manitoba&units=metric&appid=9686e561f8ca485bf6fe258a737085af";

    https.get(url, (response) => {
        response.on("data", (data) => {
            const weatherData =  JSON.parse(data);
            const icon = weatherData.weather[0].icon;
            const imageUrl = "https://openweathermap.org/img/wn/" + icon +  "@2x.png";
            res.render("home", {
                temp : weatherData.main.temp, 
                weatherDescription : weatherData.weather[0].description,
                icon : icon,
                imageUrl : imageUrl
            });
        });
    });
});


app.listen(PORT, () => {
    console.log(`Server started on ${PORT}....`);
});