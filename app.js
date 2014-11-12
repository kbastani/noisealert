var express = require('express');
var Client = require('node-rest-client').Client;

// direct way
client = new Client();
var app = express();
app.use(express.logger());

// var http_handler = express.static(__dirname + '/');

app.get('/sendmessage/:number/:message', function(req, res) {



  // set content-type header and data as json in args parameter
  var args = {
    data: {
         "contacts": [
            req.params.number
         ],
         "text": req.params.message
      },
    headers:{"Content-Type": "application/json"}
  };

  console.log(args);

  client.post("https://api.sendhub.com/v1/messages/?username=2397388000&api_key=68e7ee440108b6bbbfadb4c3ab70f8feb3544075", args, function(data,response) {
        // parsed response body as js object
      console.log(data);
      // raw response
      console.log(response);
});
});

app.configure(function(){
  app.use('/assets', express.static(__dirname + '/assets'));
  app.use(express.static(__dirname + '/'));
});


var port = process.env.PORT || 5000;
app.listen(port, function() {
  console.log("Listening on " + port);
});
