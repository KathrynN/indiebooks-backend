var express = require("express");
const axios = require('axios');
var parser = require('xml2json');
var cors = require('cors');

require('dotenv').config();


var app = express();
app.use(cors());
app.listen(3001, () => {
 console.log("Server running on port 3001");
});
app.get("/getbookinfo", (req, res, next) => {
  axios.get("https://www.goodreads.com/book/show?key=" + process.env.REACT_APP_GOODREADS
  + "&id=" + req.query.grid).then(
    result => {
      var json = parser.toJson(result.data);
      res.json(json);
    },
    error => {
      console.log(error);
      res.json(["Something appears to have gone wrong"]);
    }
  )
});
