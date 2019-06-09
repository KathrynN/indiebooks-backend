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
    addBook(book_id);
    res.send(book_id);
});

function addBook(bookId) {
  getInfoFromGoodreads(bookId, (data) => {
    data = JSON.parse(data);
    const book = data.GoodreadsResponse.book;
    if (mightBeTradPublished(book)) {
      console.log("Might be indie? listed publisher for ", book.title, " is ", book.publisher)
      const suggestionsObject = JSON.parse(fs.readFileSync('suggestions.json', 'utf8'));
      suggestionsObject.suggestions.push({
        "title": book.title,
        "authors": book.authors,
        "id": book.id,
        "publisher": book.publisher
      })
      fs.writeFileSync('suggestions.json', JSON.stringify(suggestionsObject, null, 2), 'utf-8');
    } else {
        console.log("Is indie ", book.title)
        appendToFile(book.id);
    }
  })
}

function appendToFile(bookId) {
  const allBooksObject = JSON.parse(fs.readFileSync('allBooks.json', 'utf8'));
  const allBooks = allBooksObject.books;
  bookId = parseInt(bookId)
  if (! allBooks.includes(bookId)) {
    allBooksObject.books.push(bookId)
    fs.writeFileSync('allBooks.json', JSON.stringify(allBooksObject, null, 2), 'utf-8');
    console.log("adding", bookId)
  } else {
    console.log(bookId, "already found in file")
  }
}

function mightBeTradPublished(book) {
  return book.publisher && !_.isEmpty(book.publisher) && book.publisher !== "Independently Published"
}

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
