#!/bin/bash

docker run -it --name memorizy_db -v /home/carl/dev/memorizy:/db memorizy_db sh -c "tar xvf /db/backup.tar --no-overwrite-dir" && \
	docker run -it --name memorizy_db_data --volumes-from memorizy_db busybox find / -iname "*postgres*"  && \
	docker rm memorizy_db
