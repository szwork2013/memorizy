var q = require('q');
var db = require('./db');
var dv = require('./datavalidator');

function FileManager() {}

var singleton = new FileManager(); 

// TODO Ajouter l'userId en argument
FileManager.prototype.getFileByPath = function (path) {
  if (typeof path !== 'string') {
    return q.reject('path = ' + path + ' (expected a string)');
  }

  path = this.getArrayablePGPath(decodeURI(path));
  console.log(path);

  return db.executePreparedStatement({
    name : 'getFileByPath',
    text : 'select * ' +
      'from get_file(string_to_array($1, \'/\')) as ' +
      '(id integer, owner_id integer, name text,' +
      'size integer, type text)',
    values : [path]
  }).then(function (results) {
    if (results.rows.length <= 0) {
      throw new Error('Folder at path ' + path + ' not found');
    }
    return results.rows[0];	
  });
};

/**
 * getFolderContentById
 *
 * @param {number} userId
 * @param {number} folderId
 * @return {Array.<Object>}
 */
FileManager.prototype.getFolderContentById = function (userId, folderId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof folderId !== 'number') {
    return q.reject('folderId = ' + folderId + ' (expected a number)');	
  }

  return db.executePreparedStatement({
    name : 'getFolderContentById',
    text : 'select * from get_folder_content($1::INTEGER, $2::INTEGER)',
    values : [userId, folderId]
  }).then(function (results) {
    return results.rows;	
  });
};

/**
 * getFolderContentByPath
 *
 * @param {number} userId
 * @param {string} path
 * @return {Array.<Object>}
 */
FileManager.prototype.getFolderContentByPath = function (userId, path) {

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
    text : 'select * from get_folder_content($1::INTEGER, string_to_array($2, \'/\'))',
    values : [ userId, path ]
  }).then(function (results) {
    return results.rows;	
  });
};

/**
 * getArrayablePGPath
 *
 * @param {string} path A uri pointing to the file's location
 * @return {string} The path without slashes at its extremities
 */
FileManager.prototype.getArrayablePGPath = function (path) {
  path = path.replace(/\/{2,}/, '/');
  var firstChar = path.charAt(0);
  var lastChar = path.charAt(path.length - 1);

  if (firstChar === '/' && lastChar === '/' ) {
    path = path.substring(1, path.length - 1);
  }
  else if (firstChar === '/') {
    path = path.substring(1);
  }
  else if (lastChar === '/') {
    path = path.substring(0, path.length - 1);
  }

  return path;
};

/**
 * getFileTree
 *
 * @param {number} userId
 * @param {string} rootFolder
 * @return {Array.<Object>}
 */
FileManager.prototype.getFileTree = function (userId) {
  // TODO Use pl/pgsql function instead
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }

  console.log('getting file tree');

  return db.executePreparedStatement({
    name: 'getFileTree',
    text: 'select * from get_file_tree($1)', 
    values: [ userId ]
  }).then(function (result) {
    console.log(result.rows);
    return result.rows;
  });
};

FileManager.prototype.createFile = function (userId, file) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');
  }
  if (typeof file !== 'object') {
    return q.reject('file = ' + file + ' (expected an object)');
  }
  if (typeof file.name !== 'string') {
    return q.reject('name = ' + file.name + ' (expected a string)');
  }
  if (typeof file.type !== 'string') {
    return q.reject('file.type = ' + file.type + ' (expected a string)');	
  }

  if (typeof file.parentId === 'number') {
    return this.createFileWithParentId_(userId, file.name, file.type, file.parentId);
  }
  else if (typeof file.path === 'string') {
    return this.createFileWithPath_(userId, file.name, file.type, file.path);
  }
  
  return q.reject('The file must have a parentId or a path');
};

/**
 * createFileWithPath_
 *
 * @private
 * @param {number} userId
 * @param {string} filename
 * @param {string} type
 * @param {string} path
 * @return {number} The id of the new file
 */
FileManager.prototype.createFileWithPath_ = function (userId, filename, 
                                                     type, path) 
{

  path = this.getArrayablePGPath(path);
  return db.executePreparedStatement({
    name: 'createFileWithPath',
    text: 'select create_file($1::INTEGER, $2::TEXT, $3::TEXT,' +
      'string_to_array($4, \'/\'))',
    values: [ userId, filename, type, db.stringToPGPath(path)]
  }).then(function (result) {
    return result.rows[0].create_file; // new file's id
  });
};

/**
 * createFileWithParentId_
 *
 * @private
 * @param {number} userId
 * @param {string} filename
 * @param {string} type
 * @param {number} parentId
 * @return {number} The id of the new file
 */
FileManager.prototype.createFileWithParentId_ = function (userId, filename, 
                                                  type, parentId) {
  return db.executePreparedStatement({
    name: 'createFileWithParendId',
    text: 'select create_file($1::INTEGER, $2::TEXT' +
      ',$3::TEXT, $4::INTEGER)',
    values: [userId, filename, type, parentId]
  }).then(function (result) {
    console.log('result ' + result.rows[0].create_file);
    return result.rows[0].create_file; // new file's id
  });
};

