var q = require('q');
var db = require('./db');
var dv = require('./dataValidator');

function home(){}

var singleton = new home(); 

home.prototype.getFileByPath = function(path){
	if(typeof path !== 'string'){
		return q.reject('path = ' + path + ' (expected a string)');	
	}

	path = this.getArrayablePGPath(path);

	return db.executePreparedStatement({
		name : 'getFolderByPath',
		text : 'select * from get_folder(string_to_array($1, \'/\')) as ' +
			'(id integer, owner_id integer, name text, size integer, type text)',
		values : [ path ]
	}).then(function(results){
		if (results.rows.length <= 0) {
			throw new Error('Folder at path ' + path + ' not found');
		}
		return results.rows[0];	
	});
};

home.prototype.getFolderContentById = function(userId, folderId){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof folderId !== 'number'){
		return q.reject('folderId = ' + folderId + ' (expected a number)');	
	}
	
	return db.executePreparedStatement({
		name : 'getFolderContentById',
		text : 'select * from get_folder_content($1::INTEGER, $2::INTEGER) as ' +
			'(id integer, owner_id integer, name text, size integer, type text, percentage integer)',
		values : [ userId, folderId ]
	}).then(function(results){
		return results.rows;	
	});
};

home.prototype.getFolderContentByPath = function(userId, path){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	/*
	 *path should be a string corresponding to the path section
	 *of the url ('/test/a/b' in 'www.example.com/test/a/b')
	 */
	if (typeof path !== 'string') {
		return q.reject('path = ' + path + ' (expected a string)');	
	}
	
	path = this.getArrayablePGPath(path);

	return db.executePreparedStatement({
		name : 'getFolderContentByPath',
		text : 'select * from get_folder_content($1::INTEGER, string_to_array($2, \'/\')) as ' +
			'(id integer, owner_id integer, name text, size integer, type text, percentage integer)',
		values : [ userId, path ]
	}).then(function(results){
		return results.rows;	
	});
};

home.prototype.getArrayablePGPath = function(path){
	path = path.replace(/\/{2,}/, '/');
	var firstChar = path.charAt(0);
	var lastChar = path.charAt(path.length - 1);

	if (firstChar === '/' && lastChar === '/' ) {
		path = path.substring(1, path.length - 1);
	}
	else if(firstChar === '/'){
		path = path.substring(1);
	}
	else if(lastChar === '/'){
		path = path.substring(0, path.length - 1);
	}

	return path;
};

home.prototype.getFileTree = function(userId, rootFolder){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if (typeof rootFolder !== 'string') {
		return q.reject('rootFolder = ' + rootFolder + ' (expected a string)');	
	}

	return db.executePreparedStatement({
		name: 'getFileTree',
		text: 'select f.id, f.filename, f.type, ft.ancestor_id' +
			' from files f join file_tree ft on f.id = ft.descendant_id' +
			' where f.id in (' +
				'select descendant_id from file_tree ft2' +
				' where ft2.ancestor_id = (' + 
					'select f2.id from files f2' +
					' where f2.filename = $1 and f2.id in (' +
						'select descendant_id from file_tree ft3' + 
						' where ft3.ancestor_id = 0 and ft3.dist = 1' + 
					')' + 
				')' + 
			') and dist =1 order by descendant_id asc, dist desc',
		values: [rootFolder]
	}).then(function(result){
		console.log(result.rows);
		return result.rows;
	});
};

home.prototype.createFileWithPath = function(userId, filename, type, path){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if (typeof filename !== 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof type !== 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof path !== 'string') {
		return q.reject('path = ' + path + ' (expected a string)');	
	}

	path = this.getArrayablePGPath(path);
	return db.executePreparedStatement({
		name: 'createFileWithPath',
		text: 'select create_file($1::INTEGER, $2::TEXT, $3::TEXT, string_to_array($5, \'/\'))',
		values: [ userId, filename, type, db.stringToPGPath(path)]
	}).then(function(result){
		return result.rows[0].create_file; // new file's id
	});
};

home.prototype.createFileWithParentId = function(userId, filename, type, parentId){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if (typeof filename !== 'string') {
		return q.reject('filename = ' + filename + ' (expected a string)');	
	}
	if (typeof type !== 'string') {
		return q.reject('type = ' + type + ' (expected a string)');	
	}
	if (typeof parentId !== 'number') {
		return q.reject('parentId = ' + parentId + ' (expected a number)');	
	}
	
	return db.executePreparedStatement({
		name: 'createFileWithParendId',
		text: 'select create_file($1::INTEGER, $2::TEXT, $3::TEXT, $4::INTEGER)',
		values: [ userId, filename, type, parentId]
	}).then(function(result){
		console.log(result);
		return result.rows[0].create_file; // new file's id
	});
};

home.prototype.renameFile = function(userId, fileId, newName){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof fileId !== 'number'){
		return q.reject('fileId must be a number');
	}
	if(typeof newName !== 'string'){
		return q.reject('fileId must be a number');
	}

	if(dv.validateFilename(newName) === false){
		return q.reject('filename must contain a-Z0-9_ characters only');
	}

	return db.executePreparedStatement({
		name: 'renameFile',
		text: 'select rename_file($1::INTEGER, $2::INTEGER, $3::TEXT)',
		values: [ userId, fileId, newName ]
	});
};

home.prototype.deleteFile = function(userId, fileId){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof fileId !== 'number'){
		return q.reject('fileId = ' + fileId  + ' (expected a number)');
	}

	return db.executePreparedStatement({
		name: 'deleteFile',
		text: 'select delete_file($1, $2)',
		values: [ userId, fileId ]
	});
};

home.prototype.moveFile = function(userId, from, to){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof from !== 'number'){
		return q.reject('from must be a number');
	}
	if(typeof to !== 'number'){
		return q.reject('to must be a number');
	}

	return db.executePreparedStatement({
		name: 'moveFile',
		text: 'select move_file($1, $2, $3)',
		values: [ userId, from, to ]
	});
};

home.prototype.copyFile = function(userId, src, dest){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof src !== 'number'){
		return q.reject('src must be a number');
	}
	if(typeof dest !== 'number'){
		return q.reject('dest must be a number');
	}

	return db.executePreparedStatement({
		name: 'copyFile',
		text: 'select copy_file($1, $2, $3)',
		values: [ userId, src, dest ]
	});
};

home.prototype.createSymLink = function(userId, src, dest){
	if (typeof userId !== 'number') {
		return q.reject('userId = ' + userId + ' (expected a number)');	
	}
	if(typeof src !== 'number'){
		return q.reject('src must be a number');
	}
	if(typeof dest !== 'number'){
		return q.reject('dest must be a number');
	}

	return db.executePreparedStatement({
		name: 'createSymLink',
		text: 'select create_symlink($1, $2, $3)',
		values: [ userId, src, dest ]
	});
};

//home.prototype.exportFile = function(userId, path){

//};

//home.prototype.importFile = function(userId, data, path){

//};

//home.prototype.shareFile = function(userId, path){

//};

//home.prototype.setStudyMode = function(userId, path, studyMode){

//};

//home.prototype.setPrivacy = function(userId, path, privacy){

//};

//home.prototype.resetStats = function(userId, path){

//};

module.exports = singleton;
