let map =  {
    'bw1':'Bandwidth Method I (Round Time in Front End) *',
    'bw2':'Bandwidth Method II (Service Worker + Resource Timing API Calculation At SW ) **',
    'bw3':'Bandwidth Method III (Service Worker + Resource Timing API at Application ) **'
}

let getElementById = (selector) => {
	return document.getElementById(selector)
}    
let getTemplate  =  (data)=>{
    var text =  map[data.ele]
    return `<td>${text}</td>
            <td>${data.totalSize}</td>
            <td>${data.totalTime}</td>
            <td>${data.length}</td>
            <td>${data.bandwidth}</td>
            <td>${data.duration}</td>
            <td>${data.browserBlock}</td>
            <td>${data.latency}</td>`
}

let optionTemplate =  (val)=>{
    return `<select id='requestOptionID' value='${val}'>
                    <option selected='${val?'selected':''}' value='true'>Parallel Request</option>
                    <option selected='${!val?'selected':''}' value='false'>Sequential Request</option>
            </select>`
}

let numberTemplate  =  (val) => {
    return `<input type='number' id='requestNumID' placeholder="Enter Nunber Of Requests" value='${val}'/>`
}





let calculateBandWidth =  function(data,ele){
	var totalSize = 0,
        totalTime = 0,
        duration  = 0,
        browserBlock = 0,
        latency =  0;

    if( Array.isArray(data)){
    	data.forEach( (res) => {
    		totalTime +=  parseInt(res.totalTime);
    		totalSize += parseInt(res.totalSize);
            duration  += parseInt(res.duration);
            browserBlock += parseInt(res.browserBlock);
            latency   += parseInt(res.latency)
            res.startTime  = res.startTime || 0
             console.log(`Bandwidth is ${(res.totalSize*8*1000/(1024*1024* res.totalTime)).toFixed(2)} at ${res.startTime.toFixed(2)} ms`)
    	})
    }else{
    	throw new Error(`${typeof data} type is not handled for calculation of bandwidth`)
    }
        totalSize  = (totalSize/(1024*1024)).toFixed(2); 
        totalTime  = totalTime/1000;
        duration  = duration/1000;
        browserBlock  =  browserBlock/1000;
        latency  =  latency/1000;

    console.log(`totalSize is ${totalSize} Mb and totalTime is ${totalTime} secs`) 
 	var bandwidth =   (totalSize*8/totalTime).toFixed(2)
 	console.log(`bandwidth calculated ${bandwidth}`);
 	

    var template = getTemplate({
        bandwidth,
        totalSize,
        totalTime,
        duration,
        browserBlock,
        latency,
        length : data.length,
        ele
    })

    getElementById(ele).innerHTML = template
};

Events.on('BW_FALLBACK', function(data){
	calculateBandWidth(data, 'bw1')
})
Events.on('BW_SW', function(data){
	calculateBandWidth(data, 'bw2')
})
Events.on('BW_SW_RES', function(data){
    calculateBandWidth(data, 'bw3')
	getElementById('bwContainer').style.display = 'block';
	getElementById('bwLoader').style.display =  'none';
})


/**
*  Actually App Area
*
*/

var BASE_URL = './' ,
    STATIC_URI = 'images/',
    URI = ['128481', '128482','128483','128484','128485','128486','128487','128488','128489','128490'],
    EXT = '.jpg',
    NO_OF_DATA_POINTS = localStorage.getItem('NO_OF_DATA_POINTS') ||  URI.length,
    PARALLEL_REQUESTS = localStorage.getItem('PARALLEL_REQUESTS') || false;

    URI = URI.map(function (uri) {
        return BASE_URL +STATIC_URI+ uri + EXT
    });


// send the XMLHttpRequest
function sendHTTPRequest(req,index){
        req.open('GET', URI[index]+'?'+Date.now(), true)
        req.onreadystatechange = function () {
            return processXMLResponse(req, index)
        };
        req.send()
}

// make sequential HTTP Requests 
function callSeqHTTPRequest(i){
        i  =  i || 0 ;

        if(i <  NO_OF_DATA_POINTS){


            (function (index, req) {
                sendHTTPRequest(req, index)

            })(i, new XMLHttpRequest())
        }
}

// Do a js call to make some network calls
function fetchStaticAssets(){
     
        if (window.XMLHttpRequest) {
        	// In case PARALLEL_REQUEST , make all the calls immediately 
            if(PARALLEL_REQUESTS){

                for (var i = 0; i < NO_OF_DATA_POINTS; i++) {

                    (function (index, req) {
                        sendHTTPRequest(req, index)

                    })(i, new XMLHttpRequest())
                }

            }else{
            	// In case of Seq Requests, make the calls one after the prev one has ended
                callSeqHTTPRequest()

            }
        }
}

// In case of Sequential Requests, it makes the call after receiving the response

function processXMLResponse(req, index) {

        if (req.readyState === XMLHttpRequest.DONE && req.status == 200) {
                if(!PARALLEL_REQUESTS){
                	callSeqHTTPRequest(index+1);
                }
                if(index == NO_OF_DATA_POINTS - 1){
                	Events.emit('READY')
                }
        }
}



let init  = ()=>{
    PARALLEL_REQUESTS = localStorage.getItem('PARALLEL_REQUESTS') || PARALLEL_REQUESTS

    getElementById('optionContainer').innerHTML =  optionTemplate(PARALLEL_REQUESTS)

    getElementById('numberContainer').innerHTML =  numberTemplate(NO_OF_DATA_POINTS)

    getElementById('requestOptionID').addEventListener('change',function(){
            PARALLEL_REQUESTS =   getElementById('requestOptionID').value || false;
            localStorage.setItem('PARALLEL_REQUESTS', PARALLEL_REQUESTS);
            postInit()
    })

    getElementById('requestNumID').addEventListener('change', function(){
            NO_OF_DATA_POINTS =   getElementById('requestNumID').value || 10;
            localStorage.setItem('NO_OF_DATA_POINTS', NO_OF_DATA_POINTS);
            postInit()
    })
}


// on load make a call to fetch assets 
window.addEventListener('load', function(e){
        init();
        postInit();
         Events.emit('LOAD')
})


let clearTables =  ()=>{

    var arr = ['bw1', 'bw2', 'bw3'];

    arr.forEach( val =>{
        getElementById(val).innerHTML = ''        
    })
}


let postInit = () =>{

    if ( NO_OF_DATA_POINTS > URI.length ){
        URI = URI.concat(URI.slice(0, NO_OF_DATA_POINTS- URI.length+1))
    }
    // console.log(URI)
   

    clearTables()

    fetchStaticAssets()
   
}