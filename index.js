var express = require("express");
const axios = require('axios');
var parser = require('xml2json');
var cors = require('cors');
var fs = require('fs');
var async = require('async');
var _ = require('underscore');
var bodyParser = require('body-parser');
require('dotenv').config();


var app = express();
app.use(cors());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.listen(3001, () => {
 console.log("Server running on port 3001");
});

app.get("/getbookinfo", (req, res, next) => {
  getInfoFromGoodreads(req.query.grid, res.json)
});

app.get("/getallbooks", (req, res, next) => {
  var allBooks = JSON.parse(fs.readFileSync('allBooks.json', 'utf8')).books;
  allBooks = _.shuffle(allBooks);
  getInfoForAllBooksFromGoodreads(allBooks, res);
})

app.post('/addbook', function(req, res) {
    var book_id = req.body.bookId;
    console.log("received request to include " + book_id)
    // TODO include book id xD
    res.send(book_id);
});

function getInfoForAllBooksFromGoodreads(allBooks, res) {
  const responses = [];

  var promises = allBooks.map((grid) => {
    return new Promise(function(resolve, reject) {
      getInfoFromGoodreads(grid, bookResult => {
        responses.push(bookResult)
        resolve();
      })

    })
  });

  Promise.all(promises)
    .then(result => {
      res.json({}.books = responses);
      console.log("serviced all book request");
    })
    .catch(console.error)
}

function getInfoFromGoodreads(grid, lamda) {
  axios.get("https://www.goodreads.com/book/show?key=" + process.env.REACT_APP_GOODREADS
  + "&id=" + grid).then(
    result => {
      var json = parser.toJson(result.data);
      lamda(json);
    },
    error => {
      console.log("ERROR", error);
      lamda(["Something appears to have gone wrong"]);
    }
  )
}
