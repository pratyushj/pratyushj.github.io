let map =  {
    'bw1':'Bandwidth Method I (Round Time in Front End) *',
    'bw2':'<strong>Bandwidth Method II (Service Worker + Resource Timing API Calculation At SW ) **</bold>',
    'bw3':'Bandwidth Method III (Service Worker + Resource Timing API at Application ) **'
}

var bwBucketMap =  {
    GPRS : 'GRPS ( 500ms, 50kb/s, 20kb.s)',
    R2G : 'Regular 2G(300ms, 250kb/s, 50kb/s)',
    G2G :'Good 2G(150ms, 450kb/s, 150kb/s)',
    R3G :'Regular 3G(100ms, 750kb/s, 250kb/s)',
    G3G :'Good 3G(40ms, 1.5Mb/s, 750kb/s)',
    R4G :'Regular 4G(20ms, 4.0Mb/s, 3.0Mb/s)',
    DSL :'DSL(5ms, 2.0Mb/s, 1.0Mb/s)',
    WIFI :'WiFi(2ms, 30Mb/s, 15Mb/s)',
}

let LEFT_FACTOR = localStorage.getItem('LEFT_FACTOR') || 0.0,
    RIGHT_FACTOR = localStorage.getItem('RIGHT_FACTOR') || 1.0, 
    BW_OPTION_TYPE  = localStorage.getItem('BW_OPTION_TYPE');

let getElementById = (ele) => {
    return document.getElementById(ele)
}

getElementById('slider1').addEventListener('change', function(e){
        LEFT_FACTOR  = e.target.value;
        localStorage.setItem('LEFT_FACTOR',LEFT_FACTOR);
        getElementById('labelForslider1').innerHTML = LEFT_FACTOR
})

getElementById('slider2').addEventListener('change', function(e){
        RIGHT_FACTOR  = e.target.value;
        localStorage.setItem('RIGHT_FACTOR',RIGHT_FACTOR)
        getElementById('labelForslider2').innerHTML = RIGHT_FACTOR
})

getElementById('slider1').value = LEFT_FACTOR;
getElementById('slider2').value = RIGHT_FACTOR;
getElementById('labelForslider1').innerHTML = LEFT_FACTOR
getElementById('labelForslider2').innerHTML = RIGHT_FACTOR

  
let getTemplate  =  (data)=>{
    var text =  map[data.ele]
    // <td>${data.bandWidth_GM}</td>
    return `<td>${text}</td>
            <td>${data.totalSize}</td>
            <td>${data.totalTime}</td>
            <td>${data.length}</td>
            <td>${data.bandwidth}</td>
            <td>${data.bandWidth_AM}</td>
            <td>${data.duration}</td>
            <td>${data.browserBlock}</td>
            <td>${data.latency}</td>`
}

let optionTemplate =  (val)=>{
    return `<select id='requestOptionID' class='option' value='${val}'>
                    <option ${val == true ?'selected':''} value='true'>Parallel Request</option>
                    <option ${val == false ?'selected':''} value='false'>Sequential Request</option>
            </select>`
}

let bandWidthOptionTemplate  =  (val)=>{
     return `<select id='bwOptionID' class='option' value='${val}'>
            <option>--Select A bandwidth Bucket</option>`+
                    Object.keys(bwBucketMap).map(key =>{
                        return `<option ${val == key ?'selected':''} value=${key}>${bwBucketMap[key]}</option>`
                    })+
            `</select>`
}

let numberTemplate  =  (val) => {
    return `<input type='number' id='requestNumID' placeholder="Enter Nunber Of Requests" value='${val}'/>`
}


let filterData  = (bandWidthArr) =>{
    //TODO Jave Stopped Sorting
    // bandWidthArr.sort(function(a,b){
    //     return parseFloat(a) -  parseFloat(b)
    // })
    let len =  bandWidthArr.length;
    var minIndex = Math.floor(len*LEFT_FACTOR),
        maxIndex =  Math.floor(len*(RIGHT_FACTOR)); 
    // bandWidthArr = bandWidthArr.slice(minIndex, maxIndex);
    console.log(bandWidthArr)
    // console.log('maxIndex', maxIndex, 'minIndex', minIndex)
        let bwSum =  0;
        for ( let i =0; i < bandWidthArr.length ; i++){
                bwSum += bandWidthArr[i]
        }

    return (bwSum/(maxIndex - minIndex)).toFixed(2)
}


let addMbpsFactor = (val, factor) =>{
    return (val*factor).toFixed(2)
}

let convertMsToSeconds  = (val) =>{
    return val/1000;
}

