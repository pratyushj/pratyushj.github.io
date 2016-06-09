let displayTextByBWMethod =  {
    'bw1':'Bandwidth Method I (Round Time in Front End) *',
    'bw2':'<strong>Bandwidth Method II (Service Worker + Resource Timing API Calculation At SW ) **</bold>',
    'bw3':'Bandwidth Method III (Service Worker + Resource Timing API at Application ) **'
};
let INITIATED =  false;
// let displayTextByBWBucket =  {
//     GPRS : 'GRPS ( 500ms, 50kb/s, 20kb.s)',
//     R2G : 'Regular 2G(300ms, 250kb/s, 50kb/s)',
//     G2G :'Good 2G(150ms, 450kb/s, 150kb/s)',
//     R3G :'Regular 3G(100ms, 750kb/s, 250kb/s)',
//     G3G :'Good 3G(40ms, 1.5Mb/s, 750kb/s)',
//     R4G :'Regular 4G(20ms, 4.0Mb/s, 3.0Mb/s)',
//     DSL :'DSL(5ms, 2.0Mb/s, 1.0Mb/s)',
//     WIFI :'WiFi(2ms, 30Mb/s, 15Mb/s)',
// };
let displayTextByBWBucket =  {
    GPRS : 'GRPS',
    R2G : '2G',
    R3G :'3G',
    R4G :'4G',
    BB :'Braodband',
};

let displayTextByCronInterval =  {
        1  : '1 Min',
        2  : '2 Mins',
        5  :  '5 Mins',
        15 :  '15 Mins',
        30 :  '30 Mins',
        60 :  '1 Hour',
        120 : '2 Hours',
        720 : '6 Hours',
        1440 : '1 Day'
};

let LEFT_FACTOR = localStorage.getItem('LEFT_FACTOR') || 0.0, // TODO REMOVE IT
    RIGHT_FACTOR = localStorage.getItem('RIGHT_FACTOR') || 1.0, //TODO REMOVE IT
    BW_OPTION_TYPE  = localStorage.getItem('BW_OPTION_TYPE');

let CRON_STATUS =  'NOT_STARTED'  ;
let CRON_INTERVAL = 1;

let getElementById = (ele) => {
    return document.getElementById(ele)
}

// TODO REMOVE IT AS SLIDERS NOT BEING USED 
// *1
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

// *1 ENDS HERE
  
  /**
  *  Template for row of the table   
  *
  */
let getTemplate  =  (data)=>{
    var text =  displayTextByBWMethod[data.ele]
    // <td>${data.bandWidth_GM}</td>
    return `<td>${text}</td>
            <td class="hidden-xs">${data.totalSize}</td>
            <td class="hidden-xs">${data.totalTime}</td>
            <td class="hidden-xs">${data.length}</td>
            <td>${data.bandwidth}</td>
            <td class="hidden-xs">${data.download}</td>
            <td class="hidden-xs">${data.bandWidth_AM}</td>
            <td>${data.bandWidthByBoxWhiskers}</td>
            <td class="hidden-xs">${data.duration}</td>
            <td class="hidden-xs">${data.browserBlock}</td>
            <td class="hidden-xs">${data.latency}</td>`
};

/**
* Template for option of Request Types
*/
let optionTemplate =  (val)=>{
    return `<select id='requestOptionID' class='option' value='${val}'>
                    <option ${val == true ?'selected':''} value='true'>Parallel Request</option>
                    <option ${val == false ?'selected':''} value='false'>Sequential Request</option>
            </select>`
};

let statusTextById = {
    'START' : 'STARTED',
    'STOP'  : 'STOPPED',
    'NOT_STARTED':'NOT_STARTED'
}
let buttonText =  ['START', 'STOP'];

