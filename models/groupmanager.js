(function (module) {
  'use strict';

  var db = require('./db');

  function GroupManager () {}

  var singleton = new GroupManager();

  GroupManager.prototype.getRequests = function (userId, groupName) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');	
    }
    if (typeof groupName !== 'string') {
      return q.reject('groupName = ' + groupName + ' (expected a string)');
    }

    return db.executePreparedStatement({
      name: 'getGroupRequests',
      text: 'select * from get_group_requests($1, $2)',
      values: [ userId, groupName ]
    })
    .then(function (res) {
      return res.rows;
    });
  };

  GroupManager.prototype.getMembers= function (userId, groupName) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');	
    }
    if (typeof groupName !== 'string') {
      return q.reject('groupName = ' + groupName + ' (expected a string)');
    }

    return db.executePreparedStatement({
      name: 'getGroupMembers',
      text: 'select * from get_group_members($1, $2)',
      values: [ userId, groupName ]
    })
    .then(function (res) {
      return res.rows;
    });
  };

  GroupManager.prototype.getNotifications= function (userId, groupName) {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');	
    }
    if (typeof groupName !== 'string') {
      return q.reject('groupName = ' + groupName + ' (expected a string)');
    }

    return db.executePreparedStatement({
      name: 'getGroupNotifications',
      text: 'select * from get_group_notifications($1, $2)',
      values: [ userId, groupName ]
    })
    .then(function (res) {
      return res.rows;
    });
  };

  GroupManager.prototype.invite = function (invitingUserId, groupName, 
                                            invitedUserId) 
  {
    if (typeof invitingUserId !== 'number') {
      return q.reject('invitingUserId = ' + invitingUserId + ' (expected a number)');	
    }
    if (typeof groupName !== 'string') {
      return q.reject('groupName = ' + groupName + ' (expected a string)');
    }
    if (typeof invitedUserId!== 'number') {
      return q.reject('invitedUserId = ' + invitedUserId + ' (expected a number)');	
    }

    return db.executePreparedStatement({
      name: 'invite',
      text: 'select * from group.invite($1, $2, $3)',
      values: [ invitingUserId, groupName, invitedUserId ]
    });
  };

  GroupManager.prototype.kick = function (kickingUserId, groupName, 
                                          kickedUserId) 
  {
    if (typeof kickingUserId !== 'number') {
      return q.reject('kickingUserId = ' + kickingUserId + ' (expected a number)');	
    }
    if (typeof groupName !== 'string') {
      return q.reject('groupName = ' + groupName + ' (expected a string)');
    }
    if (typeof kickedUserId!== 'number') {
      return q.reject('kickedUserId = ' + kickedUserId + ' (expected a number)');	
    }

    return db.executePreparedStatement({
      name: 'kick',
      text: 'select * from group.kick($1, $2, $3)',
      values: [ kickingUserId, groupName, kickedUserId ]
    });

  };

  GroupManager.prototype.setVisibility = function (userId, groupName, 
                                                   visibility) 
  {
    if (typeof userId !== 'number') {
      return q.reject('userId = ' + userId + ' (expected a number)');	
    }
    if (typeof groupName !== 'string') {
      return q.reject('groupName = ' + groupName + ' (expected a string)');
    }
    if (visibility !== 'private' && visibility !== 'public') {
      return q.reject('visibility must be "public" or "private"');
    }

    return db.executePreparedStatement({
      name: 'setVisibility',
      text: 'select * from group.set_visibility($1, $2, $3)',
      values: [ userId, groupName, visibility ]
    });

  };

})();
