/**
 * @module multipart
 * A module for processing multipart HTTP requests
 */
module.exports = multipart;

/* constants */
const CRLF = Buffer.from([0x0D,0x0A]);
const DOUBLE_CRLF = Buffer.from([0x0D,0x0A,0x0D,0x0A]);

/**
 * @function multipart
 * Takes a request and response object,
 * parses the body of the multipart request
 * and attaches its contents to the request
 * object.  If an error occurs, we log it
 * and send a 500 status code.  Otherwise
 * we invoke the next callback with the
 * request and response.
 * @param {http.incomingRequest} req the request object
 * @param {http.serverResponse} res the repsonse object
 * @param {function} next the next function in the req/res pipeline
 */
function multipart(req, res, next) {
  var chunks = [];

  // Handle error events by logging the error
  // and responding with a 500 server error
  req.on('error', function(err){
    console.log(err);
    res.statusCode = 500;
    res.statusMessage = "Server error";
    res.end("Server err");
  });

  // Handle data events by appending the new
  // data to the chunks array.
  req.on('data', function(chunk) {
    chunks.push(chunk);
  });

  // Handle end events by assembling the chunks
  // into a single buffer and passing that to the
  // processBody function, and sending its results
  // to the callback function.  Also, supply the
  // boundary bytes defined in our header.
  req.on('end', function() {
    // recombine our chunks into a single buffer
    var body = Buffer.concat(chunks);

    // extract the boundary from the Content-Type header
    var match = /boundary=(.+);?/.exec(req.headers['content-type']);

    // make sure we were able to get the boundary bytes
    if(match && match[1]) {
      processBody(body, match[1], function(err, contents){
        if(err) {
          console.log(err);
          res.statusCode = 500;
          res.statusMessage = "Server error";
          res.end();
        }

        // store the processed contents as the req.body parameter
        req.body = contents;

        // trigger the next callback with the modified req object
        next(req, res);
      });
    } else {
      // If we reach this point, we couldn't determine the boundary bytes
      console.error("No multipart boundary defined.");
      req.statusCode = 400;
      req.statusMessage = "Malformed multipart request";
      res.end();
    }
  });
}

/** @function processBody
 * Takes a raw HTTP mulitipart body buffer and a string
 * specifiying the multipart boundary bytes, separates and
 * parses the contents, which are then sent to the supplied
 * callback as an associative array with the multipart name
 * attribute as the key, and the contents as the value.  For
 * file contents, the value is an object with data, filename,
 * and contentType members.
 * @param {Buffer} buffer - the raw multipart body
 * @param {string} boundary - the boundary bytes
 * @param {function} callback - the callback function, which
 * takes two parameters, err and contents.
 */
function processBody(buffer, boundary, callback) {
  var formData = {};
  // split the contents into separate buffers
  splitContentParts(buffer, boundary).forEach(function(content){
    // parse each individual buffer into a key/value pair
    parseContent(content, function(err, parts){
      if(err) return callback(err);
      // save the parsed content as a key/value pair
      // in the formData associative array
      formData[parts[0]] = parts[1];
    });
  });
  callback(false, formData);
}

/** @function splitContentParts
 * breaks a raw multipart buffer into individual
 * content buffers by splitting on the supplied boundary
 * bytes.
 * @param {Buffer} buffer - the raw multipart body
 * @param {string} boundary - the boundary between content parts
 * @return {Array} The contents as separate buffers
 */
function splitContentParts(buffer, boundary) {
  var parts = [];
  var start = buffer.indexOf('--' + boundary) + boundary.length + 2;
  var end = buffer.indexOf(boundary, start);
  // invariant: the bytes between start and end
  // in buffer compose a content part. The value of
  // end must therefore be greater than start,
  // and both must fall between [0,buffer.length]
  while(end > start) {
    parts.push(buffer.slice(start, end));
    start = end + boundary.length;
    end = buffer.indexOf(boundary, start);
  }
  return parts;
}

/** @function parseContent
 * Parses a content section and returns
 * the key/value pair as a two-element array
 * @param {Buffer} buffer - the content buffer
 * @returns {Array} A key/value pair as a two-element
 * array.
 */
function parseContent(buffer, callback) {
  // the first instance of CRLF CRLF is the split
  // between the head and body sections of the
  // multipart content
  var index = buffer.indexOf(DOUBLE_CRLF);
  var head = buffer.slice(0, index).toString();
  var body = buffer.slice(index + 4, buffer.length - 4);

  // We need to parse the headers from the head section
  // these will be stored as an associative array
  var headers = {};
  head.split(CRLF).forEach(function(line){
    var parts = line.split(': ');
    var key = parts[0].toLowerCase();
    var value = parts[1];
    headers[key] = value;
  });

  // We expect all headers to have a Content-Disposition
  // header with a name attribute. If not, we have a
  // malformed header and can stop processing
  var name = /name="([^;"]+)"/.exec(headers['content-disposition']);
  if(!name) return callback("No name in multipart content header");

  // If our content is a file, we expect to see a filename
  // in the content-disposition header; if there isn't a filename,
  // then our body is a field value rather than a binary blob
  var filename = /filename="([^;"]+)"/.exec(headers['content-disposition']);
  if(filename) {
    // If our content is a file, there may be a Content-Type header
    var contentType = headers['content-type'];
    // If there is no Content-Type, use application/octet-stream
    if(!contentType) contentType = 'application/octet-stream';
    // send the key/value pair using the callback
    callback(false, [name[1], {filename: filename[1], contentType: contentType, data: body}]);
  } else {
    // send the key/value pair using the callback
    callback(false, [name[1], body.toString()]);
  }
}
