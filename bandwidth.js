/**
 * Created by pratyush on 21/4/16.
 */
/**

 Send a GET Request

 so for example

 */


(function () {

    var BASE_URL = '/' ,
        STATIC_URI = 'images/',
        URI = ['128481', '128482','128483','128484','128485','128486','128487','128488','128489','128490'],
        SINGLE_DATA = '128486',
        EXT = '.jpg',
        NO_OF_DATA_POINTS = 9,
        BANDWIDTH_REFRESH_INT_MINS = 2.5,
        SIZE_TIME_ARRAY = [],
        SESSION_BW_KEY = 'ck-bw-web',
        SESSION_BW_TS = 'ck-bw-expiry-ts',
        PARALLEL_REQUESTS = false

        URI = URI.map(function (uri) {
            return BASE_URL +STATIC_URI+ uri + EXT
        });

    var SINGLE_URI =  BASE_URL+ SINGLE_DATA + EXT


    function refreshBandwidthData() {
        if (URI.length >0){

                callForStaticAssets()

        }else{
            var req = new XMLHttpRequest()
            req.onreadystatechange = function () {
                if (req.readyState === XMLHttpRequest.DONE && req.status == 200) {
                    console.log(req.response)
                    URI = JSON.parse(req.response)
                    URI = URI.map(function (uri) {
                        return BASE_URL +STATIC_URI+ uri + EXT
                    });

                    callForStaticAssets()

                }
            };
            req.open('GET',BASE_URL+'list',true);
            req.send()
        }

    }

    function callForStaticAssets(){
        SIZE_TIME_ARRAY = [];

        if (window.XMLHttpRequest) {
            if(PARALLEL_REQUESTS){

                SIZE_TIME_ARRAY = Array.apply(null, new Array(NO_OF_DATA_POINTS)).map(function () {
                    return {
                        size: 0,
                        time: Date.now()
                    }
                })

                for (var i = 0; i < NO_OF_DATA_POINTS; i++) {

                    (function (index, req) {
                        sendHTTPRequest(req, index)

                    })(i, new XMLHttpRequest())
                }
            }else{
                callSeqHTTPRequest()
            }
        }
    }


    function callSeqHTTPRequest(i){
        i  =  i || 0 ;

        SIZE_TIME_ARRAY[i] = {
            size : 0,
            time:Date.now()
        }

        if(i <  NO_OF_DATA_POINTS){


            (function (index, req) {
                sendHTTPRequest(req, index)

            })(i, new XMLHttpRequest())
        }
    }


    function sendHTTPRequest(req,index){
        req.open('GET', URI[index]+'?'+Date.now(), true)
        req.onreadystatechange = function () {
            return processXMLResponse(req, index)
        };
        req.send()
    }

    function processXMLResponse(req, index) {
        if (req.readyState === XMLHttpRequest.DONE && req.status == 200) {

            try {
                // console.log(req.getAllResponseHeaders())
                var size = req.getResponseHeader('Content-Length')
                SIZE_TIME_ARRAY[index].size = size
                SIZE_TIME_ARRAY[index].time = Date.now() - SIZE_TIME_ARRAY[index].time

            } catch (e) {
                console.error(e)
                SIZE_TIME_ARRAY[index].size = 0
                SIZE_TIME_ARRAY[index].time = 0

            } finally {
                //will decide later what needs to be done
                if (index == NO_OF_DATA_POINTS - 1) {
                    calculateBandwidth()
                }
                if(!PARALLEL_REQUESTS)
                callSeqHTTPRequest(index+1)
            }
        }
    }


    function calculateBandwidth() {
        // console.log(JSON.stringify(SIZE_TIME_ARRAY))
        console.log(`Number of requests is `,SIZE_TIME_ARRAY.length)
        var sumOfSizes = SIZE_TIME_ARRAY.reduce(function (prevVal, currentVal, currentIndex) {
            prevVal += parseFloat(SIZE_TIME_ARRAY[currentIndex].size)
            return prevVal
        },0)

        var sumOfTimesTaken = SIZE_TIME_ARRAY.reduce(function (prevVal, currentVal, currentIndex) {
            prevVal += SIZE_TIME_ARRAY[currentIndex].time
            return prevVal
        },0)

        if ((sumOfTimesTaken > 0) && !isNaN(sumOfSizes)) {
            console.log('sum of time taken %d and size %d    ',sumOfTimesTaken, sumOfSizes)
            var bandwidth = ((( sumOfSizes*8) / (1024 * 1024)) / ( sumOfTimesTaken / 1000 )).toFixed(2)//this is bytes in miliseconds, so convert them into Mb and second

            // persistInStorage(bandwidth)
            raiseEventForBWCalculation(bandwidth)


        } else {
            throw new Error('Unexpected error in bandwidth calculation ',sumOfSizes, sumOfTimesTaken)
        }
    }


    function persistInStorage(val) {
        sessionStorage.setItem(SESSION_BW_KEY, val)
        sessionStorage.setItem(SESSION_BW_TS, Date.now())
    }


    function checkExpiry() {
        var persistedBWTimestamp = sessionStorage.getItem(SESSION_BW_TS)
        if (!persistedBWTimestamp) {
            return true
        }

        return (Date.now() - persistedBWTimestamp) > BANDWIDTH_REFRESH_INT_MINS * 60 * 1000
    }


    function raiseEventForBWCalculation(val) {
        //TODO Based on how things are to be raised to reach
        console.log('bandwidth is %s Mbps ',val)

        var myEvent = new CustomEvent("CONTENT_LOADED");
        document.dispatchEvent(myEvent)
    }


    if (checkExpiry()) {
        refreshBandwidthData()
    } else {
        var val = sessionStorage.getItem(SESSION_BW_KEY)
        //raise a custom event or something for the application to listen to and act accordingly
        raiseEventForBWCalculation(val)
    }


    //start  a interval to constantly poll and calculate bandwidth the request data , not sure why that is needed

    // var interval = setInterval(refreshBandwidthData, BANDWIDTH_REFRESH_INT_MINS * 60 * 1000)

})()