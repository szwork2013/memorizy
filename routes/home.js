var home = require('../models/home');
var rk = require('../middlewares/reservedkeywords');
var auth = require('../middlewares/auth');

module.exports = function(app){
	var uri = {
		home : '/:username',
		folder : '/:username/*'
	};
	var views = {
		home : 'home'
	};

	var display = function(req, res){
		home.getFileByPath(req.path).then(function (folder) {
			home.getFolderContentById(req.user.id, 
						  folder.id)
			.then(function(rows){
				res.render(views.home, {
					title : req.path,
					path : req.path,
					user : req.user,
					currentFolder: folder,
					files : rows
				});
			}).catch(function(err){
				console.log(err);
				res.render('index', {
					title: 'Page not found',
					error : err
				});
			})
			.done();
		})
    .catch(function(err){
			console.log(err);	
		})
    .done();
	};

	app.get(uri.home, rk.isNotReservedKeyword, 
		auth.ensureAuthenticated, 
		function (req, res) { display(req, res); }
	);

	app.get(uri.folder, rk.isNotReservedKeyword, 
		auth.ensureAuthenticated, 
		function(req, res){ display(req, res); }
	);
};
