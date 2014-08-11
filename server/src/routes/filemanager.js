(function (module) {
  'use strict';

  var fileManager = require('../models/filemanager'),
      deckModel = require('../models/deck'),
      auth = require('../middlewares/auth');

  module.exports = function (app) {
    app.get('/api/:username/:subfolders?*', function (req, res, next) {
      if (req.query.action !== 'getFiles') {
        return next();
      }

      // reconvert string to number if it start with a numbe
      var locations = req.query.locations;
      console.log('locations = ', locations);
      //var parsed;
      //if (typeof locations === 'string') {
        //parsed = parseInt(locations, 10);
        //if (parsed) { locations = parsed; } 
      //}
      //else if (Object.prototype.toString.call(locations) === '[object Array]') {
        //for (var i in locations) {
          //if (typeof locations[i] === 'string') {
            //parsed = parseInt(locations[i], 10);
            //if (parsed) { locations[i] = parsed; } 
          //}
        //}
      //}

      fileManager.getFiles(req.user.id, locations).then(function (files) {
        res.json(files);
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
      
      fileManager.getFileTree(req.user.id).then(function (tree) {
        res.json(tree);
      })
      .catch(function (err) {
        console.log(err);
        res.send(404);
      });
    });

    app.put('/api/:username/:subfolders?*', auth.isLoggedIn, function (req, res, next) {
      if (req.query.action !== 'createFile') {
        return next();
      }

      var file = req.body;
      file.path = req.path.slice('/api'.length);
      fileManager.createFile(req.user.id, file).then(function (val) {
        res.json({
          id: val,
          type: file.type,
          name: file.name,
          ownerId: req.user.id
        });
      }).catch(function(err){
        console.log(err);
      }).done();
    });

    app.put('/api/:username/:subfolders?*', auth.isLoggedIn, function (req, res, next) {
      if (req.query.action !== 'toggleVisibility') {
        return next();
      }

      var fileId = req.query.fileId;
      var parsed;
      if (typeof fileId === 'string') {
        parsed = parseInt(fileId , 10);
        if (parsed) { fileId = parsed; } 
      }

      fileManager.toggleVisibility(req.user.id, fileId).then(function () {
        res.send(204);
      }).catch(function(err){
        console.log(err);
        res.send(422);
      }).done();
    });

    app.post('/api/:username/:subfolders?*', auth.isLoggedIn, function (req, res, next) {
      if (req.query.action !== 'moveFile') {
        return next();
      }

      fileManager.moveFile(req.user.id, req.body.src, req.body.dest).then(function () {
        res.send(204);
      })
      .catch(function (err) {
        console.log(err);
        res.send(404);
      });

    });

    app.post('/api/:username/:subfolders?*', auth.isLoggedIn, function (req, res, next) {
      if (req.query.action !== 'copyFile') {
        return next();
      }

      fileManager.copyFile(req.user.id, req.body.src, req.body.dest).then(function (id) {
        res.json({
          fileId: id
        });
      })
      .catch(function (err) {
        console.log(err);
        res.send(404);
      });

    });

    app.post('/api/:username/:subfolders?*', auth.isLoggedIn, function (req, res, next) {
      if (req.query.action !== 'renameFile') { return next(); }

      var newName = req.body.newName;
      var fileId = req.body.fileId;
      
      fileManager.renameFile(req.user.id, fileId, newName).then(function () {
        res.send(204);
      }).catch(function (err) {
        console.log(err);
        res.send(400);
      });
    });

    app.delete('/api/:username/:subfolders?*', auth.isLoggedIn, function (req, res, next) {
      if (req.query.action !== 'deleteFile') {
        return next();
      }
      
      fileManager.deleteFile(req.user.id, parseInt(req.query.fileId)).then(function (val) {
        res.json({
          id: val,
        });
      }).catch(function(err){
        console.log(err);
      }).done();
    });
  };
})(module);
