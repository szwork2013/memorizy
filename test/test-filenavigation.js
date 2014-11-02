(function() {
  'use strict';

  /* jshint expr: true */
  require('should');
  var sinon = require('sinon');
  var register = require('../models/register');
  var util = require('util');
  var q = require('q');
  var filemanager = require(__dirname + '/../models/filemanager');
  var db = require('../models/db');

  describe('FileNavigation.getFolderContentById', function(){
    //it('should return a rejected promise if userId or folderId is not a number', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement');		
      
      //var wrongUserId = filemanager.getFolderContentById('abc', 3);
      //var wrongFolderId = filemanager.getFolderContentById(4, 'def');

      //q.allSettled([ wrongUserId, wrongFolderId ]).then(function(){
        //if (wrongUserId.isFulfilled() || wrongFolderId.isFulfilled()) {
          //done(new Error('should have thrown an error'));	
        //}
        //else {
          //done();
        //}
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a rejected promise if the user cannot access to the requested folder', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());	

      //filemanager.getFolderContentById(123, 123).then(function(){
        //done(new Error('should have returned a rejected promise'));
      //})
      //.catch(function(err){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the user has access to the folder', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve({rows: 'some rows'}));	

      //filemanager.getFolderContentById(123, 123).then(function(val){
        //done();
      //})
      //.catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  });

  //describe('FileNavigation.getFolderContentByPath', function(){
    //it('should return a rejected promise if userId is not a number or path is not a string', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement');		
      
      //var wrongUserId = filemanager.getFolderContentByPath('abc', 'def');
      //var wrongPath = filemanager.getFolderContentByPath(4, 123);

      //q.allSettled([ wrongUserId, wrongPath ]).then(function(){
        //if (wrongUserId.isFulfilled() || wrongPath.isFulfilled()) {
          //done(new Error('should have thrown an error'));	
        //}
        //else {
          //done();
        //}
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a rejected promise if the user cannot access to the requested folder', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());	

      //filemanager.getFolderContentByPath(123, 'abc').then(function(){
        //done(new Error('should have returned a rejected promise'));
      //})
      //.catch(function(err){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the user has access to the folder', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve({rows: 'some rows'}));	

      //filemanager.getFolderContentByPath(123, 'abc').then(function(val){
        //done();
      //})
      //.catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.createFileWithPath', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.createFileWithPath('wrong', 'valid', 'valid', 'valid'));	
      //p.push(filemanager.createFileWithPath(123, -1, 'valid', 'valid'));	
      //p.push(filemanager.createFileWithPath(123, 'valid', null, 'valid'));	
      //p.push(filemanager.createFileWithPath(123, 'valid', 'ok', []));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be created', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.createFileWithPath(123, 'filename', 'type', 'path').then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been created successfully', function(done){
      //var result = {
        //value : {
          //rows: [{create_file : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result.value));
      
      //filemanager.createFileWithPath(123, 'filename', 'type', 'path').then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.createFileWithParentId', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.createFileWithParentId('wrong', 'valid', 'valid', 123));	
      //p.push(filemanager.createFileWithParentId(123, -1, 'valid', 123));	
      //p.push(filemanager.createFileWithParentId(123, 'valid', null, 123));	
      //p.push(filemanager.createFileWithParentId(123, 'valid', 'ok', []));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be created', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.createFileWithParentId(123, 'filename', 'type', 123).then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been created successfully', function(done){
      //var result = {
        //value : {
          //rows: [{id : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result.value));
      
      //filemanager.createFileWithParentId(123, 'filename', 'type', 123).then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.renameFile', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.renameFile('wrong', 123, 'valid'));	
      //p.push(filemanager.renameFile(123, 'wrong', 'valid'));	
      //p.push(filemanager.renameFile(123, 'valid', null));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be renamed', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.renameFile(123, 456, 'newName').then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been renamed successfully', function(done){
      //var result = {
        //value : {
          //row: [{id : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
      
      //filemanager.renameFile(123, 456, 'newName').then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.deleteFile', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.deleteFile('wrong', 123));	
      //p.push(filemanager.deleteFile(123, 'wrong'));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be deleted', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.deleteFile(123, 456).then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been deleted successfully', function(done){
      //var result = {
        //value : {
          //row: [{id : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
      
      //filemanager.deleteFile(123, 456).then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.moveFile', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.moveFile('wrong', 123, 456));	
      //p.push(filemanager.moveFile(123, 'wrong', 456));	
      //p.push(filemanager.moveFile(123, 456, 'wrong'));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be moved', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.moveFile(123, 456, 789).then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been moved successfully', function(done){
      //var result = {
        //value : {
          //row: [{id : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
      
      //filemanager.moveFile(123, 456, 789).then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.copyFile', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.copyFile('wrong', 123, 456));	
      //p.push(filemanager.copyFile(123, 'wrong', 456));	
      //p.push(filemanager.copyFile(123, 456, 'wrong'));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be copied', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.copyFile(123, 456, 789).then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been copied successfully', function(done){
      //var result = {
        //value : {
          //row: [{id : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
      
      //filemanager.copyFile(123, 456, 789).then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});
  //});

  //describe('FileNavigation.createSymLink', function(){
    //it('should return a rejected promise if at least one argument is not of the expected type', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

      //var p = [];
      //p.push(filemanager.createSymLink('wrong', 123, 456));	
      //p.push(filemanager.createSymLink(123, 'wrong', 456));	
      //p.push(filemanager.createSymLink(123, 456, 'wrong'));	

      //q.allSettled(p).then(function(val){
        //(function(){
          //for (var i in p) {
            //if (!p[i].isRejected()) {
              //return q.reject('should have returned a rejected promise');
            //}
          //}
          //// all calls returned a rejected promise
          //return q.resolve();
        //})().then(function(){
          //stub.called.should.be.false;
          //done();
        //})
        //.catch(done)
        //.finally(function(){
          //stub.restore();
        //})
        //.done();
      //});
    //});

    //it('should return a rejected promise if the file cannot be copied', function(done){
      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
      
      //filemanager.createSymLink(123, 456, 789).then(function(){
        //done(new Error('should have returned a rejected promise'));
      //}).catch(function(){
        //done();
      //})
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

    //it('should return a resolved promise if the file has been copied successfully', function(done){
      //var result = {
        //value : {
          //row: [{id : 0}]
        //}
      //};

      //var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
      
      //filemanager.createSymLink(123, 456, 789).then(function(){
        //done();
      //}).catch(done)
      //.finally(function(){
        //stub.restore();
      //})
      //.done();
    //});

  //});

  //describe('FileNavigation.export', function(){

  //});

  //describe('FileNavigation.import', function(){

  //});

  //describe('FileNavigation.share', function(){

  //});

  //describe('FileNavigation.setDefaultStudyMode', function(){

  //});

  //describe('FileNavigation.setPrivacy', function(){
    //it('should return a rejected promise if the user is not the owner of the file');

    //it('should return a rejected promise if the file does not exist');

    //it('should return a resolved promise if the file privacy configuration has been modified successfully');
  //});

  //describe('FileNavigation.resetStats', function(){

  //});
})();
