var express = require('express');
var router = express.Router();

function printResults(){

}

/* GET home page. */
router.get('/', function(req, res, next) {
// print queue dash

  res.render('index', { title: 'Express' });
});

router.post('/print', function(req, res, next) {
  // print selected resource
});

//todo: make post
router.get('/dock', function(req, res, next) {
  // fetch and compare data

  // run related content

  // compile and format data for view

  // send compiled view to print queue
});

module.exports = router;
