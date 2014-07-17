(function () {
  'use strict';

  var db = require ('./db');

  function MediaModel () {}

  MediaModel.prototype.insert = function (userId, mediaId, mediaName) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');
    }
    if (typeof mediaId !== 'string') {
      return q.reject('mediaId = ' + mediaId + ' (expected a string)');
    }
    if (typeof mediaName !== 'string') {
      return q.reject('mediaName = ' + mediaName + ' (expected a string)');
    }

    return db.executePreparedStatement({
      name: 'insertMedia',
      text: 'insert into images (id, user_id, name) ' +
            'values ($1, $2, $3)',
      values: [
        mediaId,
        userId,
        mediaName
      ]
    });
  };

  var singleton = new MediaModel();
  module.exports = singleton;
})();
