var filenavigation = require('../models/filenavigation');
module.exports = function (socket) {
	socket.on('createFile', function(file){
		filenavigation.createFileWithParentId(
      socket.handshake.user.id, 
      file.filename, 
      file.type, 
      file.parentId
    ).then(function(val){
      console.log('then: ' + val);
			socket.emit('fileCreated', {
				id: val,
				type: file.type,
				name: file.filename,
				ownerId: socket.handshake.user.id
			});
		}).catch(function(err){
			console.log(err);
		}).done();
	});

	socket.on('renameFile', function(data){
    console.log('renameFile ' + data.fileId + ' to \'' + data.newName + '\'');
		filenavigation.renameFile(socket.handshake.user.id, 
                              data.fileId, data.newName)
    .then(function () {
			socket.emit('fileRenamed', {
				fileId : data.fileId,	
				newName : data.newName
			});
		})
		.catch(function(err){
			socket.emit('renameFileError', err.message); /* check err.message */
		})
		.done();
	});

	socket.on('deleteFile', function(file){
		filenavigation.deleteFile(socket.handshake.user.id, file.id)
    .then(function(){
			socket.emit('fileDeleted');
		})
		.catch(function(err){
			console.log(err);
			socket.emit('deleteFileError', {
				fileId: file.id
			});
		}).done();
	});

	socket.on('moveFile', function (data) {
		console.log('Move file ' + data.src + ' under ' + data.dest);
		filenavigation.moveFile(socket.handshake.user.id, data.src, data.dest)
    .then(function () {
			console.log('File ' + data.src + ' has correctly been moved');
			socket.emit('fileMoved');
		})
		.catch(function () {
			console.log('An error occured while moving file ' + data.src +
					        ' under ' + data.dest);
			//-TODO should send an error message
			socket.emit('moveFileError', data); 
		}).done();
	});

	socket.on('copyFile', function (data) {
		console.log('Copy file ' + data.src + ' under ' + data.dest);
		filenavigation.copyFile(socket.handshake.user.id, data.src, data.dest)
    .then(function () {
			console.log('File ' + data.src + ' has correctly been copied');
			socket.emit('fileCopied');
		})
		.catch(function (err) {
			console.log('An error occured while copying file ' + data.src +
					' under ' + data.dest);
			console.log(err);
			//-TODO should send an error message
			socket.emit('copyFileError', data); 
		}).done();
	});

	socket.on('getFileTree', function (data) {
		// data.root is the root folder name
		filenavigation.getFileTree(socket.handshake.user.id, data.root)
    .then( function (tree) {
			socket.emit('fileTree', {
				tree : tree
			});
		})
		.catch(function(err){
			socket.emit('getFileTreeError', {
				message: err.message //check message property
			});
		})
		.done();
	});

	socket.on('star', function (data) {
		filenavigation.star(socket.handshake.user.id, data.fileId)
		.then(function (symlinkId) {
			socket.emit('fileStarred', {
				src : data.fileId,
				dest : symlinkId
			});
		})
		.catch(function (err) {
			socket.emit('fileStarredError', {
				src : data.fileId,
				msg : err.message
			});
		})
		.done();
	});

	socket.on('unstar', function (data) {
		filenavigation.unstar(socket.handshake.user.id, data.fileId)
		.then(function () {
			socket.emit('fileUnstarred', {
				fileId : data.fileId,
			});
		})
		.catch(function (err) {
			socket.emit('fileUnstarredError', {
				fileId : data.fileId,
				msg : err.message
			});
		})
		.done();
	});
};
