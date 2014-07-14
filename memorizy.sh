#!/bin/bash

if [[ $EUID -ne 0 ]]; then
  echo 'You must be a root user'
  exit 1
fi

APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_IMAGE_NAME="memorizy"
APP_CONTAINER_NAME="memorizy"

DB_DIR="$APP_DIR"/server/src/db
DB_IMAGE_NAME="memorizy_db"
DB_CONTAINER_NAME="memorizy_db"

DATA_CONTAINER_NAME="memorizy_db_data"

docker inspect "$DATA_CONTAINER_NAME" 2>/dev/null 1>&2 || \
  docker run --name "$DATA_CONTAINER_NAME" -v /etc/postgresql \
  -v /var/log/postgresql -v /var/lib/postgresql busybox true  

echo "Start postgresql server..."
docker start "$DB_CONTAINER_NAME" 2>/dev/null || \
  docker run -it --name "$DB_CONTAINER_NAME" \
  --volumes-from "$DATA_CONTAINER_NAME" -d "$DB_IMAGE_NAME"

echo "Start node application..."
docker start -a "$APP_CONTAINER_NAME" 2>/dev/null || \
  docker run -it --name "$APP_CONTAINER_NAME" -p 3000:80 \
  --link "$DB_CONTAINER_NAME":db -v $APP_DIR:/memorizy "$APP_IMAGE_NAME"

