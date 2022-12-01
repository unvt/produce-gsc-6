node produce-gsc-small/index_un-s.js
#node produce-gsc-small/index_osm-s.js
node produce-gsc-small/index_osm-s-compact.js
/usr/local/bin/tile-join --no-tile-size-limit -f -o small_tiles/unosm/small-scale.mbtiles produce-gsc-small/un-s-tile/0-0-0.mbtiles produce-gsc-small/osm-s-tile/0-0-0.mbtiles
scp -i XXX(path to your ssh key) -r ./small_tiles/unosm/small-scale.mbtiles (username)@(hostingserver):(path)/mbtiles/unosm