/** @ module template
 * A module for rendering html templates
 */
"use strict";
 
var fs =require('fs');
 
module.exports={
	render: render,
	loadDir: loadDir
}
 
var templates ={};
 
/** @function loadDir
 * Loads the specified directory of templats
 * and caches them for later use of render().
 * @param {string} directory -the directory to load
 */
function loadDir(directory){
	var dir = fs.readdirSync(directory);
	dir.forEach(function(file){
		var path = directory+'/'+file
		var stats = fs.statSync(path);
		if(stats.isFile()){
			templates[file]=fs.readFileSync(path).toString();
		}
	});
}
 
 
/** @function render
 * Renders the supplied template using the supplied
 * context object.
 * @param {string} template - the name of the template to * render, i.e. 'gallery.html'
 * @param {object} context - the context (varialbles) to 
 * use in rendering
 * @return the template as an HTML snippet
 */
function render(template, context){
	return templates[template].replace(/<%=(.*)%>/g,function(match,code){
		return eval('var context = ' +JSON.stringify(context)+';'+code);
    });
}