let calculateBandWidth =  function(data,ele){
	var totalSize = 0,
        totalTime = 0,
        duration  = 0,
        browserBlock = 0,
        latency =  0,
        bandWidth_GM =  1,
        bandWidthArr =  [],
        factor =  (8*1000)/ (1024*1024),
        bandWidth_AM;

    if( Array.isArray(data)){
    	data.forEach( (res) => {
    		totalTime +=  parseInt(res.totalTime); // responseEnd - requestStart
    		totalSize += parseInt(res.totalSize);  // size
            duration  += parseInt(res.duration);   // duration
            browserBlock += parseInt(res.browserBlock); // requestStart - startTime
            latency   += parseInt(res.latency)          // responseStart - requestStart
            res.startTime  = res.startTime || 0;
            bandWidth_GM *= res.totalSize/res.totalTime // Geometric Mean of 
            bandWidthArr.push(parseFloat(res.totalSize/res.totalTime));
            // console.log(`Bandwidth is ${(res.totalSize*8*1000/(1024*1024* res.totalTime)).toFixed(2)} Mbps at ${res.startTime.toFixed(2)} ms`)
    	})
    }else{
    	throw new Error(`${typeof data} type is not handled for calculation of bandwidth`)
    }


        totalSize  = (totalSize/(1024*1024)).toFixed(2); 
        totalTime  = convertMsToSeconds(totalTime);
        duration  = convertMsToSeconds(duration);
        browserBlock  =  convertMsToSeconds(browserBlock);
        latency  =  convertMsToSeconds(latency);
        bandWidth_GM  = addMbpsFactor(Math.pow(bandWidth_GM, 1/data.length) , factor );
        bandWidth_AM  = addMbpsFactor(filterData(bandWidthArr), factor);


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
        ele,
        bandWidth_GM,
        bandWidth_AM
    })

    getElementById(ele).innerHTML = template;
    return {
        arr  : bandWidthArr.map(val=>val*factor),
        bandwidth
    };
};

