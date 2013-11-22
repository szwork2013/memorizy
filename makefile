
test : 
	mocha --reporter spec

coverage :
	istanbul cover _mocha -- -R spec

.PHONY: test coverage
