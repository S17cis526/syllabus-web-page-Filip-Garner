/**
 * @module multipart
 * A module for processing multipart HTTP requiests
**/

"use strict;"

module.exports={//choose what to export from this javascript file... data, functions, and classes etc.
	multipartBody
}

const DOUBLE_CRLF = Buffer.from([0x0D,0x0A,0x0D,0x0A]);//bytes composing a double CRLF

/**
 *
 *@function multipartBody
 * Takes a request and responce object,
 * parses the body of the multipart request
 * and attaches its contents to the request object.
 * If an error occurs, we log it and send a 500 status code.
 * Otherwise we invoke 'next' with the request and response.
 */
 function multipartBody(req,res,next){
	 var chunks = [];
	 
	 req.on('error',function(err){
		 console.log(err);
		 res.statusCode=500;
		 statusMessage= "Server error";
	 });
	 
	 req.on('data',function(chunk){
		 chunks.push(chunk);
	 });
	 
	 req.on('end',function(){
		 //TODO -----> var boundary= req.headers["ContentType"];
		 var buffer = Buffer.concat(chunks);
		 
		 var match =/boundary(.+);?/.exec(req.headers['content-type']);
		 
		 if(match && match[1]){
			 processBody(body,match[1],function(err,contents){
				 if(err){
					 console.log(err);
					 res.statusCode=500;
					 res.statusMessage="Server error";
					 res.end();
				 }
				 
				 req.body=contents;
				 
				 next(req,res);
			 });
		 }else{
			 console.error("No multipart boundary defined.");
			 req.statusCode=400;
			 req.statusMessage="Malformed multipart request";
			 res.end();
		 }
	 });
 }
/**
 * @function processBody
 * Takes a buffer and a boundary and
 * 'returns' an associative array of
 * key/value pairs; if content is a file,
 * value will be an object with properties filename, contentType
 * and data
 */
 
 function processBody(buffer,boundary, callback){
	 var formData={};
	 splitContentParts(buffer,boundary).forEach(function(content){
		 parseContent(content,function(err,parts){
			 if(err)return callback(err);
			 formData[parts[0]]=parts[1];
		 });
	 });
	 callback(false,formData);
 }

 
 //split contents goes here...
 
 /** @function parseContent
  * Parses a content section and returns
  * the key/value pair as a two-element array
  */
 function parseContent(content, callback){
	 var index = content.indexOf(DOUBLE_CRLF);
	 var head = content.slice(0,index).toString();
	 var body = content.slice(index+4,buffer.length-index-4);//double crlf takes 4 bytes to 'get past' (the end point is calculated based on the number of steps to the end from where it starts)
	 var name = /name "([\w\d\-_])"/.exec(head);//regular expression to extract the name of a variable looks for content that matches a name = letters or numbers or - or _content
	 var filename = /filename="([\w\d\-_\.]+)"/.exec(head);
	 var contentType = /Content-Type: ([\w\d\/]+)/.exec(head);
	 
	 if(!name) return callback("Content without name");
	 var headers ={};
	 head.split(CRLF).forEach(function(line){
		 var parts=line.split(': ');
		 var key= parts[0].toLowerCase();
		 var value=parts[1];
		 headers[key]=value;
		 
		 
	 });
	 if(filename){//filename is null if no file is found
		 //have file
		 callback(false,[name[1], {//use callback function for return
			 filename: filenam[1],
			 contentType: (contentType)?contentType[1]:'application/octet-stream',//()? asks a question 'if statement' in this case checking if content type actually exists...alternative responce comes after the ':' character
			 data: body//keep body as buffer
		 }]);//end of callback
	 }else{
		 //have value
		 callback(false,[name[1], body.toString()]);//returns the matching component from name paired with body value (convert body from buffer to string to minimize confusion)
	 }
 }