Events.on('BW_FALLBACK', function(data){
	var bwArr =  calculateBandWidth(data, 'bw1');
    

})
Events.on('BW_SW', function(data){
	var bwArr =  calculateBandWidth(data, 'bw2')
    displayBandwidthChart(bwArr.arr);
    window.calcBW =  bwArr.bandwidth
})
Events.on('BW_SW_RES', function(data){
    calculateBandWidth(data, 'bw3')
	getElementById('bwContainer').style.display = 'inline-block';
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
    NO_OF_DATA_POINTS = localStorage.getItem('NO_OF_DATA_POINTS') ||  25,
    PARALLEL_REQUESTS = (localStorage.getItem('PARALLEL_REQUESTS')  == 'true' )|| false;

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
    PARALLEL_REQUESTS = ( localStorage.getItem('PARALLEL_REQUESTS')  == 'true' ) || PARALLEL_REQUESTS;


    getElementById('optionContainer').innerHTML =  optionTemplate(PARALLEL_REQUESTS)

    getElementById('numberContainer').innerHTML =  numberTemplate(NO_OF_DATA_POINTS)

    getElementById('bandwidthContainer').innerHTML =  bandWidthOptionTemplate(BW_OPTION_TYPE)

    getElementById('requestOptionID').addEventListener('change',function(){
            PARALLEL_REQUESTS =   getElementById('requestOptionID').value == 'true' || false;
            localStorage.setItem('PARALLEL_REQUESTS', PARALLEL_REQUESTS);
            postInit()
    })

    getElementById('bwOptionID').addEventListener('change', function(){
        BW_OPTION_TYPE = getElementById('bwOptionID').value || BW_OPTION_TYPE;
        localStorage.setItem('BW_OPTION_TYPE',BW_OPTION_TYPE)
    })

    getElementById('requestNumID').addEventListener('change', function(){
            NO_OF_DATA_POINTS =   getElementById('requestNumID').value || 10;
            localStorage.setItem('NO_OF_DATA_POINTS', NO_OF_DATA_POINTS);
            postInit()
    })
    getElementById('clearBwHistory').addEventListener('click', function(){
        clearPrevBwData()
    })
    getElementById('saveCurrentBW').addEventListener('click', function(){
        persistCurrentBw()
    })//
    getElementById('drawHistoricalBW').addEventListener('click', function(){
        drawHistoricalGraph()
    })
}


// on load make a call to fetch assets 
window.addEventListener('load', function(e){
        init();
        postInit();    
})


let clearTables =  ()=>{

    var arr = ['bw1', 'bw2', 'bw3'];

    arr.forEach( val =>{
        getElementById(val).innerHTML = ''        
    })
}


let postInit = () =>{
    Events.emit('LOAD')
    let numOfIterations =  Math.floor(NO_OF_DATA_POINTS/URI.length);
    let extraEntries =  NO_OF_DATA_POINTS%URI.length

    for( let i = 0; i < numOfIterations-1 ; i++ ){
        URI =  URI.concat(URI)
    }

    if ( extraEntries > 0 ){
        URI = URI.concat(URI.slice(0, extraEntries))
    }

    clearTables()

    fetchStaticAssets()
   
}

let clearPrevBwData =  ()=>{
    localStorage.removeItem('bwHistory')
}

let persistCurrentBw =  ()=>{
    /**
        {
          "GPRS":[0.5,0.6],
          "G2G":[]  
        }
    */
    let existingData =  localStorage.getItem('bwHistory')
    try{
        existingData = JSON.parse(existingData); //should be an object
        if(typeof existingData != 'object'  && existingData != null){
            existingData  ={}
        }
        var bwType =  getElementById('bwOptionID').value;
        if(!bwType){
            alert('no BandWidth bucket selected for making comparisons');
            return;
        }
        if(existingData[bwType]){ // if exists
            if(!Array.isArray(existingData[bwType])){
               existingData[bwType] =  [];
            }
             existingData[bwType].push(window.calcBW) //TODO get the value 
        }else{ //if does not exist
            existingData[bwType] =  [];
            existingData[bwType].push(window.calcBW) //TODO get the value 
        }
        localStorage.setItem('bwHistory', JSON.stringify(existingData))
    }catch(e){
        console.log(e);
        // alert(e.message)
        if(!bwType)return
        var history =  `{ "${bwType}": ["${window.calcBW}"]}`;
        console.log(history)
        localStorage.setItem('bwHistory',history)
    }
    
}
let  getRandomColor  =  ()=>{
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
let drawHistoricalGraph = ()=>{
    var storageData = localStorage.getItem('bwHistory');
        try{
            storageData =  JSON.parse(storageData);
            if( typeof storageData == 'object' && storageData != null){


                 var ctx = document.getElementById("bwChart"),
                     maxLen =  1;
                 var datasets  =  Object.keys(bwBucketMap).map(val=>{
                                let data =  storageData[val] || [];
                                if(data.length > maxLen){
                                    maxLen = data.length;
                                }
                                return {
                                    fillColor : getRandomColor(),
                                    strokeColor : getRandomColor(),
                                    label:bwBucketMap[val],
                                    data ,
                                    backgroundColor : 'transparent',
                                    borderColor: getRandomColor(),
                                    pointBorderColor: getRandomColor(),
                                    pointBackgroundColor: getRandomColor(),
                                    pointBorderWidth: 1,
                                    pointHoverRadius: 5,
                                    pointHoverBackgroundColor: "rgba(75,192,192,1)",
                                    pointHoverBorderColor: "rgba(220,220,220,1)",
                                    pointHoverBorderWidth: 2,
                                    pointRadius: 1,
                                    pointHitRadius: 10,
                                    lineTension: 0
                                }
                         })
                 var options   =  {
                    type: 'line',
                    xLabel: 'Index',
                    yLabel:'Bandwidth',
                   
                    data : {
                         datasets :datasets  ,
                         labels: Array.apply(null, new Array(maxLen)).map( (val, idx)=>{return idx+1}),
                         backgroundColor : 'transparent',
                    },
                  
                    
                    options: {
                        responsive :true,
                        maintainAspectRatio : true,
                        scales: {
                            type:'linear',
                            yAxes: [{
                                ticks: {
                                    beginAtZero:true
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: 'BandWidth'
                                }
                            }],
                            xAxes : [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Index'
                                }
                            }]
                        }
                    }
                };
                    var myChart = new Chart(ctx,options);

            }else{
                console.log(`storage type is not object but `, typeof storageData)
            }
        }catch(e){
            console.error(e)
        }

   
}


let displayBandwidthChart =  (arr)=>{
    var ctx = document.getElementById("myChart");
    var options =  {
    type: 'line',
   
    data : {
         labels: Array.apply(null, new Array(arr.length)).map( (val, idx)=>{return idx+1}),
         datasets : [{
            label:'Bandwidth Per Resource',
            data : arr,
            lineTension:0
        }],
    },
  
    
    options: {
        responsive :true,
        maintainAspectRatio : true,
        scales: {
            type:'linear',
            yAxes: [{
                ticks: {
                    beginAtZero:true
                },
                scaleLabel: {
                    display: true,
                    labelString: 'BandWidth'
                }
            }],
            xAxes :[{
               scaleLabel: {
                    display: true,
                    labelString: 'Index'
                } 
            }]
        }
    }
}
var myChart = new Chart(ctx, options);
}
