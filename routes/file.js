var fileNavigation = require('../models/filenavigation');
var rk = require('../middlewares/reservedkeywords');
var auth = require('../middlewares/auth');

var URI = '/:username/:subfolder?*';
var VIEWS = {
  FILE_NAVIGATION : 'file-navigation',
  DECK_EDIT : 'deck-edit'
};
var FILE_TYPES = {
  FOLDER : 'folder',
  DECK : 'deck'
};

function displayDeckFlashcards (req, res, deck) {
  fileNavigation.getFileFlashcards(req.user.id, deck.id)
  .then(function (flashcards) {
    res.charset = 'utf-8';
    res.render(VIEWS.DECK_EDIT, {
      title : req.path,
      path : req.path,
      user : req.user,
      deck : deck,
      flashcards : flashcards
    });
  })
  .catch(function (err) {
    console.log(err);
    res.render('index', {
      title: 'Page not found',
      error : err
    });
  })
  .done();
}

function displayFolderContent (req, res, folder) {
  fileNavigation.getFolderContentById(req.user.id, folder.id)
  .then(function(rows){
    res.render(VIEWS.FILE_NAVIGATION, {
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
}

function display (req, res) {
  fileNavigation.getFileByPath(req.path).then(function (file) {
    if (file.type === FILE_TYPES.FOLDER) {
      displayFolderContent(req, res, file);
    }
    else if (file.type === FILE_TYPES.DECK) {
      displayDeckFlashcards(req, res, file);
    }
    else {
      throw new Error('File is not a folder nor a deck');
    }
  })
  .catch(function (err) {
    console.log(err);
    res.render('index', {
      title: 'Page not found',
      error : err
    });
  })
  .done();
}

module.exports = function(app){
	app.get(URI, rk.isNotReservedKeyword, 
		auth.ensureAuthenticated, 
		function (req, res) { display(req, res); }
	);
};
