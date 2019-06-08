var express = require("express");
const axios = require('axios');
var parser = require('xml2json');
var cors = require('cors');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');

require('dotenv').config();


var app = express();
app.use(cors());
app.listen(3001, () => {
 console.log("Server running on port 3001");
});
app.get("/getbookinfo", (req, res, next) => {
  getInfoFromGoodreads(req.query.grid, res.json)
});

app.get("/getallbooks", (req, res, next) => {
  var allBooks = JSON.parse(fs.readFileSync('allBooks.json', 'utf8'));
  const responses = [];

  var promises = allBooks.books.map((grid) => {
    return new Promise(function(resolve, reject) {
      axios.get("https://www.goodreads.com/book/show?key=" + process.env.REACT_APP_GOODREADS
      + "&id=" + grid).then(result => {
        responses.push(parser.toJson(result.data))
        resolve();
        }
      )
    })
  })

  // if so - can we refactor to use the old method, where the resolve() occurs in the passed in lambda

  Promise.all(promises)
  .then(result => res.json({}.books = responses))
  .catch(console.error)

})

function getInfoFromGoodreads(grid, lamda) {
  axios.get("https://www.goodreads.com/book/show?key=" + process.env.REACT_APP_GOODREADS
  + "&id=" + grid).then(
    result => {
      var json = parser.toJson(result.data);
      console.log("WORKING:", json)
      lamda(json);
    },
    error => {
      console.log("ERROR", error);
      //res.status(error.response.status || 404)
      lamda(["Something appears to have gone wrong"]);
    }
  )
}
