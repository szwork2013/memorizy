(function () {
  'use strict';

  var util = require('util');
  var register = require('../models/register.js');
  /*
   *register page
   */
  module.exports = function (app) {
    app.post('/register', function (req, res) {
      var user = {
        name : req.body.name,
        password : req.body.password,
        email : req.body.email
      };

      register.createUser(user).then(function(res){
        return register.sendActivationEmail(user.name, 'levasseur.cl@gmail.com', res.hash);
      })
      .then(function () {
        res.send(204);
      })
      .catch(function(err){
        console.log(err);
        res.send(500);
      })
      .done();
    });

    app.get('/register/:hash', function (req, res) {
      register.activateAccount(req.params.hash).then(function () {
        res.send(204); 
      }).catch(function (err) {
        console.log(err);
        res.send(500);
      });
    });
  };

})();
