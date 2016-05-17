/**
 *  First check if the resource Timing API then use it
 *  Else use serviceWorker
 *  Else use nothing
 *
 */

if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('./ServiceWorker.js', {scope: '/'}).then(function (registration) {

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

window.onload = function () {

    postMessageToServiceWorker({name: 'RELOAD_INIT'})
    
}


let postMessageToServiceWorker = (msg) => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(msg);
    } else {
        console.warn(' service worker not installed yet')
    }
}

document.addEventListener('CONTENT_LOADED', function(){
        postMessageToServiceWorker({ name: 'CONTENT_LOADED'})
})

navigator.serviceWorker.addEventListener('message', function (event) {
    var eventData = event.data;

    switch (eventData.msgName) {

        case 'BW_CALC':
            console.log('Bandwidth calculated via SW is %s Mbps ', eventData.data)
            break;
        default:

            break;
    }
});