let cronStatusTemplate =  (status)=>{
    var statusTxt ,className;
     switch(status){
        case 'NOT_STARTED':
            statusTxt = 'START';
            className = 'btn btn-lg btn-success';
            break;
        case 'START':
            statusTxt =  'STOP';
            className = 'btn btn-lg btn-danger';
            break;
        case 'STOP':
            statusTxt =  'START';
            className = 'btn btn-lg btn-success'
            break;       
    }
    return `<td>Status : ${statusTextById[status]}
            </td>
            <td>
                <button class='${className}' value=${status} id='statusBtn'>${statusTxt}</button>
            </td>
            `
}

let cronIntervalTemplate =  (val)=>{
    return `
            <select  class="form-control" id='cronInterval'  value=${val}>`+
            Object.keys(displayTextByCronInterval).map(key=>{
                    return `<option  ${val == key ? 'selected':''} value=${key}>${displayTextByCronInterval[key]}</option>`
            })+`</select>`
}

/**
* Template for option of BandWidth Types
*/
let bandWidthOptionTemplate  =  (val)=>{
     // return `<select id='bwOptionID' class='option' value='${val}'>
     //        <option>--Select A bandwidth Bucket</option>`+
     //                Object.keys(displayTextByBWBucket).map(key =>{
     //                    return `<option ${val == key ?'selected':''} value=${key}>${displayTextByBWBucket[key]}</option>`
     //                })+
     //        `</select>`
     return `<div>` +Object.keys(displayTextByBWBucket).map(key =>{
              return `<button class='${val == key ? 'btn btn-lg btn-bw btn-info':'btn btn-lg btn-bw btn-default'}'  value=${key} />${displayTextByBWBucket[key]}</button>`
            }).join('') + `</div>`
}

/**
* Template for input field for Number Of Requests
*/

let numberTemplate  =  (val) => {
    return `<input type='number' id='requestNumID' placeholder="Enter Nunber Of Requests" value='${val}'/>`
}

/**
* Sorts the data and trims it on both side based on the LEFT_FACTOR and RIGHT_FACTOR
*/
let filterData  = (arr) =>{

    let bandWidthArr =  arr.slice(),
        len =  bandWidthArr.length,
        minIndex = Math.floor(len*LEFT_FACTOR),
        maxIndex =  Math.floor(len*(RIGHT_FACTOR)),
        bwSum =  0;
   
    bandWidthArr.sort(function(a,b){
        return parseFloat(a) -  parseFloat(b)
    })
    
    bandWidthArr = bandWidthArr.slice(minIndex, maxIndex);

    for ( let i =0; i < bandWidthArr.length ; i++){
            bwSum += bandWidthArr[i]
    }

    return (bwSum/(maxIndex - minIndex)).toFixed(2)
}

// adds a factor ideally used for converting the bytes per milisecond to MegaBitsPerSecond
let addMbpsFactor = (val, factor) =>{
    return (val*factor).toFixed(2)
}

// Convert Milliseconds to Seconds
let convertMsToSeconds  = (val) =>{
    return val/1000;
}


/**
* Box and Whiskers plot
*/

let boxAndWhiskersPlot  =  (arr, resourceData)=>{
    // sort the data 
    // Q1, Q2, Q3 
    // find Q3-Q1
    //
    let data  = arr.slice();  // The data is of bandwidth per index
    data.sort((a, b)=>{
        return parseFloat(a)- parseFloat(b);
    })
    let Q1  = data[Math.floor(data.length/4)],
        Q2  = data[Math.floor(data.length/2)],
        Q3  = data[Math.floor(data.length*3/4)],
        IQR = Q3- Q1,
        OUTLIER_LOW =  Q1 - 1.5*IQR,
        OUTLIER_HIGH =  Q3 + 1.5*IQR,
        totalTime = 0,
        totalSize = 0;

    resourceData.forEach( res =>{
        let discreteBW =  res.totalSize/res.totalTime;
        if(discreteBW > OUTLIER_LOW && discreteBW < OUTLIER_HIGH){
            totalTime += parseInt(res.totalTime);
            totalSize += parseInt(res.totalSize);
        }else{
            console.warn(`${discreteBW} is outlier`)
        }
    })
     let bw =  ((totalSize*8*1000)/(totalTime*1024*1024)).toFixed(2);
     console.log(bw) 
     return bw;
}

