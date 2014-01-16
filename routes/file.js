var filenavigation = require('../models/filenavigation');
var rk = require('../middlewares/reservedkeywords');
var auth = require('../middlewares/auth');

module.exports = function(app){
	var uri = {
		filenavigation : '/:username',
		folder : '/:username/*'
	};
	var views = {
		filenavigation : 'filenavigation'
	};

	var display = function(req, res){
		filenavigation.getFileByPath(req.path).then(function (folder) {
			filenavigation.getFolderContentById(req.user.id, 
						  folder.id)
			.then(function(rows){
				res.render(views.filenavigation, {
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

	app.get(uri.filenavigation, rk.isNotReservedKeyword, 
		auth.ensureAuthenticated, 
		function (req, res) { display(req, res); }
	);

	app.get(uri.folder, rk.isNotReservedKeyword, 
		auth.ensureAuthenticated, 
		function(req, res){ display(req, res); }
	);
};
