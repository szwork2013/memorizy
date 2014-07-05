var jwt = require('jsonwebtoken');
var passport = require('passport');

var userModel = require('../models/user.js');

module.exports = function(app){
	app.post('/login', function (req, res) {
    var user;

    userModel.authenticateUser(req.body.username, req.body.password).
      then(function (row) {
        user = row; 

        if (user.enabled === false) {
          res.send(401, 'The account is not activated');
          return;
        }

        // We are sending the profile inside the token
        var token = jwt.sign(user, 'hello world !', { expiresInMinutes: 259200 /* 6 months */ });
        res.json({ user: user, token: token });
      }). 
      catch(function (err) {
        res.send(401, 'Wrong user or password');
      })
      .done();
	});
};
