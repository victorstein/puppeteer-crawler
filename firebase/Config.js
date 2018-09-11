firebase = require('firebase/app');
require("firebase/database");

var config = {
  apiKey: "AIzaSyCKndmhu3Qfr3TbrcKTGM-Fr8vJJKqK7Eg",
  authDomain: "tfmcrawler.firebaseapp.com",
  databaseURL: "https://tfmcrawler.firebaseio.com",
  projectId: "tfmcrawler",
  storageBucket: "tfmcrawler.appspot.com",
  messagingSenderId: "250441846130"
};

const Firebase = firebase.initializeApp(config);

module.exports = { Firebase }
