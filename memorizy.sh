#!/bin/bash

help() {
    echo -e "Commands:\n\
      \tinstall\t\tInstall node and database servers\n\
      \trun\t\tRun node and database servers\n\
      \tattach\t\tAttach current tty to node or database server\n\
      \tpsql\t\tConnect to the database"
}

if [[ $# == 0 ]]; then 
  echo "Syntax: $0 <command> <options>"
  help
  exit
fi

APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_IMAGE_NAME="memorizy"
APP_CONTAINER_NAME="memorizy"

GULP_IMAGE_NAME="memorizy_gulp"
GULP_CONTAINER_NAME="memorizy_gulp"

BACKUP_DIR="$APP_DIR/backup"

DB_DIR="$APP_DIR"/db
DB_IMAGE_NAME="memorizy_db"
DB_CONTAINER_NAME="memorizy_db"

ACTION=$1

install() {
  # Cannot specify a dockerfile to docker for a build, so have to
  # handle this manually
  cat memorizy.docker > Dockerfile
  docker build -t "$APP_IMAGE_NAME" "$APP_DIR"
  cat gulp.docker > Dockerfile
  docker build -t "$GULP_IMAGE_NAME" "$APP_DIR"

  rm Dockerfile
  
  docker build -t "$DB_IMAGE_NAME" "$DB_DIR"
}

attach() {
  if [[ $# != 1 ]]; then
    echo "Syntax: $0 attach <server|db|gulp>"
    exit
  fi

  case $1 in
    "server")
      docker attach "$APP_CONTAINER_NAME"
      ;;
    "db")
      docker attach "$DB_CONTAINER_NAME"
      ;;
    "gulp")
      docker attach "$GULP_CONTAINER_NAME"
      ;;
    *)
      echo "Can only attach to server, db or gulp"
      exit
  esac
}

psql() {
  docker run -it --link "$DB_CONTAINER_NAME":postgres --rm -v "$APP_DIR"/db:/db "$DB_IMAGE_NAME" \
     sh -c 'exec psql -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U postgres -d memorizy'
} 

extract() {
  if [[ $# -ne 2 ]]; then
    echo "Syntax: $0 extract <data_container> <archive.tar.gz>"
    exit
  fi

  DATA_CONTAINER_NAME=$1
  ARCHIVE=$2

  mkdir "$APP_DIR"/backup 2>/dev/null

  docker run --rm --volumes-from "$DATA_CONTAINER_NAME" -v "$BACKUP_DIR":/backup \
    ubuntu tar cvf /backup/$ARCHIVE /etc/postgresql /var/log/postgresql /var/lib/postgresql
}

restore() {
  if [[ $# -ne 2 ]]; then
    echo "Syntax: $0 restore <archive.tar.gz> <data_container>"
    exit
  fi

  ARCHIVE=$1
  DATA_CONTAINER_NAME=$2

  echo -e "Restore $ARCHIVE to $DATA_CONTAINER_NAME...\t\c"

  docker rm -f "$DB_CONTAINER_NAME" 2>/dev/null 1>&2
  docker rm -f "$DATA_CONTAINER_NAME" 2>/dev/null 1>&2

  docker run -it --name "$DB_CONTAINER_NAME" -v $APP_DIR:/db "$DB_IMAGE_NAME" sh -c "tar xf db/$ARCHIVE --no-overwrite-dir && echo Ok" && \
    docker run -it --name "$DATA_CONTAINER_NAME" --volumes-from "$DB_CONTAINER_NAME" -d ubuntu:14.04 /bin/bash >/dev/null && \
    docker rm "$DB_CONTAINER_NAME" >/dev/null
}

gulp() {
  echo -e "Gulp container\t\c"
  docker run -it --link "$DB_CONTAINER_NAME":db --name "$GULP_CONTAINER_NAME" \
    -v $APP_DIR:/memorizy -d "$GULP_IMAGE_NAME" sh -c "cd /memorizy && gulp"
}

run() {
  ENV="dev"

  while [[ $# > 0 ]]
  do
    option="$1"
    shift

    case $option in 
      "-e" | "--env")
        ENV=$1
        shift
        ;;
    esac
  done

  case $ENV in
    "prod")
      DATA_CONTAINER_NAME="memorizy_db_data"
      ;;
    "dev")
      DATA_CONTAINER_NAME="memorizy_db_data_test"
      ;;
    *)
      echo "Invalid environment, must be prod or dev"
      exit
      ;;
  esac

  docker rm -f "$APP_CONTAINER_NAME" 2>/dev/null 1>&2
  docker rm -f "$GULP_CONTAINER_NAME" 2>/dev/null 1>&2
  docker rm -f "$DB_CONTAINER_NAME" 2>/dev/null 1>&2

  docker inspect "$DATA_CONTAINER_NAME" 2>/dev/null 1>&2 || \
    restore backup.tar.gz "$DATA_CONTAINER_NAME" 

  echo -e "Database container with data from ${DATA_CONTAINER_NAME}\t\c"
  docker run -it --name "$DB_CONTAINER_NAME" \
  --volumes-from "$DATA_CONTAINER_NAME" -d "$DB_IMAGE_NAME" 

  echo -e "Node container\t\c"
  docker run -it --name "$APP_CONTAINER_NAME" -p 3000:80 --link "$DB_CONTAINER_NAME":db \
    -v $APP_DIR:/memorizy -d "$APP_IMAGE_NAME" 

  gulp
}

case $ACTION in
  "install")
    shift
    install $*
    ;;
  "run")
    shift
    run $* 
    ;;
  "attach")
    shift
    attach $*
    ;;
  "psql")
    shift
    psql $*
    ;;
  "extract")
    shift
    extract $*
    ;;
  "restore")
    shift
    restore $*
    ;;
  "gulp")
    shift
    gulp $*
    ;;
  *)
    help
    exit
esac

