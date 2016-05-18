
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

let calculateAndDispatchResourceData =  (data)=>{
     dispatchMessageToAllClients({msgName: 'BW_CALC', data: _processResourceData(data)});
}

let _processResourceData = (resources) => {
    var totalSize = 0,
        totalTime = 0;
        resourcesOnSW  =  performance.getEntriesByType('resource');
        resources  =  resources || resourcesOnSW ;
        // console.debug('on sw  resource size is %s and from web getting %s ', resourcesOnSW.length , resources.length)
    resources.forEach((resource) => {
            if( !isNaN(parseInt(mapOfResponseSizeByResource[resource.name]))   ||  typeof resource['transferSize'] != 'undefined' ){
                 totalSize += resource.transferSize || parseInt(mapOfResponseSizeByResource[resource.name]);
                totalTime  += resource.responseEnd - resource.responseStart
            }else{
                console.warn('size not defined for resource ', resource.name)
            }
    });
    return ((( totalSize*8) / (1024 * 1024)) / ( totalTime / 1000 )).toFixed(2)
};

let _pushDataForBWCalculation = (url, size) => {
    mapOfResponseSizeByResource[url] = size
};

