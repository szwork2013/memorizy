var fs = require('fs');

// TODO: Allow to see only your images
module.exports = function(app){
  app.get(/^\/media\/(.*)/, function(req, res) {
    var filename = req.params[0];
    console.log(filename);
    var img = fs.readFileSync('uploads/media/' + filename);
    res.writeHead(200, {'Content-Type': 'image/jpg' });
    res.end(img, 'binary');
  });
};
