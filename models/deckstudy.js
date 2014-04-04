var q = require('q');
var db = require('./db');

function DeckStudy () {}

var singleton = new DeckStudy();

DeckStudy.prototype.updateStats = function (userId, stats) {

};

module.exports = singleton;
