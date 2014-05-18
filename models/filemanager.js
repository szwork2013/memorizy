(function (module) {
  'use strict';

  var deckModel = require('./deck'),
      q = require('q'),
      db = require('./db'),
      dv = require('./datavalidator');

  function FileManager() {}

  FileManager.prototype = {

    /**
     * getFileInfo
     *
     * @param {number} userId the user id
     * @param {number|string} fileId the file id or its absolute path
     * @return {Object} all information about the requested file, and user's stats on this file
     */
    getFileInfo: function (userId, fileId) {

      /**
       * Retrieve file information using its id
       */
      function getFileInfoWithId (userId, fileId) {
        return db.executePreparedStatement({
          name : 'getFileInfoWithId',
          text : 'select * from get_file_info($1::INTEGER, $2::INTEGER)',
          values : [userId, fileId]
        }).then(function (results) {
          if (results.rows.length <= 0) {
            throw new Error('Folder at path ' + path + ' not found');
          }
          return results.rows[0];	
        });
      }

      /**
       * Get the path without slashes at its extremities
       */
      function getArrayablePGPath (path) {
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
      }

      /**
       * Retrive file information using its absolute path
       */
      function getFileInfoWithPath (userId, path) {
        path = getArrayablePGPath(decodeURI(path));

        return db.executePreparedStatement({
          name : 'getFileInfoWithPath',
          text : 'select * from get_file_info($1::INTEGER, string_to_array($2, \'/\'))',
          values : [userId, path]
        }).then(function (results) {
          if (results.rows.length <= 0) {
            throw new Error('Folder at path ' + path + ' not found');
          }
          return results.rows[0];	
        });

      }

      if (typeof fileId === 'number') { return getFileInfoWithId(userId, fileId); }
      else if (typeof fileId === 'string') { return getFileInfoWithPath(userId, fileId); }

    },

    /**
     * Get files located a the given paths or with the given ids
     *
     * @param {number} userId The user's id
     * @param {number|string|Array<number|string>} fileIds The file's id 
     *    or its absolute path, or an array containing file ids or file absolute paths
     * @return {Promise} A promise fulfilled with the file info and content if fileIds
     *    is a number or a string, or with an array of files info and contents if fileIds
     *    is an array of numbers and strings, or a promise rejected with the error, if any
     */
    getFiles: function getFiles (userId, fileIds) {

      /**
       * Get a single file located at the given path or with the given id
       */
      function getOneFile (userId, fileId) {

        /**
         * Get files if the file is a folder, get its flashcards
         * if it is a deck
         */
        function getFileContent (userId, fileInfo) {

          /**
           * Get subfiles
           */
          function getFolderContent (userId, folderId) {
            return db.executePreparedStatement({
              name : 'getFolderContentById',
              text : 'select * from get_folder_content($1::INTEGER, $2::INTEGER)',
              values : [userId, folderId]
            }).then(function (results) {
              return results.rows;	
            });
          }

          if (fileInfo.type === 'deck') {
            return deckModel.getFlashcards(userId, fileInfo.id, fileInfo.flashcard_order_id);
          }
          else if (fileInfo.type === 'folder') {
            return getFolderContent(userId, fileInfo.id);
          }
          else {
            return q.reject('wrong file type: ' + fileInfo.type);
          }
        }

        var f, d = q.defer();

        return FileManager.prototype.getFileInfo(userId, fileId).then(function (fileInfo) {
          f = fileInfo;
          return getFileContent(userId, fileInfo).then(function (content) {
            if (f.type === 'deck') { f.flashcards = content; }
            else if (f.type === 'folder') { f.files = content; }
            return f;
          });
        }).catch(function (err) { console.log(err); });
      }

      if (typeof fileIds === 'number' || typeof fileIds === 'string') {
        return getOneFile(userId, fileIds);
      }
      else if (Object.prototype.toString.call(fileIds) === '[object Array]') {
        var deferred = [];
        for (var i in fileIds) {
          deferred.push(getOneFile(userId, fileIds[i]));
        }
        return q.all(deferred).then(function () {
          // put arguments into an array
          return Array.prototype.slice.call(deferred);
        });
      }
      else {
        return q.reject('fileIds must be a string, a number or an array of string or number');
      }
    },


    /**
     * getFileTree
     *
     * @param {number} userId
     * @param {string} rootFolder
     * @return {Array.<Object>}
     */
    getFileTree: function (userId) {
      // TODO Use pl/pgsql function instead
      if (typeof userId !== 'number') {
        return q.reject('userId = ' + userId + ' (expected a number)');	
      }

      return db.executePreparedStatement({
        name: 'getFileTree',
        text: 'select * from get_file_tree($1)', 
        values: [ userId ]
      }).then(function (result) {
        console.log(result.rows);
        return result.rows;
      });
    },

    createFile: function (userId, file) {
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
    },

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
    createFileWithPath_: function (userId, filename, type, path) {
      path = this.getArrayablePGPath(path);
      return db.executePreparedStatement({
        name: 'createFileWithPath',
        text: 'select create_file($1::INTEGER, $2::TEXT, $3::TEXT,' +
          'string_to_array($4, \'/\'))',
        values: [ userId, filename, type, db.stringToPGPath(path)]
      }).then(function (result) {
        return result.rows[0].create_file; // new file's id
      });
    },

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
    createFileWithParentId_: function (userId, filename, type, parentId) {
      return db.executePreparedStatement({
        name: 'createFileWithParendId',
        text: 'select create_file($1::INTEGER, $2::TEXT' +
          ',$3::TEXT, $4::INTEGER)',
        values: [userId, filename, type, parentId]
      }).then(function (result) {
        console.log('result ' + result.rows[0].create_file);
        return result.rows[0].create_file; // new file's id
      });
    },

    /**
     * renameFile
     *
     * @param {number} userId
     * @param {number} fileId
     * @param {string} newName
     * @return {Promise} A fulfilled/rejected promise depending on whether
     *    the file has been renamed or not
     */
    renameFile: function (userId, fileId, newName) {
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
    },

    /**
     * deleteFile
     *
     * @param {number} userId
     * @param {number} fileId
     * @return {Promise} A fulfilled/rejected promise depending on whether
     *    the file has been deleted or not
     */
    deleteFile: function (userId, fileId) {
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
    },

    /**
     * moveFile
     *
     * @param {number} userId
     * @param {number} from The id of the file to be moved
     * @param {number} to The folder id where the file must be moved
     * @return {Promise} A fulfilled/rejected promise depending on whether
     *    the file has been moved or not
     */
    moveFile: function (userId, from, to) {
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
    },

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
    copyFile: function (userId, src, dest) {
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
    },

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
    createSymLink: function (userId, src, dest) {
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
    },

    /**
     * star
     *
     * @param {number} userId
     * @param {number} fileId
     * @return {Promise} A fulfilled/rejected promise depending on whether
     *    the file has been starred or not. If the promise is fulfilled,
     *    its value is the corresponding symlink id
     */
    star: function (userId, fileId) {
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
    },

    /**
     * unstar
     *
     * @param {number} userId
     * @param {number} fileId
     * @return {Promise} A fulfilled/rejected promise depending on whether
     *    the file has been unstarred or not
     */
    unstar: function (userId, fileId) {
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
    }

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
  };

  var singleton = new FileManager(); 
  module.exports = singleton;
})(module);
