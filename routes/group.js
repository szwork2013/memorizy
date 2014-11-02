(function () {
  'use strict';

  var groupManager = require ('../models/groupmanager'),
      auth = require('../middlewares/auth');

  module.exports = function (app) {
    app.get('/api/group/:groupName/:path?*', function (req, res, next) {
      var f; 
      var userId = req.user ? req.user.id : null,
          group = req.params.groupName;


      switch (req.query.action) {
        case 'getRequests'     : f = groupManager.getRequests;      break;
        case 'getMembers'      : f = groupManager.getMembers;       break;
        case 'getNotifications': f = groupManager.getNotifications; break;
        default: return next();
      }

      f(userId, groupName).then(function (results) {
        res.json(results);
      }).catch(function (err) {
        console.log(err);
        res.send(422);
      });
    });

    app.put('/api/group/:groupName/:path?*', auth.isLoggedIn, 
      function (req, res, next) {
        var ret;

        if (req.query.action === 'invite') {
          ret = groupManager.invite(req.user.id, req.query.userId);
        }
        else if (req.query.action === 'kick') {
          ret = groupManager.kick(req.user.id, req.query.userId);
        }
        else if (req.query.action === 'setVisibility') {
          ret = groupManager.setVisibility(req.user.id, req.query.visibility);
        }
        else { return next(); }
        
        ret.then(function () {
          res.send(204);
        }).catch(function (err) {
          console.log(err);
          res.send(422);
        });
      }
    );
  };

})();

