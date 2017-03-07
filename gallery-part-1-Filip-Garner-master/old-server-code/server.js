/**
 * server.js
 * This file defines the server for a
 * simple photo gallery web app.
 */
var multipart=require('./multipart');
var template=require('./template');
var http = require('http');
var fs = require('fs');
var port = 3042;
var url=require('url');

//var title="Gallery";
//var defaultConfig={title: "Gallery"};//object literal-> title key, text title (not currently used)

//load cached files
var config= JSON.parse(fs.readFileSync('config.json'));//need JSON
var stylesheet=fs.readFileSync('gallery.css');//temporary comment out to identify how to hold in RAM

template.loadDir('templates');


//imageNames=['/chess','/fern','/bubble','/mobile','/ace'];

function getImageNames(callback){//callback function takes what is to be 'returned' 
	fs.readdir('images/',function(err,fileNames){//location of images directory (relative to this javascript) and a callback function built on the spot
		if(err) callback(err, undefined);
		else callback(false,fileNames);
	});
}
//var chess = fs.readFileSync('images/chess.jpg')::: example of storing data in RAM (caching) instead of reading the file everytime

function imageNamesToTags(fileNames){
	return fileNames.map(function(fileName){
		return '<img src="'+fileName+'" alt="'+fileName+'">';//change the image filenames to image tags readable by html
	});//use map to turn 
}

function serveImage(filename, req, res){
	fs.readFile("images/"+filename, function(err, data){//the function that catches errors also takes the body var->no 'var body=' is needed
		if(err){
			console.error(err);//error log instead of status log
			res.statusCode = 404;//indicates server error
			res.statusMessage = "Resource not found";
			res.end();
			return;
		}
		res.setHeader("Content-Type", "image/*");
		res.end(data);
	});//asynchronous read(allows many reads): includes function to handls error
}

function buildGallery(imageTags){
	return template.render('gallery.html');//no longer need distinct function here
	title:config.title
	imagetags:imageNamesToTags(imageTags).join(' ')
}
//old build gallery
/*
function buildGallery(imageTags){//replace the initial process of building gallery with this function
	var gHtml = imageNames.map(function(fileName){
	return ' <img src="'+fileName+'" alt="a fishing ace at work">'}).join('');
		var html = '<!doctype html>';
		html+='<head>';
		html+='	<title>'+config.title+'</title>';//title configuration from config title uploaded from file
		html+='	<link href="gallery.css" rel="stylesheet" type="text/css"';
		html+='</head>';
		html+='<body>';
		html+='	<h1>+config.title+</h1>';
		html+='	<form method="GET" action="">';//form to change title
		html+='  <input type="text" name="title">';
		html+='  <input type="submit" name="Change Gallery Title">';
		html+=' </form>';
		html+= imageNamesToTags(imageTags).join(' ');//note, the image tags are actually image filenames until imageNamesToTags changes them
		html+=' <form action="" method="POST" enctype="multipart/form-data">';//form to submit images
		html+='  <input type="file" name="image">';
		html+='  <input type="submit" name="Upload image">';
		html+=' </form>';
		html+='<body>';
		return html;
		
}*/

function serveGallery(req,res){//the switch case actually calls this. This will return either an error or proceed to use buildGallery
	getImageNames(function(err,imageNames){//building the callback function to be sent to getImageNames
		if(err){
			console.error(err);
			res.statusCode=500;
			res.statusMessage='Server error';
			res.end();
			return;
		}
		res.setHeader('Content-Type','text/html');
		res.end(buildGallery(imageNames));
	});
}

function uploadImage(req, res){//need a 'listener' to actually detect an upload
	multipart(req,res,function(req,res){
		//check that an image was actually uploaded
		console.log('filename',req.body.filename);
		if(!req.body.image.filename){
			console.error("No file in upload");
			res.statusCode=400;
			res.statusMessage="No file specified";
			res.end("No file specified");
			return;
		}
		fs.writeFile('images/'+req.body.image.filename,req.body.image.data,function(err){
			if(err){
				console.error(err);
				res.statusCode=500;
				res.statusMessage="Server Error";
				res.end("Server Error");
				return;
			}
			serveGallery(req,res);
		});
	});
	//old uploadImage code
	
	/*var body='';//to catch buffer data
	req.on('error',function(){
		res.statusCode=500;
		res.end();//more error response for user
	})//define a listening object to listen on the req object
	req.on('data', function(data){
		body+=data;//appends incoming data to body
	});
	req.on('end',function(){
		fs.writeFile('filename', body, function(err){
			if(err){
				console.error(err);
				res.statusCode=500;
				res.end();
				return;
			}
			serverGaller(req, res);
		})
	})*/
	
}//end of uploadImage

