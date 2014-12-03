TEST_ENVIRONMENT=test

BIN_DIR=./node_modules/.bin

JSHINT=$(BIN_DIR)/jshint

MOCHA=$(BIN_DIR)/mocha
MOCHA_OPTIONS=--reporter spec

test:
	@$(JSHINT) index.js src/*.js
	@NODE_ENV=$(TEST_ENVIRONMENT) $(MOCHA) $(MOCHA_OPTIONS)

watch-test:
	@$(JSHINT) index.js src/*.js
	@NODE_ENV=$(TEST_ENVIRONMENT) $(MOCHA) $(MOCHA_OPTIONS) --watch

.PHONY: test watch-test
