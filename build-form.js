var Validator = require("jsonschema").Validator;
var handlebars = require("handlebars");
var fs = require("fs");
var path = require("path");
var config = require('config');

handlebars.registerHelper("inc", function(value, options)
{
    return parseInt(value) + 1;
});


var questions_path = path.resolve(config.get("resources.questions"));
var template_path = path.resolve(config.get("resources.template"));

try
{
	var questions = require("./" + questions_path); // USE CONFIG
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
	throw new Error("Questions.json is formatted incorrecly. For more information, see README.");
}

var texts = questions.map(q => q["text"]);
var source = fs.readFileSync("./" + template_path, "utf8");
var template = handlebars.compile(source);
var result = template({ "questions": texts });

fs.writeFileSync("./Static/Form.html", result);