var util = require('util');
var register = require('../models/register.js');
/*
 *register page
 */
module.exports = function(app){
	var title = 'Register';
	var uri = {
		register : '/register'
	};
	var views = {
		register : 'register',
		registerSuccess : 'registerSuccess'
	};


	app.get(uri.register, function(req, res){
		var props = {
			title : title,
			username : req.body.username
		};

		res.render(views.register, props);
	});

	app.post(uri.register, function(req, res){
		var props = {
			username : req.body.username,
			password : req.body.password,
			email : req.body.email
		};

		register.createUser(props, function(err, results){
			if (err) {
				props.err = err;
				res.render(views.register, props);
			}
			else {
				console.log(util.inspect(results));
				res.render(views.registerSuccess, props);
			}
		});
	});
}

