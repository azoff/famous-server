DIR_LOGS="logs"
DIR_MODULES=node_modules
MAIN_JS=src/famous.js
RUNNER_JS=node_modules/supervisor/lib/cli-wrapper.js

all : install server

server : ;
	export NODE_PATH=.; \
	nohup node ${RUNNER_JS} ${MAIN_JS} &> ${DIR_LOGS}/supervisor.log &

kill : ;
	killall node

install : ;
	npm install
	if [ ! -d ${DIR_LOGS} ] ; then mkdir -m 777 ${DIR_LOGS} ; fi

update : ;
	git reset HEAD --hard; \
	git pull --rebase;

clean : ;
	rm -rf ${DIR_MODULES}
	rm -rf ${DIR_LOGS}