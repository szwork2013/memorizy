var should = require('should');
var register = require('../models/register');
var sinon = require('sinon');
var util = require('util');
var q = require('q');
var home = require('../models/home');
var db = require('../models/db');

describe('home.getFolderContentById', function(){
	it('should return a rejected promise if userId or folderId is not a number', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement');		
		
		var wrongUserId = home.getFolderContentById('abc', 3);
		var wrongFolderId = home.getFolderContentById(4, 'def');

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
		})
		.done();
	});

	it('should return a rejected promise if the user cannot access to the requested folder', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());	

		home.getFolderContentById(123, 123).then(function(){
			done(new Error('should have returned a rejected promise'));
		})
		.catch(function(err){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the user has access to the folder', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve({rows: 'some rows'}));	

		home.getFolderContentById(123, 123).then(function(val){
			done();
		})
		.catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.getFolderContentByPath', function(){
	it('should return a rejected promise if userId is not a number or path is not a string', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement');		
		
		var wrongUserId = home.getFolderContentByPath('abc', 'def');
		var wrongPath = home.getFolderContentByPath(4, 123);

		q.allSettled([ wrongUserId, wrongPath ]).then(function(){
			if (wrongUserId.isFulfilled() || wrongPath.isFulfilled()) {
				done(new Error('should have thrown an error'));	
			}
			else {
				done();
			}
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a rejected promise if the user cannot access to the requested folder', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());	

		home.getFolderContentByPath(123, 'abc').then(function(){
			done(new Error('should have returned a rejected promise'));
		})
		.catch(function(err){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the user has access to the folder', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve({rows: 'some rows'}));	

		home.getFolderContentByPath(123, 'abc').then(function(val){
			done();
		})
		.catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.createFileWithPath', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.createFileWithPath('wrong', 'valid', 'valid', 'valid'));	
		p.push(home.createFileWithPath(123, -1, 'valid', 'valid'));	
		p.push(home.createFileWithPath(123, 'valid', null, 'valid'));	
		p.push(home.createFileWithPath(123, 'valid', 'ok', []));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be created', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.createFileWithPath(123, 'filename', 'type', 'path').then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been created successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.createFileWithPath(123, 'filename', 'type', 'path').then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.createFileWithParentId', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.createFileWithParentId('wrong', 'valid', 'valid', 123));	
		p.push(home.createFileWithParentId(123, -1, 'valid', 123));	
		p.push(home.createFileWithParentId(123, 'valid', null, 123));	
		p.push(home.createFileWithParentId(123, 'valid', 'ok', []));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be created', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.createFileWithParentId(123, 'filename', 'type', 123).then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been created successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.createFileWithParentId(123, 'filename', 'type', 123).then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.renameFile', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.renameFile('wrong', 123, 'valid'));	
		p.push(home.renameFile(123, 'wrong', 'valid'));	
		p.push(home.renameFile(123, 'valid', null));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be renamed', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.renameFile(123, 456, 'newName').then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been renamed successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.renameFile(123, 456, 'newName').then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.deleteFile', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.deleteFile('wrong', 123));	
		p.push(home.deleteFile(123, 'wrong'));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be deleted', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.deleteFile(123, 456).then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been deleted successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.deleteFile(123, 456).then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.moveFile', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.moveFile('wrong', 123, 456));	
		p.push(home.moveFile(123, 'wrong', 456));	
		p.push(home.moveFile(123, 456, 'wrong'));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be moved', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.moveFile(123, 456, 789).then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been moved successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.moveFile(123, 456, 789).then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.copyFile', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.copyFile('wrong', 123, 456));	
		p.push(home.copyFile(123, 'wrong', 456));	
		p.push(home.copyFile(123, 456, 'wrong'));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be copied', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.copyFile(123, 456, 789).then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been copied successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.copyFile(123, 456, 789).then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});
});

describe('home.createSymLink', function(){
	it('should return a rejected promise if at least one argument is not of the expected type', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve());

		var p = [];
		p.push(home.createSymLink('wrong', 123, 456));	
		p.push(home.createSymLink(123, 'wrong', 456));	
		p.push(home.createSymLink(123, 456, 'wrong'));	

		q.allSettled(p).then(function(val){
			(function(){
				for (var i in p) {
					if (!p[i].isRejected()) {
						return q.reject('should have returned a rejected promise');
					}
				}
				// all calls returned a rejected promise
				return q.resolve();
			})().then(function(){
				stub.called.should.be.false;
				done();
			})
			.catch(done)
			.finally(function(){
				stub.restore();
			})
			.done();
		});
	});

	it('should return a rejected promise if the file cannot be copied', function(done){
		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.reject());
		
		home.createSymLink(123, 456, 789).then(function(){
			done(new Error('should have returned a rejected promise'));
		}).catch(function(){
			done();
		})
		.finally(function(){
			stub.restore();
		})
		.done();
	});

	it('should return a resolved promise if the file has been copied successfully', function(done){
		var result = {
			value : {
				row: [{id : 0}]
			}
		};

		var stub = sinon.stub(db, 'executePreparedStatement').returns(q.resolve(result));
		
		home.createSymLink(123, 456, 789).then(function(){
			done();
		}).catch(done)
		.finally(function(){
			stub.restore();
		})
		.done();
	});

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
