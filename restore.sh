#!/bin/bash
if [[ $# -ne 2 ]]; then
  echo "Syntax: $0 <data_container> <archive.tar.gz>"
  exit
fi

APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_IMAGE_NAME="memorizy"
APP_CONTAINER_NAME="memorizy"

DB_DIR="$APP_DIR"/server/src/db
DB_IMAGE_NAME="memorizy_db"
DB_CONTAINER_NAME="memorizy_db"

DATA_CONTAINER_NAME=$1
ARCHIVE=$2

docker rm -f "$DB_CONTAINER_NAME" 2>/dev/null 1>&2
docker rm -f "$DATA_CONTAINER_NAME" 2>/dev/null 1>&2

docker run -it --name "$DB_CONTAINER_NAME" -v $APP_DIR:/db "$DB_IMAGE_NAME" sh -c "tar xzvf db/$ARCHIVE --no-overwrite-dir" && \
	docker run -it --name "$DATA_CONTAINER_NAME" --volumes-from "$DB_CONTAINER_NAME" -d ubuntu:14.04 /bin/bash  && \
	docker rm "$DB_CONTAINER_NAME"
