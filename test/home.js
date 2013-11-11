var should = require('should');
var register = require('../models/register');
var sinon = require('sinon');
var util = require('util');
var home = require('../models/home');

describe.only('home.getFolderContent', function(){
	it.only('should return a rejected promise if userId is not a number or path is not an array', function(done){
		
		home.getFolderContentByPath(186, '/carl//').then(function(rows){
			console.log('success');
			console.log(rows[0]);
			done();
		})
		.catch(function(err){
			console.log('failed');
			console.log(err);
			done(err);
		});

	});

	it('should return a rejected promise if the user isn\'t allowed to get the folder\'s content');

	it('should return a rejected promise if the path is invalid');

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
