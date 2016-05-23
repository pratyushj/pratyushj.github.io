/**
 * Events object is global at this moment. More so as a pub-sub system for the intra-app communication. 
 * No need for CustomEvent as it is heavier than light pub-sub Event system
 *
 */  
var Events = {
	events : {},
	on : function(event, callbackData){
		this.events[event] = this.events[event] || []; 
		this.events[event].push(callbackData)
	},

	emit : function(event, data){

		 if( Array.isArray(this.events[event])) {
		 	this.events[event].forEach( callbackData  => {

		 		if( typeof callbackData == 'object'){
		 			callbackData.fn.apply(callbackData.scope, data)
		 		}else if( typeof callbackData == 'function'){
		 		     callbackData(data)
		 		}else{
		 			// simply let it through 
		 		}
		 	})
		 }
	}
}