var q = require('q');
var db = require('./db');

function DeckStudy () {}

var singleton = new DeckStudy();

DeckStudy.prototype.updateStats = function (userId, stats) {

};

DeckStudy.prototype.updateStudyOrder = function (userId, fileId, orderId) {
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
    name : 'updateStudyOrder',
    text : 'select update_study_order($1::INTEGER, $2::INTEGER, $3::INTEGER)',
    values : [userId, fileId, orderId]
  });
};

module.exports = singleton;
