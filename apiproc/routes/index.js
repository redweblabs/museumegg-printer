var express = require('express');
var router = express.Router();
var request = require('request');
var path = require('path');
var printer = require('printer');
var fs = require('fs');
var webshot = require('webshot');

var admin = require("firebase-admin");

admin.initializeApp({
    credential: admin.credential.cert(path.join(__dirname, '../', 'config/') + "supersweetcreds.json"),
    databaseURL: "https://smhack-159507.firebaseio.com"
});

var auth = admin.auth();
var db = admin.database();
var data = db.ref();

var fire = false;

/// printer
data.limitToLast(1).on("child_added", function(snapshot) {
    if(fire === true){
        console.log(snapshot.key, snapshot.val());
    } else {
        fire = true;
    }

    var sample = [
        {
            '25571:44527':
                {
                    time: 36,
                    score: 320.83333333333337,
                    timestamp: 1487702956369,
                    counter: 36
                }
        },
        {
            '4681:49931':
                {
                    time: 40,
                    score: 308.33333333333337,
                    timestamp: 1487702909560,
                    counter: 40
                }
        },
        {
            '35635:47204':
                {
                    time: 37,
                    score: 295,
                    timestamp: 1487702893115,
                    counter: 37
                }
        }
    ]
});

var dataCache = {};

function printResults(file) {

    printer.printFile({
        filename: file,
        success: function (jobID) {
            console.log("sent to printer with ID: " + jobID);
        },
        error: function (err) {
            console.log(err);
        }
    });
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
                        var randImg,
                            imageSize = 'large',
                            landscape = false;

                        randImg = images[Math.floor(Math.random() * images.length)];

                        landscape = widthCheck(randImg.processed.large);

                        // only re check once
                        if (landscape === false) {
                            randImg = images[Math.floor(Math.random() * images.length)];
                        }

                        var newRes = {
                            name: item.attributes.summary_title,
                            description: item.attributes.description_primary,
                            image: buildImg(randImg.processed.large)
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
});

router.get('/print', function (req, res, next) {

    // print selected resource

		// Normalize the dwell times relative to 100
	  // Move to separate method / module
		// i.e. below
		let dwell_artifacts = [
			{ dwell: 100, colour: 'jet' },
			{ dwell: 40, colour: 'pink' },
			{ dwell: 30, colour: 'blue' }
		]

		let total = dwell_artifacts.reduce((t, y) => t + y.dwell, 0);
		let maxHeight = 500;

		let normalized_dwell = dwell_artifacts
			.map((artifact) => {
				let relative = ( 100 / total ) * artifact.dwell;
				artifact.dwell = ( maxHeight / 100 ) * relative;
				return artifact;
			});

		let viewModel = {
			result: {
				start_time: '9:30am',
				end_time: '10:30pm',
				dwell_artifacts: normalized_dwell,
				artifacts: [
					{ title: 'Example', description: 'Lorem Ipsum!', image_url: 'http://placehold.it/350x200', colour: 'jet' },
					{ title: 'Example', description: 'Lorem Ipsum!', image_url: 'http://placehold.it/450x200', colour: 'pink' },
					{ title: 'Example', description: 'Lorem Ipsum!', image_url: 'http://placehold.it/550x200', colour: 'blue' }
				],
				secret: {
					title: 'Example', description: 'Lorem Ipsum!', image_url: 'http://placehold.it/250x200'
				},
				online_url: 'http://sci.mu/23X12'
			}
		};

		// End of Normalization

    res.render('printout', viewModel, function (err, html) {

        var printName = path.join(__dirname, '../', 'public/printouts/') + 'print' + Date.now() + '.png';

        webshot(html, printName, {
            siteType: 'html',
            screenSize: {
                width: 1200,
                height: 1800
            }
        }, function (err) {
            // printResults(printName);
        });

        res.send(html);
    });
});

module.exports = router;