function handleRequest(req, res){
	var urlParts = url.parse(req.url);
	if(urlParts.query){
		var matches = /title=(.+)($|&)/.exec(urlParts.query);
		if(matches && matches[1]){
			config.title=matches[1];//decodeURIComponent(...) would be used here, but it does not seem to be supported on this version
			fs.writeFile('config.json',JSON.stringify(config));
		}
	}
	
	switch(urlParts.pathname){
		case '/':
		case '/gallery':
			if(req.method == 'GET'){
				serveGallery(req, res);
			}else if(req.method == 'POST'){
				uploadImage(req,res);
			}
			break;
		case '/gallery.css':
			res.setHeader('Content-Type','text/css');
			res.end(stylesheet);
			break;
		default:
			serveImage(req.url,req,res);
	}
}

var server = http.createServer(handleRequest);
server.listen(port,function(){
	console.log("Server is listening on port ",port);
});



//old server switch code, note multiple 'layers' of older code are commented out within
/*
var server = http.createServer(function(req,res){
	//at most two parts: url before '?' and query after
	var urlParts = url.parse(req.url);
	//var resource =url[0];
	//var queryString = url[1];//query string to deal with 'form' inputs and or queries (holds the query) (decode)
	
	
	if(urlParts.query){//check if query is defined or exists
		var matches=/title=(.+)($|&)/.exec(urlParts.query);//captures the 'pattern' of characters input and from that puts it in title in this instant
		//capture everything except periods and end on '&' (^ start of line) ($ end of line)
		if(matches && matches[1]){//match 0 is the full string, match 1 is the first actual 'capture' that qualifies
			title=matches[1];//attempt to properly interpret matches if it has spaces etc. (set title to matches)... potential code to apply on matches-> decodeURIcomponent(matches[1])
			fs.writeFile('config.json',
				JSON.stringify(config)//update the configuration
			);//write a javascript object as a text file -json- 
		}
	}
	
	
	switch(urlParts.pathname){//switch statement to handle different url requests (urlParts holds an array from the original input string, 
	//the pathname part holds the actual url we want)
	case '/':
	case '/gallery':
		if(req.method == 'GET'){
		serveGallery(req,res);
		}else if(req.method =='POST'){
			uploadPicture(req,res);//similar to serve gallery but built for uploading image
		}
		
		break;
	case '/gallery.css':
		res.setHeader('Content-Type','text/css');
		res.end(stylesheet);
		break;
		*//*//old image serving setup
	case "/chess":
	case "/chess/":
	case "/chess.jpg":
	case "/chess.jpeg":
		serveImage('chess.jpg',req,res);
		break;
	case "/fern":
	case "/fern/":
	case "/fern.jpg":
	case "/fern.jpeg":
		serveImage('fern.jpg',req,res);
		break;
	case "/bubble":
	case "/bubble/":
	case "/bubble.jpg":
	case "/bubble.jpeg":
		serveImage('bubble.jpg',req,res);
		break;
	case "/mobile":
	case "/mobile/":
	case "/mobile.jpg":
	case "/mobile.jpeg":
		serveImage('mobile.jpg',req,res);
		break;
	case "/ace":
	case "/ace/":
	case "/ace.jpg":
	case "/ace.jpeg":
		serveImage('ace.jpg',req,res);
		break;
		*//*
	default:
		serveImage(req.url,req,res);//new method of serving individual images. Note the user MUST input the filename as a .jpg with no extra / for this to work
	/*old default	
	default:
		res.statusCode=404;
		res.statusMessage = "Not found";
		res.end();*//*
	}
	
});
*/