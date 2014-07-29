#!/bin/bash

set -x
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKUP_PATH="${DIR}/backup.tar.gz"
BRANCH=$(git branch | egrep ^[*\ ] | cut -f2 -d" ")

# create the archive
docker run --rm --volumes-from memorizy_db_data -v "$DIR":/backup ubuntu tar cvzf /backup/backup.tar.gz /var/lib/postgresql /etc/postgresql /var/log/postgresql

# send to remote server
git add -f "$BACKUP_PATH"
git commit -m "backup" "$BACKUP_PATH" && \
  su user -c "git push origin $BRANCH"
