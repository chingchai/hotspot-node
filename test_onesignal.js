var sendNotification = function (data) {
    var headers = {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic MWE1YTIxNzgtMTZjMS00NzdhLWI4ZTktMDFmMzY1NDYyODNm"
    };

    var options = {
        host: "onesignal.com",
        port: 443,
        path: "/api/v1/notifications",
        method: "POST",
        headers: headers
    };

    var https = require('https');
    var req = https.request(options, function (res) {
        res.on('data', function (data) {
            console.log("Response:");
            console.log(JSON.parse(data));
        });
    });

    req.on('error', function (e) {
        console.log("ERROR:");
        console.log(e);
    });

    req.write(JSON.stringify(data));
    req.end();
};

var message = {
    app_id: "79500f59-2cca-4a08-bfff-7d36712b6ec8",
    contents: {
        "en": "English Message"
    },
    included_segments: ["All"]
};

sendNotification(message);