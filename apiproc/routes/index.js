var express = require('express');
var router = express.Router();
var request = require('request');

var dataCache = {};

function printResults() {

}

function processAPI(cb, args) {

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

    if (Object.keys(dataCache).length === 0) {
        request({
            url: 'https://collection.sciencemuseum.org.uk/search?filter%5Bhas_image%5D=true&filter%5Bmuseum%5D=Science%20Museum&filter%5Bgallery%5D=Information%20Age%20Gallery%3A%20Web&page%5Bsize%5D=50&page%5Btype%5D=search',
            headers: {
                accept: 'application/vnd.api+json'
            },
            gzip: true
        }, function (error, response, body) {
            if (!error && response.statusCode == 200) {

                var data = JSON.parse(body);
                var filteredData = data.data.map(function (item) {
                    if (items.indexOf(item.id) !== -1) {
                        // item primary description
                        item.attributes.description.map(function (i) {
                            if (i.primary === true) {
                                item.attributes.description_primary = i.value;
                            }

                            return i;
                        });

                        function widthCheck(val) {
                            var width = 0;
                            var height = 0;
                            val.measurements.dimensions.forEach(function (dimen) {
                                if (dimen.dimension.toLowerCase() == 'width') {
                                    width = dimen.value;
                                } else {
                                    height = dimen.value;
                                }
                            });

                            return width > height;
                        }

                        function buildImg(img) {
                            var newImg = {};

                            var width = 0;
                            var height = 0;
                            img.measurements.dimensions.forEach(function (dimen) {
                                if (dimen.dimension.toLowerCase() == 'width') {
                                    width = dimen.value;
                                } else {
                                    height = dimen.value;
                                }
                            });

                            if (img.location.indexOf('http') !== -1) {
                                newImg.url = img.location;
                            } else {
                                newImg.url = 'http://smgco-images.s3.amazonaws.com/media/' + img.location;
                            }

                            newImg.width = width;
                            newImg.height = height;

                            return newImg;
                        }

                        // best image filtering
                        var images = item.attributes.multimedia;
                        var looper = true,
                            randImg,
                            imageSize = 'large';

                        do {
                            randImg = images[Math.floor(Math.random() * images.length)];
                            console.log(randImg.admin.id);
                            if (randImg.processed.large) {
                                landscape = widthCheck(randImg.processed.large);
                                break;
                            }
                            if (randImg.processed.medium) {
                                imageSize = 'medium';
                                landscape = widthCheck(randImg.processed.medium);
                                break;
                            }

                            // if (landscape) {
                                //looper = false;
                            // }
                        } while (true);

                        var newRes = {
                            name: item.attributes.summary_title,
                            description: item.attributes.description_primary,
                            image: buildImg(randImg.processed[imageSize])
                        };

                        // console.log(newRes);

                        return newRes;
                    } else {
                        return null;
                    }
                });

                dataCache = filteredData.filter(function (i) {
                    return i;
                });

                if (cb) {
                    cb.apply(null, args);
                }
            }
        });
    } else {
        if (cb) {
            cb.apply(null, args);
        }
    }
}

router.use(function (res, req, next) {
    processAPI(function (req, res, next) {
        next();
    }, [req, res, next]);
})

/* GET home page. */
router.get('/', function (req, res, next) {
    // print queue dash
    res.render('printout', {title: 'I\'m going to be a PDF!!'})
});

router.post('/print', function (req, res, next) {
    // print selected resource
});

//todo: make post
router.get('/dock', function (req, res, next) {
    // fetch and compare data
    res.json(dataCache);


    // run related content
    // compile and format data for view

    // send compiled view to print queue
});

module.exports = router;
