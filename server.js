var express = require('express');
var logger = require('morgan');
var Validator = require("jsonschema").Validator;
var config = require('config');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var mysql = require("mysql");
var path = require("path");

// --- Startup ---

var sessStoreConfig = config.get("sessStoreConfig");
var questions_path = path.resolve(config.get("resources.questions"));
var dbConfig = config.get("dbConfig");

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

// Verify the database has the correct information on startup
var connectionPool = mysql.createPool(dbConfig);

connectionPool.getConnection(function(err, connection) {
  if(err)
  {
    throw new Error("Error connecting to the database " + err.stack); 
  }
  else
  {
    console.log("Successfully connected to the database.");
  }
  var updateQuestions = false;

  connection.query(`SELECT *  FROM information_schema.tables WHERE table_schema = '${dbConfig["database"]}' AND table_name = 'Questions' LIMIT 1;`, function (error, results, fields) {
      if (error) throw error;

      if(results.length == 0)
      {
        console.log("Warning: a new Questions table will be created in the database. It will be populated with the questions specificied by the configuration file.");

        connection.query("CREATE TABLE `Questions` (`id` int(11) unsigned NOT NULL AUTO_INCREMENT, `text` varchar(200) NOT NULL DEFAULT '', `r` float NOT NULL, PRIMARY KEY (`id`)) AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4;", function(error, results, fields) { if (error) throw error; });

        updateQuestions = true;
      }
      else
      {
        if(results.length == questions.length)
        {
          for(var i = 0, len = results.length; i < len; i++)
          {
            updateQuestions = !(results[i]["text"] == questions[i]["text"] && results[i]["r"] == questions[i]["r"]);
          }
        } else updateQuestions = true;
      }

      if(updateQuestions)
      {
        console.log("Warning: the database's questions do not match the questions provided, and will be overwritten.");
        connection.query("TRUNCATE TABLE Questions", function(error, results, fields) { if (error) throw error; });
        var queryString = "INSERT INTO Questions (text, r) VALUES " + questions.map(q => `('${q["text"]}', ${q["correlation"]})`).join();
        connection.query(queryString, function(error, results, fields) { if (error) throw error; });
      }
  });
  connection.release();
});




app.use(logger('dev'));
app.use(express.static('static'));

console.log("Environment: " + process.env.NODE_ENV);



// --- General ----
app.get('/', function (req, res, next) {
    res.sendFile(path.join(__dirname, 'Index.html'));
});

var servPort = config.get("servPort");
app.listen(servPort, function () {
  console.log('Listening on http://localhost:' + servPort);
});
