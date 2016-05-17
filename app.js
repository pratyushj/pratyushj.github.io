/**
 *  First check if the resource Timing API then use it
 *  Else use serviceWorker
 *  Else use nothing
 *
 */

if ('serviceWorker' in navigator) {

    navigator.serviceWorker.register('./ServiceWorker.js', {scope: '/'}).then(function (registration) {

        console.log('SW registered for the scope ', registration.scope)

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


    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            name: 'RELOAD_INIT',
            time: 6000
        });
    } else {
        console.warn(' service worker not installed yet')
    }

    var container = document.getElementById('container');

    if (container) {
        // appendImages(container)
    } else {
        console.error('container div not available')
    }

    function appendImages(container) {
        var arr = ['128481.jpg', '128482.jpg', '128483.jpg', '128484.jpg', '128485.jpg', '128486.jpg', '128487.jpg', '128488.jpg', '128489.jpg', '128490.jpg'];
        var path = '/images/';
        var imgElement;
        arr.forEach(function (img) {
            imgElement = document.createElement('img');
            imgElement.src = path + img;
            imgElement.style.display = 'none'
            container.appendChild(imgElement)
        })
    }
}

navigator.serviceWorker.addEventListener('message', function (event) {
    var eventData = event.data;

    switch (eventData.msgName) {

        case 'BW_CALC':
            console.log('Bandwidth calculation is ', eventData.data)
            break;
        default:

            break;
    }
});