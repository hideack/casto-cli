'use strict';

var step = require('step'),
    colors = require('colors'),
    request = require('request'),
    fs = require('fs'),
    http = require('http');

var MAX_FILE_SIZE = 1024 * 1024;

var core = {};

core.showLog = function() {
  console.log("    ______                  __".green);
  console.log("   / ____/ ____ _   _____  / /_  ____".green);
  console.log("  / /     / __ `/  / ___/ / __/ / __ \\".green);
  console.log(" / /___  / /_/ /  (__  ) / /_  / /_/ /".green);
  console.log(" \\____/  \\__,_/  /____/  \\__/  \\____/".green);
  console.log("");
  console.log(" Live coding in browse, using text editor.".grey);
  console.log("");
}

core.start = function(fileName, program) {
  this.showLog();
  var pthis = this;

  fs.stat(fileName, function(err, stats){
    if (err) {
        console.log(fileName + " not found...");
        process.exit(1);
    } else {
      if (stats.size > MAX_FILE_SIZE) {
        console.log(fileName + " file size too large....");
        process.exit(1);
      }

      pthis.main(fileName, program);
    }
  });
}

core.main = function(fileName, program) {

  request(
    {
      method: 'GET',
      uri: 'http://www.storyboards.jp/castoapi/token',
      json: true
    },
    function(error, response, body) {
      if (error) {
        console.log("Casto API connection failed...".underline.red);
        process.exit(1);
      }

      var castoToken = body.token;
      var castoUnique = body.unique;

      console.log("Casto API connection successful.".underline.green);
      console.log("> Code casting URL: http://ca.storyboards.jp/a/" + castoUnique);
      console.log("> Watch for changes on: " + fileName);
      console.log("");

      fs.watchFile(fileName, function(curr, prev) {

        step(
          function() {
            fs.readFile(fileName, 'utf8', this);
          },
          function(err, text) {
            request(
              {
                method: 'PUT',
                uri: 'http://ca.storyboards.jp/api/storyboards/-/castoapi/code/' + castoUnique,
                form: {
                  body: text,
                  token: castoToken,
                  filename: fileName.match(".+/(.+?)$")[1],
                  unique: castoUnique
                }
              },
              function (error, response, body) {
                if (!error) {
                  console.log("[UPDATE]".green + " Code updated.");
                } else {
                  console.log("[ERROR]".red + " Casto API connection error. Code updated failed...");
                }
              }
            );
          }
        );
      });
    }
  );

  var portNo = program.port;

  http.createServer(function(req, res) {
    res.writeHead(200);
    res.end('casto command line interface tool');
  }).listen(3000);

}

module.exports = core;

