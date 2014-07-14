#!/bin/bash

if [[ $EUID -ne 0 ]]; then
  echo 'You must be a root user'
  exit 1
fi

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

TAG_DB_IMG="memorizy_db"
TAG_APP_IMG="memorizy"

docker build -t "$TAG_DB_IMG" $DIR/server/src/db
docker build -t "$TAG_APP_IMG" .

