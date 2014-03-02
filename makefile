test : 
	mocha --reporter spec 
	mocha-phantomjs test/client/*.html -R spec 

coverage :
	istanbul cover _mocha -- -R dot 

.PHONY: test coverage

