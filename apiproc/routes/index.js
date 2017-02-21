var express = require('express');
var router = express.Router();
var request = require('request');

var dataCache = {};

function printResults(){

}

function processAPI(cb, args){

  var items = [
    'co8421531',
    'co8359400',
    'co8232360',
    'co8427213',
    'co8401352',
    'co8058672',
    'co62321',
    'co34242'
  ];

  if(Object.keys(dataCache).length === 0){
    request({
      url:'https://collection.sciencemuseum.org.uk/search?filter%5Bhas_image%5D=true&filter%5Bmuseum%5D=Science%20Museum&filter%5Bgallery%5D=Information%20Age%20Gallery%3A%20Web&page%5Bsize%5D=50&page%5Btype%5D=search',
      headers : {
        accept: 'application/vnd.api+json'
      },
      gzip: true
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {

        var data = JSON.parse(body);
        var filteredData = data.data.filter(function(item){
          console.log(items.indexOf(item.id));
          if(items.indexOf(item.id) !== -1){
            return item;
          } else {
            return false;
          }
        });

        // console.log(filteredData);

        dataCache = filteredData;

        if(cb){
          cb.apply(null, args);
        }
      }
    });
  } else {
    if(cb){
      cb.apply(null, args);
    }
  }
}

router.use(function(res,req,next){
  processAPI(function(req, res, next){
    next();
  }, [req, res, next]);
})

/* GET home page. */
router.get('/', function(req, res, next) {
  // print queue dash
  res.render('printout', {title: 'I\'m going to be a PDF!!'})
});

router.post('/print', function(req, res, next) {
  // print selected resource
});

//todo: make post
router.get('/dock', function(req, res, next) {
  // fetch and compare data
  res.json(dataCache);


  // run related content
  // compile and format data for view

  // send compiled view to print queue
});

module.exports = router;
