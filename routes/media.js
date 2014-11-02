(function () {
  'use strict';

  var fs = require('fs'),
      path = require('path'),
      formidable = require('formidable'),
      mediaModel = require('../models/media');

  // TODO: Allow to see only your images
  module.exports = function(app){
    app.get('/media/:filename', function(req, res) {
      var filename = req.params.filename;
      var img = fs.readFileSync(path.join(app.get('uploadDir'), filename));
      res.writeHead(200, {'Content-Type': 'image/jpg' });
      res.end(img, 'binary');
    });

    app.post('/upload', function(req, res) {
      var form = new formidable.IncomingForm();
      form.uploadDir = app.get('uploadDir');

      form.on('progress', function(bytesReceived, bytesExpected) {
        console.log(bytesReceived + '/' + bytesExpected);
      });

      form.on('error', function(err) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('error:\n\n'+util.inspect(err));
      });

      form.parse(req, function(err, fields, files){
        if (err) return res.end('You found error');
        var path = files.file.path.split('/'),
            filename = path[path.length - 1];

        mediaModel.insert(req.user.id, filename, files.file.name)
        .then(function () {
          res.end(filename);
        })
        .catch(function (err) {
          console.log(err);
          res.end(500);
        });
      });
    });
  };
})();
