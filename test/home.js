var should = require('should');
var register = require('../models/register');
var sinon = require('sinon');
var util = require('util');
var q = require('q');
var home = require('../models/home');
var db = require('../models/db');

describe.only('home.getFolderContentById', function(){
	it.only('should return a rejected promise if userId or folderId is not a number', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement');		
		
		var wrongUserId = home.getFolderContentById('abc', 3);
		var wrongFolderId = home.getFolderContentById(4, 'def');

		console.log('1- wrongUserId = ' + wrongUserId.isFulfilled());
		q.allSettled([ wrongUserId, wrongFolderId ]).then(function(){
			if (wrongUserId.isFulfilled() || wrongFolderId.isFulfilled()) {
				done(new Error('should have thrown an error'));	
			}
			else {
				done();
			}
		})
		.finally(function(){
			stub.restore();
		});
	});

	it('should return a rejected promise if the user isn\'t allowed to get the folder\'s content');

	it('should return a resolved promise with an object literal containing every file info. if the user has access to the folder');
});

describe('home.createFile', function(){
	it('should return a rejected promise if the user isn\'t allowed to write in the current folder');
	
	it('should return a rejected promise if the path is invalid');

	it('should return a rejected promise if the filename\'s length > 255');

	it('should return a rejected promise if the filename is empty');

	it('should return a rejected promise if the filename is already used in this folder');

	it('should call its callback with the file\'s id in the database and no error if the file is successfuly created'); 
});

describe('home.renameFile', function(){
	it('should return a rejected promise if the user doesn\'t have write access to the file to rename');

	it('should return a rejected promise if the file doesn\'t exist');

	it('should return a rejected promise if the filename\'s length > 255');

	it('should return a rejected promise if the filename is empty');

	it('should return a rejected promise if the new filename is already used in this folder');

	it('should call its callback without any error if the file has been renamed successfully');
});

describe('home.deleteFile', function(){
	it('should return a rejected promise if the user is not the owner of the file');

	it('should return a rejected promise if the file does not exist');

	it('should return a resolved promise if the file has been deleted successfully');
});

describe('home.moveFile', function(){
	it('should return a rejected promise if the user is not the owner of the file');

	it('should return a rejected promise if the file does not exist');

	it('should return a resolved promise if the file has been moved successfully');
});

describe('home.copy', function(){

});

describe('home.createSymLink', function(){

});

describe('home.export', function(){

});

describe('home.import', function(){

});

describe('home.share', function(){

});

describe('home.setDefaultStudyMode', function(){

});

describe('home.setPrivacy', function(){
	it('should return a rejected promise if the user is not the owner of the file');

	it('should return a rejected promise if the file does not exist');

	it('should return a resolved promise if the file privacy configuration has been modified successfully');
});

describe('home.resetStats', function(){

});