/**
 * renameFile
 *
 * @param {number} userId
 * @param {number} fileId
 * @param {string} newName
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the file has been renamed or not
 */
FileManager.prototype.renameFile = function (userId, fileId, newName) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof fileId !== 'number') {
    return q.reject('fileId must be a number');
  }
  if (typeof newName !== 'string') {
    return q.reject('fileId must be a number');
  }

  if (dv.validateFilename(newName) === false) {
    return q.reject('filename must contain ' + 'a-Z0-9_ characters only');
  }

  return db.executePreparedStatement({
    name: 'renameFile',
    text: 'select rename_file($1::INTEGER,$2::INTEGER,$3::TEXT)',
    values: [ userId, fileId, newName ]
  });
};

/**
 * deleteFile
 *
 * @param {number} userId
 * @param {number} fileId
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the file has been deleted or not
 */
FileManager.prototype.deleteFile = function (userId, fileId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof fileId !== 'number') {
    console.log('typeof fileId = ' + typeof fileId);
    return q.reject('fileId = ' + fileId  + ' (expected a number)');
  }

  return db.executePreparedStatement({
    name: 'deleteFile',
    text: 'select delete_file($1, $2)',
    values: [userId, fileId]
  });
};

/**
 * moveFile
 *
 * @param {number} userId
 * @param {number} from The id of the file to be moved
 * @param {number} to The folder id where the file must be moved
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the file has been moved or not
 */
FileManager.prototype.moveFile = function (userId, from, to) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof from !== 'number') {
    return q.reject('from must be a number');
  }
  if (typeof to !== 'number') {
    return q.reject('to must be a number');
  }

  return db.executePreparedStatement({
    name: 'moveFile',
    text: 'select move_file($1, $2, $3)',
    values: [userId, from, to]
  });
};

/**
 * copyFile
 *
 * @param {number} userId
 * @param {number} src
 * @param {number} dest
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the file has been copied or not. If the promise is fulfilled,
 *    its value is the copy id
 */
FileManager.prototype.copyFile = function (userId, src, dest) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof src !== 'number') {
    return q.reject('src must be a number');
  }
  if (typeof dest !== 'number') {
    return q.reject('dest must be a number');
  }

  return db.executePreparedStatement({
    name: 'copyFile',
    text: 'select copy_file($1, $2, $3)',
    values: [ userId, src, dest ]
  }).then(function (result) {
    console.log('result ' , result.rows[0].copy_file);
    return result.rows[0].copy_file; // new file's id
  });
};

/**
 * createSymLink
 *
 * @param {number} userId
 * @param {number} src
 * @param {number} dest
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the symlink has been created or not. If the promise is fulfilled,
 *    its value is the symlink id
 */
FileManager.prototype.createSymLink = function (userId, src, dest) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof src !== 'number') {
    return q.reject('src must be a number');
  }
  if (typeof dest !== 'number') {
    return q.reject('dest must be a number');
  }

  return db.executePreparedStatement({
    name: 'createSymLink',
    text: 'select create_symlink($1, $2, $3)',
    values: [userId, src, dest]
  });
};

/**
 * star
 *
 * @param {number} userId
 * @param {number} fileId
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the file has been starred or not. If the promise is fulfilled,
 *    its value is the corresponding symlink id
 */
FileManager.prototype.star = function (userId, fileId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof fileId !== 'number') {
    return q.reject('fileId = ' + fileId + ' (expected a number)');
  }

  return db.executePreparedStatement({
    name: 'star',
    text: 'select star($1, $2)',
    values: [userId, fileId]
  }).then(function (result) {
    return result.rows[0].star; // new file's id
  });
};

/**
 * unstar
 *
 * @param {number} userId
 * @param {number} fileId
 * @return {Promise} A fulfilled/rejected promise depending on whether
 *    the file has been unstarred or not
 */
FileManager.prototype.unstar = function (userId, fileId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof fileId !== 'number') {
    return q.reject('fileId = ' + fileId + ' (expected a number)');
  }

  return db.executePreparedStatement({
    name: 'unstar',
    text: 'select unstar($1, $2)',
    values: [ userId, fileId ]
  });
};

FileManager.prototype.getFileFlashcards = function (userId, fileId) {
  if (typeof userId !== 'number') {
    return q.reject('userId = ' + userId + ' (expected a number)');	
  }
  if (typeof fileId !== 'number') {
    return q.reject('fileId = ' + fileId + ' (expected a number)');
  }

  return db.executePreparedStatement({
    name: 'getFileFlashcards',
    text: 'select * from get_flashcards($1, $2)',
    values: [ userId, fileId ]
  })
  .then(function (res) {
    return res.rows;
  });
};

//FileManager.prototype.exportFile = function (userId, path) {

//};

//FileManager.prototype.importFile = function (userId, data, path) {

//};

//FileManager.prototype.shareFile = function (userId, path) {

//};

//FileManager.prototype.setStudyMode = function (userId, path, studyMode) {

//};

//FileManager.prototype.setPrivacy = function (userId, path, privacy) {

//};

//FileManager.prototype.resetStats = function (userId, path) {

//};

module.exports = singleton;
