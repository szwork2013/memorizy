
/*
 * GET home page.
 */

module.exports = function(app){
	var display = function(req, res, next){
  		res.render('index', { title: 'Study' });
	};

	app.get('/', display);
	app.get('/index', display);
};
