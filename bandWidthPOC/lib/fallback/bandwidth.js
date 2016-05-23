/**
*  This is a fallback of serviceWorker 
*  we are mutating the send and onreadystateChange methods to listen all the requests going from 
*  javascript. Essentially all the  XHR Requests. Browser Requests are not possible to listen to in this method
*  It also passes a reference of Events Object. So , the application is going to ask for the data once the page has loaded.
*  THe problem is when to trigger the 'READY' event for this class to respond back with a response of the data it has intercepted.
*/


(function (send, Events) {
            bandWidthCache = [];

        XMLHttpRequest.prototype.send = function (data) {

            var readyStateChange = this.onreadystatechange

            if (readyStateChange) {
                this.onreadystatechange = function () {

                    if (this.readyState === XMLHttpRequest.DONE && this.status == 200) {
                        var totalTime = Date.now() - this.totalTime;
                        var totalSize = parseInt(this.getResponseHeader('Content-Length'));
                        if (totalSize) {
                            bandWidthCache.push({totalSize, totalTime})
                        }
                    }
                    return readyStateChange.call(this, arguments)
                }
            }
            this.totalTime = Date.now()
            send.call(this, data);
        };

        Events.on('READY', function(){
            Events.emit('BW_FALLBACK', bandWidthCache)
        })


})(XMLHttpRequest.prototype.send, Events);