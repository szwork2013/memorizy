var q = require('q');
var db = require('./db');

function DeckStudy () {}

var singleton = new DeckStudy();

DeckStudy.prototype.updateStats = function (userId, stats) {

};

DeckStudy.prototype.updateFlashcardOrder = function (userId, fileId, orderId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof fileId !== 'number') {
    return q.reject('fileId = ' + fileId + ' (expected a number)');	
  }
  if (typeof orderId !== 'number') {
    return q.reject('orderId = ' + orderId + ' (expected a number)');	
  }

  return db.executePreparedStatement({
    name : 'updateFlashcardOrder',
    text : 'select update_flashcard_order($1::INTEGER, $2::INTEGER, $3::INTEGER)',
    values : [userId, fileId, orderId]
  });
};

DeckStudy.prototype.updateShowFirst = function (userId, fileId, side) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof fileId !== 'number') {
    return q.reject('fileId = ' + fileId + ' (expected a number)');	
  }
  if (typeof side !== 'string') {
    return q.reject('side = ' + side + ' (expected a string)');	
  }

  return db.executePreparedStatement({
    name : 'updateShowFirst',
    text : 'select update_show_first($1::INTEGER, $2::INTEGER, $3::TEXT)',
    values : [userId, fileId, side]
  });
};

module.exports = singleton;
