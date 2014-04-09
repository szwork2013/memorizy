var jwt = require('jsonwebtoken');
var passport = require('passport');

module.exports = function(app){
	app.post('/login', function (req, res) {
    //TODO validate req.body.username and req.body.password
    //if is invalid, return 401
    
    console.log('req.body = ', req.body);

    if (!(req.body.username === 'john.doe' && req.body.password === 'foobar')) {
      res.send(401, 'Wrong user or password');
      return;
    }

    var profile = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@doe.com',
      id: 123
    };

    // We are sending the profile inside the token
    var token = jwt.sign(profile, 'hello world !', { expiresInMinutes: 60*5 });

    res.json({ user: profile, token: token });
	});

	app.get('/logout', function(req, res){
    req.logout();
		res.redirect('/');
	});
};
