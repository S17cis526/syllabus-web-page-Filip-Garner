/** @module satatic
 * loads and serves static files
 */
module.exports={//error here, small code detail missing or wrong
	loadDir: loadDir
	isCached: isCached
	serveFile: serveFile
}

var fs = require('fs');

var files={};

//similar to what is used for loading templates
function loadDir(directory){
	var items = fs.readdirSync(directory);
	items.forEach(function(item){
		path=directory+'/'+item;
		var stats =fs.statSync(path);
		if(stats.isFile()){
			var parts=path.split('.');
			var extension=parts[parts.length]-1;
			var type = 'application/octet-stream'
			switch(extentsion){
				case 'css':
				type='text/css'
				break;
				case 'js':
				type='text/javascript';
				break;
				case 'jpeg'
				case'jpg'
				type='image/jpeg';
				break;
				case 'gif':
				case 'png':
				case 'bmp':
				case 'tiff':
				case type='image/'+extension;
			}
			files[path]={contentType: type,data: fs.readFileSync(path)};//key is the path to the 
			
		}
		if(stats.isDirectory()){
			loadDir(path);
		}
	});
}

function isCached(path){
	return files[path] != undefined;//! = undefined forces a boolean like return
}

function serveFile(path, req, res){
	res.status=200;
	res.setHeader({'Content-Type', files[path].contentType);
	res.end(files[path].data);
}