#!/bin/bash

docker run -it --name memorizy_db -v /home/carl/dev/memorizy:/db memorizy_db sh -c "tar xzvf /db/backup.tar.gz --no-overwrite-dir" && \
	docker run -it --name memorizy_db_data --volumes-from memorizy_db ubuntu:14.04 /bin/bash  && \
	docker rm memorizy_db
