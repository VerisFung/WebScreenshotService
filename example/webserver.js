var webserver = require('webserver').create();
webserver.listen(8080, function (request, response) {
    response.statusCode = 200;
    response.write('<html><h1>Hello World!</h1></html>');
    response.close();
});