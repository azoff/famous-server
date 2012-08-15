PROJECT="FamousNamous Server"
DIR_LOGS="logs"
DIR_MODULES="node_modules"
MAIN_JS="src/famous.js"
RUNNER_JS="node_modules/supervisor/lib/cli-wrapper.js"

all: install server

server : ;@echo "Starting ${PROJECT}....."; \
	export NODE_PATH=.; \
	nohup node ${RUNNER_JS} ${MAIN_JS} &> ${DIR_LOGS}/nohup.log &

install : ;@echo "Installing ${PROJECT}....."; \
	npm install
	if [ ! -d ${DIR_LOGS} ] ; then mkdir -m 777 ${DIR_LOGS} ; fi

update : ;@echo "Updating ${PROJECT}....."; \
	git pull --rebase; \
	npm install

clean : ;
	rm -rf ${DIR_MODULES}
	rm -rf ${DIR_LOGS}