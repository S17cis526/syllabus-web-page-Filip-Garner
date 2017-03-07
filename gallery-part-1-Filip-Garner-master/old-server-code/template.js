/**@module template
 */
module.exports={
	 render: render
}
 
var fs=require('fs');
var templates={};//cache of templates
 
 /**@function loadDir
  *Loads a directory of templates/
  *@param {string} directory
  */
function loadDir(directory){
	var dir=fs.readdirSync(directory);
	dir.forEach(function(file){
		var path = directory+'/'+file;
		var stats=fs.statSync(path);
		if(stats.isFile()){
			templates[file]=fs.readFileSync(path).toString();
		}
	});
}
  
  
/**@funciton render
 *Renders a template with embedded javascript
 *@param {string} templateName - the template to render
 *@param {context}
 */
function render(templateName, context){
	 
	return fs.readFileSync('templates/'+templateName+'.html');
		return templates[templateName].replace(/<%=(.+)%>/g,function(match, js){
		return eval.call("var context = "+JSON.stringify(context)+";"+js);
		}).exec();//evaluates a string as a javascript code with a list of objects stored in 'context' -note some code is missing here-
	});//'g' after the /()/ means this replace is done globally
	return html;
}