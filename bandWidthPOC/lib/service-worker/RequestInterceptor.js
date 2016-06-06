
/**
 *  In order to calculate the bandwidth we need to calculate size and time taken for it to download
 *   performance is more like
 *
 *
 */


var RequestInterceptor = function(){
    this.mapOfResponseSizeByResource  = {};
}

RequestInterceptor.instance =  null;

RequestInterceptor.getInstance =  function(){
    if ( RequestInterceptor.instance == null){
        RequestInterceptor.instance =  new RequestInterceptor();
    }
    return RequestInterceptor.instance;
}

RequestInterceptor.prototype  =  {
    constructor: RequestInterceptor,
    initialize : function(time) {
        this.mapOfResponseSizeByResource =  {};
         performance.clearResourceTimings()
        if( typeof time != 'undefined' ){
            
            this.timeout  = setTimeout(() => {
                clearTimeout(this.timeout)
               this.calculateAndDispatchResourceData()
             },time)
        } 
    },
    _pushDataForBWCalculation : function(url, size){
       this.mapOfResponseSizeByResource[url] = size
    },
    _processResourceData : function(resources){
        resources =  resources || performance.getEntriesByType('resource') ;
        let resourceVal =  resources.map( resource => {
            let totalSize =  resource.transferSize || parseInt(this.mapOfResponseSizeByResource[resource.name]),
                totalTime =  resource.responseEnd - resource.requestStart,
                downloadTime =  resource.responseEnd - resource.responseStart
                return {
                      totalSize,
                      totalTime, 
                      downloadTime,
                      browserBlock : resource.requestStart - resource.startTime,
                      latency      : resource.responseStart - resource.requestStart,
                      duration : resource.duration,
                      digBW :  totalSize/totalTime,
                      startTime: resource.startTime

                }
        })
        return resourceVal.filter( (resource) =>{
            return resource.totalTime > 0 && resource.totalSize >0
        })


    },
    calculateAndDispatchResourceData :  function(data){
        return {msgName: 'BW_CALC', data: this._processResourceData(data)};
    },
    bandWidthCalculatorMiddleWare : function() {
        var self =  this;
        return function (response){

            if(response.status == 200  && response.ok ){

                var size = response.headers.get('Content-Length');
                self._pushDataForBWCalculation(response.url, size)
            }

        }
    }    
    
}



