node produce-clearmap/index-clear.js
/usr/local/bin/tile-join --output-to-directory=produce-clearmap/clearmaptile/clearmap-zxy --no-tile-size-limit --no-tile-compression -f produce-clearmap/clearmaptile/0-0-0.mbtiles
scp -i XXX(path to your ssh key) -r ./produce-clearmap/clearmaptile/clearmap-zxy/* (username)@(hostingserver):/home/vectortile/hosting/coesite3/public/temp/clearmapVT-zxy