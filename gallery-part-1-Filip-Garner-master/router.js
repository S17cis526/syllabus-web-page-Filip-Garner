/** @module router */

module.exports=Router;

var url=include('url');

//index of associated routes and actions must match
function Router(){
	this._getRoutes=[];//holds an array of regular expressions associated with a 'get' route
	this._postRoutes=[];
}

function pathToRegularExpression(path){
	var tokens=path.split('/');//first split path into its parts to tell whether an 'id' is present or not
	// a ':' before the 'id' indicates a string to be captured 
	var keys = [];
	var parts = tokens.map(function(token){
		if(token.charAt(0)==":"){
			keys.push(token.slice(1));//stores the token after the ':' as a key for the variables
			return "(\\w+)" //double backslash used to ensure the string interprets a single actual slash entered
		}else{
			return token;
		}
	});
	var regexp = new RegExp('^' + parts.join('/')+'/?$');
	return{
		regexp: regexp,
		keys: keys//keys appear in the order they were present inside the regular expression
	}
}





//path is a string with extra syntax, some parts (such as the image info 'imagename') are placeholders for future variables
/*
restful routes convention
get resource/ -> index
post resource/ -> add
get resource/:id -> read
post resource/:id -> update
get resource/:id/destroy -> destroy
get resource/:id/edit -> edit
*/
Router.prototype.get=function(path, handler){
	var route = pathToRegularExpression(path);
	route.handler=handler;
	this._getRoutes.push(route); ;//regular expression
}

Router.prototype.post=function(path, handler){
	var route = pathToRegularExpression(path);
	route.handler=handler;
	this._postRoutes.push(route); ;//regular expression
}

Router.prototype.route=function(req,res){
	
	var urlParts = url.parse(req.url);
	
	switch(req.method){
		case 'get':
			for(var i=0;i<this._getRoutes.length; i++){
				var route=this._getRoutes[i];
				var match = route.regexp.exec(urlParts.pathname);
				if(match){
					req.params={};//match key names to matched regular expressions
					for(var j=1; j < matches.length; j++){
						req.params[route.keys[j-1]]=match[j];
					}
					return route.handler(req, res);
				}
			}
			res.statusCode=404;
			res.statusMessage="Resource not found"
			res.end();
			break;
		case 'post':
			for(var i=0;i<this._postRoutes.length; i++){

				var match = this._postRoutes[i].exec(urlParts.pathname);
				if(match){
					return this._postAction[i](req, res);
				}
			}
			res.statusCode=404;
			res.statusMessage="Resource not found"
			res.end();
			break;
		default:
			var msp= "Unkown method " +req.method;
			res.statusCode=400;
			res.statusMessage=msg
			console.error(msg);
			res.end(msg);
	}
}