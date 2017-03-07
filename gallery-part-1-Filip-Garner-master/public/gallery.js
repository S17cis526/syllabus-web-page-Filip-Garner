//javascript for the gallery page

var title=document.getElementById('galler-title');
title.onclick=function(e){
	e.prevent();//prevents browser default behavior
	var form = document.getElementById('gallery-title-edit');
	form.styles.display='block';
}