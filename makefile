PROJECT = "FamousNamous Server"
DIR_LOGS = "logs"
DIR_MODULES = "node_modules"
MAIN_JS = "src/famous.js"

all: install server

server : ;@echo "Starting ${PROJECT}....."; \
	export NODE_PATH=.; \
	node ${MAIN_JS}

install: ;@echo "Installing ${PROJECT}....."; \
	npm install
	mkdir ${DIR_LOGS} && chmod 777 ${DIR_LOGS}

update: ;@echo "Updating ${PROJECT}....."; \
	git pull --rebase; \
	npm install

clean : ;
	rm -rf ${DIR_MODULES}
	rm -rf ${DIR_LOGS}


.PHONY: test server install clean update