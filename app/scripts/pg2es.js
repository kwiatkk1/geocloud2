var pg = require('pg');
var nconf = require('nconf');
var request = require("request");
var winston = require('winston');
winston.add(winston.transports.File, { filename: '/var/www/geocloud2/public/logs/pg2es.log' });

nconf.argv();
var db = (nconf.get()._[0]);
var host = nconf.get("host") || "127.0.0.1";
var esHost = nconf.get("es-host") || "127.0.0.1";
var user = nconf.get("user") || "postgres";
var key = nconf.get("key") || null;
var pgConString = "postgres://" + user + "@" + host + "/" + db;

if (nconf.get("help") || !db) {
    console.log("usage:");
    console.log("  pg2es.js database [options]");
    console.log("Options:");
    console.log("  --host       PostGreSQL host. Default 127.0.0.1");
    console.log("  --user       PostGreSQL user. Default postgres");
    console.log("  --es-host    Elasticsearch host. Default 127.0.0.1");
    process.exit(1);
}

console.log("Listen on database: " + db + " @ " + host + " with user " + user);

pg.connect(pgConString, function (err, client) {
    if (err) {
        console.log(err);
    }
    client.on('notification', function (msg) {
        var uri, split = msg.payload.split(","), url;
        if (split[0] === "UPDATE" || split[0] === "INSERT") {
            uri = "upsert/" + db + "/" + split[1] + "/" + split[2] + "/" + split[3] + "/" + split[4];
        }
        if (split[0] === "DELETE") {
            uri = "delete/" + db + "/" + split[1] + "/" + split[2] + "/" + split[3];
        }
        url = "http://" + esHost + "/api/v1/elasticsearch/" + uri;
        if (key) {
            url = url + "?key=" + key;
        }
        request.get(url, function (err, res, body) {
            if (!err) {
                var resultsObj = JSON.parse(body);
                //console.log(resultsObj);
                winston.log('info', resultsObj.message, resultsObj);
            } else {
                winston.log('error', err);

            }
        });

    });
    var query = client.query("LISTEN _gc2_notify_transaction");
});