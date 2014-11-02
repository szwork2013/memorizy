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
BACKUP_DIR="$APP_DIR/backup"

DB_DIR="$APP_DIR"/db
DB_IMAGE_NAME="memorizy_db"
DB_CONTAINER_NAME="memorizy_db"

ACTION=$1

install() {
  docker build -t "$APP_IMAGE_NAME" "$APP_DIR"
  docker build -t "$DB_IMAGE_NAME" "$DB_DIR"
}

run() {
  DB_ONLY=false
  ENV="prod"

  while [[ $# > 0 ]]
  do
    option="$1"
    shift

    case $option in 
      "--db-only")
        DB_ONLY=true
        ;;
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

  docker rm -f "$APP_CONTAINER_NAME" 2>/dev/null
  docker rm -f "$DB_CONTAINER_NAME" 2>/dev/null

  docker inspect "$DATA_CONTAINER_NAME" 2>/dev/null 1>&2 || \
    "$APP_DIR"/restore.sh "$DATA_CONTAINER_NAME" backup.tar.gz

  if [[ $DB_ONLY == false ]]; then
    docker run -it --name "$DB_CONTAINER_NAME" \
    --volumes-from "$DATA_CONTAINER_NAME" -d "$DB_IMAGE_NAME"

    docker run -it --name "$APP_CONTAINER_NAME" -p 3000:80 \
    --link "$DB_CONTAINER_NAME":db -v $APP_DIR:/memorizy -d "$APP_IMAGE_NAME"
  else
    docker stop "$APP_CONTAINER_NAME" 2>/dev/null 1>&2

    docker run -it --name "$DB_CONTAINER_NAME" \
    --volumes-from "$DATA_CONTAINER_NAME" -d "$DB_IMAGE_NAME"
  fi
}

attach() {
  if [[ $# != 1 ]]; then
    echo "Syntax: $0 attach <server|db>"
    exit
  fi

  case $1 in
    "server")
      docker attach "$APP_CONTAINER_NAME"
      ;;
    "db")
      docker attach "$DB_CONTAINER_NAME"
      ;;
    *)
      echo "Can only attach to server or db"
      exit
  esac
}

psql() {
  docker run -it --link "$DB_CONTAINER_NAME":postgres --rm "$DB_IMAGE_NAME" sh -c 'exec psql -h "$POSTGRES_PORT_5432_TCP_ADDR" -p "$POSTGRES_PORT_5432_TCP_PORT" -U postgres -d memorizy'
}

extract() {
  if [[ $# -ne 2 ]]; then
    echo "Syntax: $0 extract <data_container> <archive.tar.gz>"
    exit
  fi

  DATA_CONTAINER_NAME=$1
  ARCHIVE=$2

  mkdir "$APP_DIR"/backup 2>/dev/null

  docker run --rm --volumes-from "$DATA_CONTAINER_NAME" -v "$BACKUP_DIR":/backup ubuntu tar cvf /backup/$ARCHIVE /etc/postgresql /var/log/postgresql /var/lib/postgresql
}

restore() {
  if [[ $# -ne 2 ]]; then
    echo "Syntax: $0 restore <archive.tar.gz> <data_container>"
    exit
  fi

  ARCHIVE=$1
  DATA_CONTAINER_NAME=$2

  docker rm -f "$DB_CONTAINER_NAME" 2>/dev/null 1>&2
  docker rm -f "$DATA_CONTAINER_NAME" 2>/dev/null 1>&2

  docker run -it --name "$DB_CONTAINER_NAME" -v $APP_DIR:/db "$DB_IMAGE_NAME" sh -c "tar xvf db/$ARCHIVE --no-overwrite-dir" && \
    docker run -it --name "$DATA_CONTAINER_NAME" --volumes-from "$DB_CONTAINER_NAME" -d ubuntu:14.04 /bin/bash  && \
    docker rm "$DB_CONTAINER_NAME"
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
  *)
    help
    exit
esac

