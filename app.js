/**
 *  First check if the resource Timing API then use it
 *  Else use serviceWorker
 *  Else use nothing
 *
 */

if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('./ServiceWorker.js').then(function (registration) {

        console.log('SW registered for the scope ', registration.scope);

    }).catch(function (err) {

        console.log('service woker failed', err)

    })

} else {

    console.warn('SW not available, ')

    var ts,
        bandWidthCache = [];

    (function (send) {

        XMLHttpRequest.prototype.send = function (data) {

            var readyStateChange = this.onreadystatechange

            if (readyStateChange) {
                this.onreadystatechange = function () {

                    if (this.readyState === XMLHttpRequest.DONE && this.status == 200) {
                        ts = Date.now() - ts;
                        var size = this.getResponseHeader('Content-Length');
                        if (size) {
                            bandWidthCache.push({size, ts})
                        }
                    }
                    return readyStateChange.call(this, arguments)
                }
            }
            ts = Date.now()
            send.call(this, data);
        };

    })(XMLHttpRequest.prototype.send);
}


let postMessageToServiceWorker = (msg) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        console.info('msg sent to SW -->', JSON.stringify(msg));
        var msg_chan = new MessageChannel();
        msg_chan.port1.onmessage = function(event){
             var eventData = event.data;

                switch (eventData.msgName) {

                    case 'BW_CALC':
                        console.log('Bandwidth calculated via SW is %s Mbps ', eventData.data)
                         document.getElementById('bw2').innerHTML = eventData.data
                        document.getElementById('bwContainer').style.display = 'block';
                        document.getElementById('bwLoader').style.display = 'none'
                        break;
                    default:

                        break;
                }
        }
        
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    } else {
        console.warn(' service worker not installed yet')
    }
}


window.addEventListener('load', function () {

    postMessageToServiceWorker({name: 'RELOAD_INIT'})

})




document.addEventListener('CUST_CONTENT_LOADED', function(e){
        e.preventDefault();
      let data =  performance.getEntriesByType('resource').map(resource => {
                        return {
                            name: resource.name,
                            transferSize : resource.transferSize,
                            responseEnd : resource.responseEnd,
                            responseStart : resource.responseStart
                        }
        })
        postMessageToServiceWorker({ name: 'CONTENT_LOADED',data})

        document.getElementById('bw1').innerHTML = e.detail.bw
},false)

navigator.serviceWorker.addEventListener('message', function (event) {
   
});