#!/bin/bash

# -o : stdout logfile
# -l : forever logfile
# -e : error log
# --spinSleepTime :time between restarts
forever -o /opt/node-servers/animator-pal/server.log -l forever.log -e error.log --spinSleepTime 5000 start main.js 