/**
* Calculates the bandwidth related data
*/
let calculateBandWidth =  function(data){
	var totalSize = 0,
        totalTime = 0,
        duration  = 0,
        browserBlock = 0,
        latency =  0,
        bandWidth_GM =  1,
        bandWidthArr =  [],
        downloadArr  =  [],
        totalDownloadTime = 0,
        factor =  (8*1000)/ (1024*1024),
        bandWidth_AM,
        bandWidthByBoxWhiskers = 0;

    if( Array.isArray(data)){

    	data.forEach( (res) => {
    		totalTime +=  parseInt(res.totalTime); // responseEnd - requestStart
            totalDownloadTime += parseInt(res.downloadTime); // downloadTime
    		totalSize += parseInt(res.totalSize);  // size
            duration  += parseInt(res.duration);   // duration
            browserBlock += parseInt(res.browserBlock); // requestStart - startTime
            latency   += parseInt(res.latency)          // responseStart - requestStart
            res.startTime  = res.startTime || 0;
            bandWidth_GM *= res.totalSize/res.totalTime // Geometric Mean of 
            bandWidthArr.push(parseFloat(res.totalSize/res.totalTime));
            downloadArr.push(parseFloat(res.totalSize/res.downloadTime));
    	})

    }else{
    	throw new Error(`${typeof data} type is not handled for calculation of bandwidth`)
    }


        totalSize  = (totalSize/(1024*1024)).toFixed(2); 
        totalTime  = convertMsToSeconds(totalTime);
        totalDownloadTime = convertMsToSeconds(totalDownloadTime);
        duration  = convertMsToSeconds(duration);
        browserBlock  =  convertMsToSeconds(browserBlock);
        latency  =  convertMsToSeconds(latency);
        bandWidth_GM  = addMbpsFactor(Math.pow(bandWidth_GM, 1/data.length) , factor );
        bandWidth_AM  = addMbpsFactor(filterData(bandWidthArr), factor);
        bandWidthByBoxWhiskers =  boxAndWhiskersPlot(bandWidthArr, data)


    console.log(`totalSize is ${totalSize} Mb and totalTime is ${totalTime} secs`) 
 	var bandwidth =   (totalSize*8/totalTime).toFixed(2),
         download  = (totalSize*8/totalDownloadTime).toFixed(2);
 	console.log(`bandwidth calculated ${bandwidth}`);

    return {
        arr  : bandWidthArr.map(val=>val*factor),
        downloadArray : downloadArr.map( val => val*factor),
        bandwidth,
        download,
        totalSize,
        totalTime,
        duration,
        browserBlock,
        latency,
        length : data.length,
        bandWidth_GM,
        bandWidth_AM,
        bandWidthByBoxWhiskers
    };
};




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


