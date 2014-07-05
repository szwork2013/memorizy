(function () {
  'use strict';

  var fs = require('fs');

  // TODO: Allow to see only your images
  module.exports = function(app){
    app.get('/upload', function(req, res) {
      var filename = req.params[0];
      var img = fs.readFileSync('uploads/' + filename);
      res.writeHead(200, {'Content-Type': 'image/jpg' });
      res.end(img, 'binary');
    });

    app.post('/upload', function(req, res) {
    });
  };
})();
