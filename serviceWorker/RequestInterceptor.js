
/**
 *  In order to calculate the bandwidth we need to calculate size and time taken for it to download
 *   performance is more like
 *
 *
 */

var mapOfResponseSizeByResource  = {},
    timeout ;


let bandWidthCalculatorMiddleWare = function() {

    return function (response){

        if(response.status == 200  && response.ok ){

            var size = response.headers.get('Content-Length');

            _pushDataForBWCalculation(response.url, size)
        }

    }
}

let initialize =  function (time) {
    mapOfResponseSizeByResource =  {};
    if( typeof time != 'undefined' ){

        timeout  = setTimeout(() => {
            clearTimeout(timeout)
           calculateAndDispatchResourceData()
         },time)
     
    }

   
}

let calculateAndDispatchResourceData =  ()=>{
     dispatchMessageToAllClients({msgName: 'BW_CALC', data: _processResourceData()});
}

let _processResourceData = () => {
    var totalSize = 0,
        totalTime = 0,
        resources  =  performance.getEntriesByType('resource');

    resources.forEach((resource) => {
            if( !isNaN(parseInt(mapOfResponseSizeByResource[resource.name]))   || 'transferSize' in resource ){
                 totalSize += resource.transferSize || parseInt(mapOfResponseSizeByResource[resource.name]);
                totalTime  += resource.responseEnd - resource.responseStart
            }
    });
    return ((( totalSize*8) / (1024 * 1024)) / ( totalTime / 1000 )).toFixed(2)
};

let _pushDataForBWCalculation = (url, size) => {
    mapOfResponseSizeByResource[url] = size
};

