(function () {
    'use strick';

    app.constant("endpoint", {
        "LocalAPI": "http://localhost:2325",
        "LiveAPI": "http://pinpieceapi.azurewebsites.net",
        "LocalMySqlAPI": "http://localhost:9113",
        "LiveMySqlAPI": "http://geogoapi.azurewebsites.net"
    }).constant("PinColor", {
        "info": "5bc0de",
        "success": "5cb85c",
        "warning": "f0ad4e",
        "danger": "d9534f",
        "primary": "337ab7",
    }).constant("defaultLocation", {
        "lat": -37.8141,
        "lng": 144.9633
    }).constant("pagination", {
        defaultPage: 1,
        row: 5
    });

})();