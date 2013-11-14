var q = require('q');
var db = require('./db');

function home(){}

var singleton = new home(); 

home.prototype.getFolderContentById = function(userId, folderId){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof folderId != 'number'){
		return q.reject('folderId = ' + folderId + ' (expected a number)');	
	}
	
	return db.executePreparedStatement({
		name : 'getFolderContentById',
		text : 'select * from get_folder_content($1::INTEGER, $2::INTEGER) as ' +
			'(id integer, owner_id integer, name_display text, name text, n_cards integer, type_id integer, percentage integer)',
		values : [ userId, folderId ]
	}).then(function(results){
		return results.rows;	
	}).catch(function(err){
		return err;
	});
};

home.prototype.getFolderContentByPath = function(userId, path){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	/*
	 *path should be a string corresponding to the path section
	 *of the url ('/test/a/b' in 'www.example.com/test/a/b')
	 */
	if (typeof path != 'string') {
		throw new Error('path must be a string');
	}
	
	path = getArrayablePGPath(path);

	return db.executePreparedStatement({
		name : 'getFolderContentByPath',
		text : 'select * from get_folder_content($1::INTEGER, string_to_array($2, \'/\')) as ' +
			'(id integer, owner_id integer, name_display text, name text, n_cards integer, type_id integer, percentage integer)',
		values : [ userId, path ]
	}).then(function(results){
		return results.rows;	
	});
};

home.prototype.getArrayablePGPath = function(path){
	path = path.replace(/\/{2,}/, '/');
	var firstChar = path.charAt(0),
	    lastChar = path.charAt(path.length - 1);

	if (firstChar == '/' && lastChar == '/' ) {
		path = path.substring(1, path.length - 1);
	}
	else if(firstChar == '/'){
		path = path.substring(1);
	}
	else if(lastChar == '/'){
		path = path.substring(0, path.length - 1);
	}
};

home.prototype.createFileWithPath = function(userId, filename, type, path){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if (typeof filename != 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof type != 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof path != 'string') {
		return q.reject('path = ' + path + ' (expected a string)');	
	}
	
	path = getArrayablePGPath(path);
	return db.executePreparedStatement({
		name: 'createFileWithPath',
		text: 'select create_file($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::INTEGER, string_to_array($5, \'/\'))',
		values: [ userId, filename, filename, type, db.stringToPGPath(path)]
	}).then(function(result){
		return result.value.row[0].id;	
	});
};

home.prototype.createFileWithParentId = function(userId, filename, type, parentId){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if (typeof filename != 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof type != 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof parentId != 'number') {
		return q.reject('parentId = ' + parentId + ' (expected a string)');	
	}
	
	path = getArrayablePGPath(path);
	return db.executePreparedStatement({
		name: 'createFileWithParendId',
		text: 'select create_file($1::INTEGER, $2::INTEGER, $3::INTEGER, $4::INTEGER, $5::INTEGER)',
		values: [ userId, filename, filename, type, parentId]
	}).then(function(result){
		return result.value.row[0].id;	
	});
};

home.prototype.renameFile = function(userId, fileId, newName){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof fileId != 'number'){
		return q.reject('fileId must be a number');
	}
	if(typeof newName != 'string'){
		return q.reject('fileId must be a number');
	}

	return db.executePreparedStatement({
		name: 'renameFile',
		text: 'select rename_file($1, $2, $3)',
		values: [ userId, fileId, newName ]
	}).then(function(result){
		/* TODO */
	});
};

home.prototype.deleteFile = function(userId, fileId){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof fileId != 'number'){
		throw new Error('fileId must be a number');
	}

	return db.executePreparedStatement({
		name: 'deleteFile',
		text: 'select delete_file($1, $2)',
		values: [ userId, fileId ]
	}).then(function(result){
		/* TODO */
	});
};

home.prototype.moveFile = function(userId, from, to){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof from != 'number'){
		throw new Error('from must be a number');
	}
	if(typeof to != 'number'){
		throw new Error('to must be a number');
	}

	return db.executePreparedStatement({
		name: 'moveFile',
		text: 'select move_file($1, $2, $3)',
		values: [ userId, from, to ]
	}).then(function(result){
		/* TODO */
	});
};

home.prototype.copyFile = function(userId, src, dest){
	if (typeof userId != 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof src != 'number'){
		throw new Error('src must be a number');
	}
	if(typeof dest != 'number'){
		throw new Error('dest must be a number');
	}

	return db.executePreparedStatement({
		name: 'copyFile',
		text: 'select copy_file($1, $2, $3)',
		values: [ userId, src, dest ]
	}).then(function(result){
		/* TODO */
	});
};

home.prototype.createSymLink = function(userId, src, dest){

};

home.prototype.exportFile = function(userId, path){

};

home.prototype.importFile = function(userId, data, path){

};

home.prototype.shareFile = function(userId, path){

};

home.prototype.setStudyMode = function(userId, path, studyMode){

};

home.prototype.setPrivacy = function(userId, path, privacy){

};

home.prototype.resetStats = function(userId, path){

};

module.exports = singleton;
