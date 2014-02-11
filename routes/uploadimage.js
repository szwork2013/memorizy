// Include the node file module
var fs = require('fs');

// Post files
app.post('/upload-image', function(req, res) {
  fs.readFile(req.files.image.path, function (err, data) {
    var imageName = req.files.image.name;
    
    // If there's an error
    if(!imageName){
      console.log('There was an error');
      res.redirect('/');
      res.end();
    } else {
      var newPath = __dirname + '/uploads/fullsize/' + 
        req.user.id + '/' + imageName;
      
      // write file to uploads/fullsize folder
      fs.writeFile(newPath, data, function (err) {
        // let's see it
        res.redirect('/uploads/fullsize/' + req.user.id + '/' + imageName);
      });
    }
  });
});
