var should = require('should');
var register = require('../models/register');
var sinon = require('sinon');

describe('home.getFiles', function(){
	it('should call its callback with an EACCES error if the user isn\'t allowed to get the folder\'s content');

	it('should call its callback with an ENOTEXIST error if the path is invalid');

	it('should call its callback without any error and with an object literal containing every file info. if the user has access to the folder');
});

describe('home.createFile', function(){
	it('should call its callback with an EACCES error if the user isn\'t allowed to write in the current folder');
	
	it('should call its callback with an ENOTEXIST error if the path is invalid');

	it('should call its callback with an ETOOLONG error if the filename\'s length > 255');

	it('should call its callback with an EEMPTY error if the filename is empty');

	it('should call its callback with an EEXIST error if the filename is already used in this folder');

	it('should call its callback with the file\'s id in the database and no error if the file is successfuly created'); 
});

describe('home.renameFile', function(){
	it('should call its callback with an EACCES error if the user doesn\'t have write access to the file to rename');

	it('should call its callback with an ENOTEXIST error if the file doesn\'t exist');

	it('should call its callback with an ETOOLONG error if the filename\'s length > 255');

	it('should call its callback with an EEMPTY error if the filename is empty');

	it('should call its callback with an EEXIST if the new filename is already used in this folder');

	it('should call its callback without any error if the file has been renamed successfully');
});

describe('home.deleteFile', function(){

});

describe('home.moveFile', function(){

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

});

describe('home.resetStats', function(){

});
