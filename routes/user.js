(function () {
  'use strict';

  var userModel = require('../models/user'),
      auth = require('../middlewares/auth'),
      log = require('npmlog');

  module.exports = function (app) {
    app.get('/api/account/profile', auth.isLoggedIn, function (req, res, next) {
      userModel.getUserById(userModel.getUserId(req)).then(function (user) {
        res.json(user); 
      }).catch(function (err) {
        console.log(err);
        res.send(422);        
      });
    });

    app.put('/api/account/profile', auth.isLoggedIn, function (req, res, next) {
      userModel.updateProfile(userModel.getUserId(req), req.body)
      .then(function () {
        res.send(204);
      }).catch(next);
    });

    app.post('/api/account/password', auth.isLoggedIn, function (req, res, next) {
      userModel.updatePassword(userModel.getUserId(req), req.body.oldPassword,
        req.body.newPassword, req.body.newPasswordConfirm).then(function () {
          res.send(204);
        }).catch(function (err) {
          console.log(err);
          res.send(422);
        });
    });
  };

})();
