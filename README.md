# PTS - Personality Testing System

## Getting Started
To get started, install all the required frontend and backend packages. **Note: you must also provide connection information for Redis and MySQL servers**
~~~
/* populate Questions.json and your configuration file */
npm install
bower install
npm run build
~~~

## Configuration
Your configuration file should be placed in config/ and follow the following format of the file config/default.json. **Make sure your NODE_ENV environment variable matches the name of the file (ex. Production.json => NODE_ENV=Production)**

## Question Specification
This program is built to reflect the research done by the People Matching Project, which has developed a list of questions to probe personalities along with each question's empirical correlation between friend pairs. When you run the build-form script, a Handlebars template generates the frontend form using questions from static/Questions.json. This file should be populated with a JSON array of questions and their correlation coefficients, matching the initial format of static/Questions.json.

## Making the Comparisons
When users take the survey, their answers are stored in whichever database is specified in the configuration file along with a copy of the information in static/Questions.json. Users' answers are converted to integers centered around zero (Strong no => -2, No => -1, n/a => 0, Yes => 1, Strong yes => 2). The recommend procedure for matching people is to multiply each of their answers' numerical values by that question's correlation (weight each answer) and compose a vector for each person where each component is that person's weighted answer. This can also be thought of as dedicating a dimension of each person vector to a specific question.

Then, use the clustering method of your choice to generate groups of people vectors. A member in each group "matches" with the other members of the group. Alternatively, if the sample size is small, the cosine similarity between every pair of people vectors may be used to give similarity measures between each person. This would allow for augmented resules (ie. "Who are you least similar to?" "How close are you to your best friends?" etc).
