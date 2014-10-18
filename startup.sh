#!/bin/bash

# -o : stdout logfile
# -l : forever logfile
# -e : error log
# --spinSleepTime :time between restarts
LOGDIR=/opt/node-servers/animator-pal/logs
forever -o ${LOGDIR}/server.log -l ${LOGDIR}/forever.log -e ${LOGDIR}/error.log --spinSleepTime 5000 start main.js 