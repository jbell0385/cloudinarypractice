require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const exphbs = require("express-handlebars");
const path = require("path");
const nodemailer = require("nodemailer");
const puppeteer = require("puppeteer");
const cloudinary = require("cloudinary");

const app = express();

//View engine setup
app.engine(
  "handlebars",
  exphbs({
    defaultLayout: null
  })
);
app.set("view engine", "handlebars");

//Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Static folder
app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  (async () => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });
    const cloudinary_options = {
      public_id: "test"
    };
    function cloudinaryPromise(shotResult, cloudinary_options) {
      return new Promise(function(res, rej) {
        cloudinary.v2.uploader
          .upload_stream(cloudinary_options, function(
            error,
            cloudinary_result
          ) {
            if (error) {
              console.error("Upload to cloudinary failed: ", error);
              rej(error);
            }
            console.log(cloudinary_result);
            res(cloudinary_result);
          })
          .end(shotResult);
      });
    }
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.goto("https://www.cnn.com");
    let shotResult = await page
      .screenshot({
        fullPage: true
      })
      .then(result => {
        console.log("img result");
        return result;
      })
      .catch(e => {
        console.error(e);
        return false;
      });
    // This step (Step 9): return cloudinaryPromise if screen
    // capture is successful, or else return null
    if (shotResult) {
      await browser.close();
      res.send("done");
      return cloudinaryPromise(shotResult, cloudinary_options);
    } else {
      console.log("no screen shot");
      res.send("didn't work");
      return null;
    }
  })();
});

app.listen(3500, () => {
  console.log("Server started on port 3500");
});
