var fileManager = require('../models/filemanager.js');

function sendFolderContent (req, res, folder) {
  req.user = { id: 2}; // test code

  fileManager.getFolderContentById(req.user.id, folder.id)
  .then(function(rows){
    folder.type = 'folder';
    folder.files = rows;
    res.json({
      file: folder,
    });
  }).catch(function(err){
    console.log(err);
    res.send(404);
  })
  .done();
}

function sendDeckFlashcards (req, res, deck) {
  fileManager.getFileFlashcards(2, deck.id).then(function (flashcards) {
    deck.flashcards = flashcards;
    deck.type = 'deck';
    res.json({
      file: deck
    });
  }).catch(function (err) {
    console.log(err);
    res.send(404);
  })
  .done();
}

module.exports = function (app) {
  app.get('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'getAll') {
      return next();
    }

    fileManager.getFileByPath(req.path.slice('/api'.length))
    .then(function (file) {
      if (file.type === 'folder') {
        sendFolderContent(req, res, file);
      }
      else if (file.type === 'deck') {
        sendDeckFlashcards(req, res, file);
      }
      else {
        throw new Error('File is not a folder nor a deck');
      }
    })
    .catch(function (err) {
      console.log('unsupported, err = ', err);
    })
    .done();
  });

  app.get('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'getFileTree') {
      return next();
    }
    
    fileManager.getFileTree(2).then(function (tree) {
      res.json(tree);
    })
    .catch(function (err) {
      console.log(err);
      res.send(404);
    });
  });

  app.put('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'createFile') {
      return next();
    }

    var file = req.body;
    file.path = req.path.slice('/api'.length);
		fileManager.createFile(2 /*req.user.id*/, file).then(function (val) {
			res.json({
				id: val,
				type: file.type,
				name: file.name,
				ownerId: 2/*req.user.id*/
			});
		}).catch(function(err){
			console.log(err);
		}).done();
  });

  app.post('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'moveFile') {
      return next();
    }

    fileManager.moveFile(2, req.body.src, req.body.dest).then(function () {
      res.send(204);
    })
    .catch(function (err) {
      console.log(err);
      res.send(404);
    });

  });

  app.post('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'copyFile') {
      return next();
    }

    fileManager.copyFile(2, req.body.src, req.body.dest).then(function (id) {
      console.log('send id ' + id);
      res.json({
        fileId: id
      });
    })
    .catch(function (err) {
      console.log(err);
      res.send(404);
    });

  });

  app.post('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'renameFile') { return next(); }

    var newName = req.body.newName;
    var fileId = req.body.fileId;
    
    fileManager.renameFile(2, fileId, newName).then(function () {
      res.send(204);
    }).catch(function (err) {
      console.log(err);
      res.send(400);
    });
  });

  app.delete('/api/:username/:subfolders?*', function (req, res, next) {
    if (req.query.action !== 'deleteFile') {
      return next();
    }
    
    console.log('delete file ' + req.query.fileId);
		fileManager.deleteFile(/*req.user.id*/2, parseInt(req.query.fileId)).then(function (val) {
			res.json({
				id: val,
			});
		}).catch(function(err){
			console.log(err);
		}).done();
  });
};
