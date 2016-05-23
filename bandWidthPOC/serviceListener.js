/**
 *  First check if the resource Timing API then use it
 *  Else use serviceWorker
 *  Else use nothing
 *
 */

if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('./serviceWorker.js').then(function (registration) {

        console.log('SW registered for the scope ', registration.scope);

    }).catch(function (err) {

        console.log('service woker failed', err)

    })

} else {

    console.warn('SW not available, ')
}


let postMessageToServiceWorker = (msg) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        console.info('msg sent to SW -->', JSON.stringify(msg));
        var msg_chan = new MessageChannel();
        msg_chan.port1.onmessage = function(event){
             var eventData = event.data;

                switch (eventData.msgName) {

                    case 'BW_CALC':
                        // console.log('Bandwidth calculated via SW is %s Mbps ', eventData.data)
                        Events.emit('BW_SW', eventData.data.data);
                        break;
                    case 'BW_CALC_RES':
                        Events.emit('BW_SW_RES', eventData.data.data)
                        break;
                    default:
                   
                }
        }
        
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    } else {
        console.warn(' service worker not installed yet')
    }
}



// document.addEventListener('CUST_CONTENT_LOADED', function(e){
//         e.preventDefault();
//       let data =  performance.getEntriesByType('resource').map(resource => {
//                         return {
//                             name: resource.name,
//                             transferSize : resource.transferSize,
//                             responseEnd : resource.responseEnd,
//                             responseStart : resource.responseStart
//                         }
//         })
//         postMessageToServiceWorker({ name: 'CONTENT_LOADED',data})
// },false)

Events.on('LOAD', function(){
     postMessageToServiceWorker({name: 'RELOAD_INIT'})
})

Events.on('READY', function(){
      let data =  performance.getEntriesByType('resource').map(resource => {
        console.log(resource)
                        return {
                            name: resource.name,
                            transferSize : resource.transferSize,
                            responseEnd : resource.responseEnd,
                            responseStart : resource.responseStart,
                            connectEnd    : resource.connectEnd,
                            connectStart  : resource.connectStart,
                            domainLookupEnd : resource.domainLookupEnd,
                            domainLookupStart : resource.domainLookupStart,
                            duration: resource.duration,
                            fetchStart : resource.fetchStart,
                            redirectEnd: resource.redirectEnd,
                            redirectStart: resource.redirectStart,
                            requestStart: resource.requestStart,
                            secureConnectionStart : resource.secureConnectionStart,
                            startTime: resource.startTime,
                            workerStart: resource.workerStart
                        }
        })
        postMessageToServiceWorker({ name: 'CONTENT_LOADED',data})
})

navigator.serviceWorker.addEventListener('message', function (event) {
   
});

// startTime 