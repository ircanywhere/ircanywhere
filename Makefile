test: 
	laika -t 10000 --settings private/test-config.json --reporter spec
.PHONY: test
