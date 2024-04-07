const express = require("express");
const ErrorHandler = require("./middleware/error");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require('cors')
const path = require('path')
const swaggerUI = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

const app = express();

// Serve Swagger documentation
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

app.use(express.json());
app.use(cookieParser());
app.use("/",express.static(path.join(__dirname,"./uploads")));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(fileUpload({ useTempFiles: true }));
app.use("/test", (req, res) => {
  res.send("Hello world!");
});


//config
if(process.env.Node_ENV!=="PRODUCTION"){
    require("dotenv").config({
        path: "config/.env",
      });
}

cloudinary.config({ 
  cloud_name: 'dk3mq4dv3', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(cors({
  origin:process.env.CLIENT_URL,
  credentials:true,
})) 

// import routes
const user = require("./controller/user");
const course = require("./controller/course");
const enrollment = require("./controller/enrollment");


app.use("/api/v1/user", user);
app.use("/api/v1/course", course);
app.use("/api/v1/enrollment", enrollment);


app.use(ErrorHandler);

module.exports = app;