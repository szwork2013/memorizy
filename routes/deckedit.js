var deckEdit = require('../models/deckedit');
var rk = require('../middlewares/reservedkeywords');
var auth = require('../middlewares/auth');

var uri = {
  DECK_EDIT: '/:username/*'
};

var views = {
  DECK_EDIT: 'deck-edit'
};

//module.exports = function (app) {
  //app.get(
    //uri.DECK_EDIT, 
    //rk.isNotReservedKeyword,
    //auth.ensureAuthenticated,
    //function (req, res) {
      //deckEdit.getFlashcardsWithFilePath(req.user.id, req.path)
      //.then(function (flashcards) {
        //console.log('rendering deck editing page');
        //res.render(
          //views.DECK_EDIT,
          //{
            //title: req.path,
            //path: req.path,
            //user: req.user
            ////flashcards: flashcards
          //}
        //);
      //})
      //.catch(function (err) {
				//console.log(err);
				//res.render('index', {
					//title: 'Page not found',
					//error : err
				//});
      //})
      //.done();
    //}
  //);
//};
