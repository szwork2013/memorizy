var passport = require('passport');

module.exports = function(app){
	app.get('/login', function(req, res){
		res.render('login', {
			title : 'Login - Study'
		});
	});

	app.post('/login', passport.authenticate('local', {
		successReturnToOrRedirect: '/',
		failureRedirect: '/login' 
	}));

	app.get('/logout', function(req, res){
	  	req.logout();
		res.redirect('/');
	});
};
