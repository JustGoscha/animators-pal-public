# AnimatorPal - A twitter bot for animation related content

- in credentials.js there are the Twitter credentials... don't commit usually 
- startup.sh let's it run
- forever stop main.js let's it usually stop

## Logrotation

- logrotation is setup in 

```
/etc/logrotate.d/animatorspal
```

- config file

```
/opt/node-servers/animator-pal/logs/server.log {
  daily         # how often to rotate
  rotate 20
  missingok     # don't panic if the log file doesn't exist
  notifempty    # ignore empty files
  sharedscripts # no idea what it does, but it's in all examples
  copytruncate  # needed for forever to work properly
  dateext       # adds date to filename 
}
```

- fix logrotate: 

https://github.com/foreverjs/forever/issues/106#issuecomment-116933382
or use pm2 instead of forever and pm2-logrotate