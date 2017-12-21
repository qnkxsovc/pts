var express = require('express');
var logger = require('morgan');
var Validator = require("jsonschema").Validator;
var config = require('config');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var path = require("path");

// session management

var sessStoreConfig = config.get("sessStoreConfig");
var questions_path = path.resolve(config.get("resources.questions"));

var app = express();

app.use(session({
  store: new RedisStore(sessStoreConfig),
  secret: config.get("sessSecret")
}))

try
{
  var questions = require("./" + questions_path);
}
catch(err)
{
  throw new Error("Questions.json could be found. Please provide its location in your configuration file. For more information, see README.");
}

var schema = {
  "type": "array",
  "items": {
    "type": "object",
    "required": [
      "text",
      "correlation"
    ],
    "properties": {
      "text": {
        "type": "string"
      },
      "correlation": {
        "type": "number"
      }
    }
  }
}

var v = new Validator();

if(!v.validate(questions, schema).valid)
{
	throw new Error(`Questions.json is formatted incorrecly. For more information, see README.`);
}

console.log(questions);

app.use(logger('dev'));
app.use(express.static('static'));

console.log("Environment: " + process.env.NODE_ENV);

app.get('/', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

var servPort = config.get("servPort");
app.listen(servPort, function () {
  console.log('Listening on http://localhost:' + servPort);
});