/**
* called on initialization. Does the binding of event listener and initial population of input parameters in control panel
*/
let init  = ()=>{
    INITIATED = true;
    PARALLEL_REQUESTS = ( localStorage.getItem('PARALLEL_REQUESTS')  == 'true' ) || PARALLEL_REQUESTS;


    getElementById('optionContainer').innerHTML =  optionTemplate(PARALLEL_REQUESTS)

    getElementById('numberContainer').innerHTML =  numberTemplate(NO_OF_DATA_POINTS)

    getElementById('bandwidthContainer').innerHTML =  bandWidthOptionTemplate(BW_OPTION_TYPE);

    getElementById('cronStatus').innerHTML =  cronStatusTemplate(CRON_STATUS);

    getElementById('cronIntervalContainer').innerHTML =  cronIntervalTemplate(CRON_INTERVAL);

    getElementById('requestOptionID').addEventListener('change',function(){
            PARALLEL_REQUESTS =   getElementById('requestOptionID').value == 'true' || false;
            localStorage.setItem('PARALLEL_REQUESTS', PARALLEL_REQUESTS);
            postInit()
    })
    document.querySelector('#bandwidthContainer').addEventListener('click', function(e){
        BW_OPTION_TYPE = e.target.value || BW_OPTION_TYPE;
        localStorage.setItem('BW_OPTION_TYPE',BW_OPTION_TYPE);
        this.innerHTML =  bandWidthOptionTemplate(BW_OPTION_TYPE);
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

    getElementById('cronStatus').addEventListener('click', function(e){
        let nextStatus  =  e.target.innerHTML;
        if(buttonText.indexOf(nextStatus)!=-1)
        updateCronStatus(nextStatus)
        //START
         

    })

    getElementById('cronInterval').addEventListener('change', function(e){
            let cronInterval =  e.target.value;
            console.log(cronInterval)
            CRON_INTERVAL = cronInterval;
            // START
            //startCron();
    })

    // Events binding on the action raised after XMLHttpRequest method
    Events.on('BW_FALLBACK', function(data){
        var bwArr =  addBandwidthToTable(data, 'bw1');
    })
    // Event Binding on Bandwidth I ( Service Worker + Request)
    Events.on('BW_SW', function(data){
        var val =  addBandwidthToTable(data, 'bw2')
        let bandWidthOptions  = {
            xLabelString : 'Index',
            yLabelString : 'Bandwidth',
            label        : 'Bandwidth Per Resource'
        }

        let downloadOptions =  {
            xLabelString : 'Index',
            yLabelString : 'Download Speed',
            label        : 'Download Speed Per Resource'
        }
        displayBandwidthChart(val.arr, getElementById("myChart"), bandWidthOptions);
        window.calcBW =  val.bandwidth;
        displayBandwidthChart(val.downloadArray, getElementById('downloadChart'), downloadOptions);
        // here you put a request to add it
        startCron();
    })
    // Event Binding on Bandwidth II
    Events.on('BW_SW_RES', function(data){
        addBandwidthToTable(data, 'bw3')
        getElementById('bwContainer').style.display = 'inline-block';
        getElementById('bwLoader').style.display =  'none';
    })
}


// on load make a call to fetch assets 
window.addEventListener('load', function(e){
    if(window.navigator.onLine){
        init();
        postInit();
    }else{
        alert('offline')
    }
            
})

let updateCronStatus  =  (val)=>{
    CRON_STATUS = val,flag = false;
   
        if(CRON_STATUS == 'STOP'){
                 flag = stopCron();
        }else if (CRON_STATUS == 'START'){
                flag =  startCron();
        }
        if(flag){
                if(CRON_STATUS == 'STOP'){
                    getElementById('cronInterval').disabled = false;
                }else if(CRON_STATUS == 'START'){
                    getElementById('cronInterval').disabled = true; 
                }
             getElementById('cronStatus').innerHTML =  cronStatusTemplate(CRON_STATUS)
        }
}

let addBandwidthToTable  = (data, ele) =>{
    var val =  calculateBandWidth(data);
    getElementById(ele).innerHTML =  getTemplate({
        bandwidth : val.bandwidth,
        download  : val.download,
        totalSize : val.totalSize,
        totalTime : val.totalTime,
        duration  : val.duration,
        browserBlock : val.browserBlock,
        latency : val.latency,
        length : val.length,
        bandWidth_GM : val.bandWidth_GM,
        bandWidth_AM : val.bandWidth_AM,
        bandWidthByBoxWhiskers : val.bandWidthByBoxWhiskers,
        ele
    })
    return val;
}

/**
* Clears the body of the table 
*/
let clearTables =  ()=>{

    var arr = ['bw1', 'bw2', 'bw3'];

    arr.forEach( val =>{
        getElementById(val).innerHTML = ''        
    })
}

/**
*  postInit clears the table, and fetchStaticAssets makes fresh network calls based on the number of data points 
*/
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

/**
* Clears the historically persisted bandwidth details. Should be called on action on clear all data button
*/
let clearPrevBwData =  ()=>{
    localStorage.removeItem('bwHistory')
}

/**
* Persist the current bandwidth value against the currently selected bandwidth bucket
*/
let persistCurrentBw =  ()=>{

    let existingData =  localStorage.getItem('bwHistory')
    try{
        existingData = JSON.parse(existingData); //should be an object
        if(typeof existingData != 'object'  && existingData != null){
            existingData  ={}
        }
        var bwType =  getElementById('bwOptionID').value;
        if(!bwType){
            alert('No BandWidth bucket selected for making comparisons');
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

/**
* Returns a random color code every time it gets called
*/
let  getRandomColor  =  ()=>{
  var letters = '0123456789ABCDEF'.split('');
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
* Draws the historical (persisted) bandwidth saved against the bandwidth bucket
*/
let drawHistoricalGraph = ()=>{
    let storageData = localStorage.getItem('bwHistory');
        try{

            storageData =  JSON.parse(storageData);

            if( typeof storageData == 'object' && storageData != null){


                 let ctx = getElementById("bwChart"),
                     maxLen =  1,
                     datasets  =  Object.keys(displayTextByBWBucket).map(val=>{
                                let data =  storageData[val] || [];
                                if(data.length > maxLen){
                                    maxLen = data.length;
                                }
                                return {
                                    fillColor : getRandomColor(),
                                    strokeColor : getRandomColor(),
                                    label:displayTextByBWBucket[val],
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
                         }),
                    options   =  {
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
                    
                    new Chart(ctx,options);

            }else{
                console.log(`storage type is not object but `, typeof storageData)
            }
        }catch(e){
            console.error(e)
        }

   
}

/**
* Plots the bandwidth against the index of each request
*/

let displayBandwidthChart =  (arr, ele, chartOptions)=>{
    let ctx = ele,
       options =  {
             type: 'line',
   
             data : {
                 labels: Array.apply(null, new Array(arr.length)).map( (val, idx)=>{return idx+1}),
                 datasets : [{
                    label: chartOptions.label,// 'Bandwidth Per Resource',
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
                            labelString: chartOptions.yLabelString,//'BandWidth'
                        }
                    }],
                    xAxes :[{
                       scaleLabel: {
                            display: true,
                            labelString: chartOptions.xLabelString, //'Index'
                        } 
                    }]
                }
             }
        }

    new Chart(ctx, options);
}



// Cron Area
let DATA_POST_URL =  'https://shielded-temple-27251.herokuapp.com/pushData';
let interval =  null;


// this should be called when there is check on the cron value 

function startCron (){

    stopCron();
    if(CRON_STATUS =='START'){
        interval =  setInterval(postInit,CRON_INTERVAL*60*1000 )
    }
    return pushData();

}

let stopCron =  ()=>{
    clearInterval(interval);
    interval  = null;
    return true;
}

function pushData (){
    let bwValue =  window.calcBW,
        bwType =  BW_OPTION_TYPE;
        if(CRON_STATUS != 'START')return 

    if ( !bwValue || !bwType) {
      alert(`${ bwType == null? 'Select A BW Bucket' : 'Please wait for bandwidth to be calculated'}`)
      return  
    };
        
    let req =  new XMLHttpRequest();

     req.open('POST', DATA_POST_URL, true)
     req.onreadystatechange = function () {
        
     };
     req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
     req.send(JSON.stringify({
        bwValue  ,
        bwType 
     }))
     return true;
}

window.addEventListener('offline', function(){
        stopCron();
        updateCronStatus('STOP');
}, false)

window.addEventListener('online', function(){
    if(!INITIATED){
        init();
        postInit();
    }
}, false)