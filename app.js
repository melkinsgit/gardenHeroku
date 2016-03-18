var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var engines = require ('jade');
var assert = require ('assert');
var bodyParser = require ('body-parser');

app = express();

app.set ('view engine', 'jade');
app.set ('views', __dirname + "/views");

app.use (express.static('public'));
app.use (bodyParser.urlencoded({ extended : true}));

// attempt to connect to MongoDB
MongoClient.connect("mongodb://localhost:27017/garden", function (err,db){
	assert.equal(null, err);  // crashes if error not null
	console.log("Connected to to MongoDB");
	
	// routes - this is for the home page
	app.get('/', function (req, res){
		db.collection('flowers').find({}, {"name":true, "color":true}).toArray(function(err, flowerdocs){
			if (err) {return res.sendStatus(500);}
			db.collection('flowers').distinct('color', function(err,colordocs){
				if (err) {return res.sendStatus(500);}
				return res.render('allflowers', {'flowers': flowerdocs, 'flowercolors':colordocs});
			});  // end of the distinct query
		});  // end of find query
	});  // end of main page
	
	// form handling route - when the user clicks on the show colors button that says Choose color
	app.get('/showColors', function(req,res){
		var color = req.query.colorDropDown;
		
		// get all flowers of desired color
		db.collection('flowers').find({"color":color}, {"name":true, "color":true}).toArray(function(err, docs){
			if (err) {return res.sendStatus(500);}
			db.collection('flowers').distinct('color', function(err,colordocs){
				if (err) {return res.sendStatus(500);}
				var displayColor = color.slice(0,1).toUpperCase() + color.slice(1,color.length);
				return res.render('allflowers', {'flowers': docs, 'flowercolors':colordocs, 'currentColor':displayColor});
			});  // end of the distinct query
		});  // end of find query
	});  // end of show colors button
	
	// displaying the details for a flower when a flower is clicked
	app.get('/details/:flower', function(req,res){
		var flowerName = req.params.flower;  // get value of the 'flower' name
		db.collection('flowers').find({'name':flowerName}).limit(1).toArray (function (err, docs){
			if (err) {console.log(err); return res.sendStatus(500);}
			if (docs.length != 1){
				return res.sendStatus(404);
			}
			return res.render('flowerDetails', docs[0]);
		});  // end of find
	});  // end of details
	
	// a post route for the data from the form
	// addNewFlower is the var name for the form action - or the form data
	app.post('/addNewFlower', function (req, res){
		// insert the data from the form and to a garden db flowers collection insert
		
		// get the flower name from the req data
		var flowerName = req.body.name;
		var flowerColor = req.body.color;
		flowerColor = flowerColor.toLowerCase();
		
		// TO DO how to handle this for the user
		if (flowerName === "" || flowerColor === ""){
			console.log('flower name or color is missing');
		}
		
		else {
		// search db garden collection flowers for all flowers of that name and put them in array
		db.collection('flowers').find({'name':flowerName}).toArray (function (err, docs){
			if (err) {console.log(err); return res.sendStatus(500);}  // handle error
			// if the resulting array has any elements, then the flower name already exists, but if there are no elements (array length is 0), then do the db garden collection flowers insert for that flower
			if (docs.length == 0){
				db.collection('flowers').insert(req.body, function(err, result) {
					if (err) { return res.sendStatus(500);}
				});  // end insert
			}  // end if
			// TO DO how to handle this for the user
			else {
			}  // end else
			return res.redirect('/');  // then redirect to main page, with or without new flower as appropriate
		});  // end of find to array docs
		console.log('making fix for heroku');
		}
	}); // end of post
	
	// all other requests, return 404 not found
	app.use (function(req, res){
		res.sendStatus(404);
	});
	
	// need option to 3010 for Heroku
	var port = process.env.PORT || 3000;
	
	// and start the server on any port you like
	var server = app.listen(port, function(){
		var port = server.address().port;
		console.log("Server listening on port " + port);
	});
	
});