window.onload =  function(){
	var itemName = 'item';
	var count = sessionStorage.getItem(itemName) || 0;

	count++;
	document.querySelector('#counter').innerHTML =  count;
	sessionStorage.setItem(itemName, count);
	document.querySelector('#newWindowID').onclick  = function(){
		window.open('./app.html') ;
		e.stopPropagation();
		return false;
	}

}