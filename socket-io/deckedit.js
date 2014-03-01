var fs = require('fs');
var exec = require('child_process').exec;
var util = require('util');
var deckEdit = require('../models/deckedit');

module.exports = function (socket) {
  socket.on('saveFlashcard', function (flashcard) {
    deckEdit.saveFlashcard(socket.handshake.user.id, flashcard)
    .then(function (flashcardId) {
      socket.emit('flashcardSaved', {
        localId: flashcard.localId, 
        id     : flashcardId
      });
    })
    .catch(function (err) {
      console.log(err);
      socket.emit('saveFlashcardError', flashcard);
    })
    .done();
  });

  socket.on('moveFlashcard', function (data) {
    deckEdit.moveFlashcard(socket.handshake.user.id, 
                           data.flashcardId,
                           data.beforeId)
    .then(function () {
      socket.emit('flashcardMoved', data);
    })
    .catch(function () {
      socket.emit('moveFlashcardError', data);
    })
    .done();
  });

  socket.on('deleteFlashcard', function (flashcard) {
    deckEdit.deleteFlashcard(socket.handshake.user.id, flashcard.id)
    .then(function () {
      socket.emit('flashcardDeleted', flashcard);
    })
    .catch(function (err) {
      console.log(err);
      socket.emit('deleteFlashcardError', flashcard);
    })
    .done();
  });

  /*
   * File upload
   */

  var uploader = require('socketio-uploader');
  uploader.listen(socket);


/*
 *  var files = {};
 *
 *  socket.on('start', function (data) { 
 *    var name = data.name;
 *    files[name] = {  //Create a new Entry in The Files Variable
 *      fileSize : data.size,
 *      data     : '',
 *      downloaded : 0
 *    };
 *    var place = 0;
 *    fs.open('uploads/tmp/' + name, [>'a'<] 'w', 0755, function (err, fd) {
 *      if (err) {
 *        console.log(err);
 *      }
 *      else {
 *        //We store the file handler so we can write to it later
 *        files[name].handler = fd; 
 *        socket.emit('moreData', {'place' : place, percent : 0});
 *      }
 *    });
 *  });
 *
 *  socket.on('upload-img', function (data) {
 *    var name = data.name;
 *    files[name].downloaded += data.data.length;
 *    files[name].data += data.data;
 *    //If File is Fully Uploaded
 *    if (files[name].downloaded === files[name].fileSize) { 
 *      fs.write(files[name].handler, files[name].data, null, 'binary', 
 *               function(err, written){
 *                 deckEdit.createMediaLink('uploads/tmp/' + name)
 *                 .then(function (id) {
 *                   console.log('id = ' + id);
 *                   var filename = 'uploads/media/' + id;
 *
 *                   //Get Thumbnail Here
 *                   var inp = fs.createReadStream('uploads/tmp/' + name);
 *                   var out = fs.createWriteStream(filename);
 *                   inp.pipe(out);
 *                   inp.on('close', function() {
 *                     //This Deletes The Temporary File
 *                     fs.unlink('uploads/tmp/' + name, function () { 
 *                       //Moving File Completed
 *                       console.log('file ' + name + ' removed from tmp');
 *                     });
 *
 *                   });
 *                   socket.emit('done', {
 *                     id: id,
 *                     uri: '/media/' + id,
 *                     type: 1 
 *                   });
 *                 })
 *                 .catch (function (err) {
 *                   throw err;
 *                 })
 *                 .done();
 *               });
 *    }
 *    //If the Data Buffer reaches 10MB
 *    else if (files[name].data.length > 10485760){ 
 *      fs.write(files[name].handler, files[name].data, null, 
 *               'binary', function(err, written){
 *                 files[name].data = ''; //Reset The Buffer
 *                 var place = files[name].downloaded / 524288;
 *                 var percent = 
 *                   (files[name].downloaded / files[name].fileSize) * 100;
 *                 socket.emit('moreData', {'place': place, 'percent': percent});
 *               });
 *    }
 *    else {
 *      var place = files[name].downloaded / 524288;
 *      var percent = (files[name].downloaded / files[name].fileSize) * 100;
 *      socket.emit('moreData', {'place': place, 'percent': percent});
 *    }
 *  });
 */

};

