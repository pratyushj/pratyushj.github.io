/**
 * Created by pratyush on 13/5/16.
 */

/**
 *  service worker  for intercepting each network request and give a standard
 *
 *
 */

importScripts('./serviceWorker/RequestInterceptor.js')
self.addEventListener('fetch', (event) => {

   var middleWare  =  bandWidthCalculatorMiddleWare();

    event.respondWith(
        fetch(event.request).then((response) => {
            middleWare(response)
            return response;

        }).catch((error)  => {
            console.error('Fetching failed:', error);
            throw error;
        })
    );
});
self.addEventListener('message', function(event){
    var eventData =  event.data
    console.log(eventData);
    var response = {};
    if( eventData.name  ==  'RELOAD_INIT'){
        initialize(eventData.time)
    }else if ( eventData.name == 'CONTENT_LOADED'){
        response = calculateAndDispatchResourceData(eventData.data)
    }else{

    }

     event.ports[0].postMessage(response);
});
self.addEventListener('install', function(event){
    console.log('service Worker Installed!');
});
self.addEventListener('activate', function(event){
    console.log('service Worker Activated!');
});

let dispatchMessageToAllClients  = (msg)  => {
    console.info('msg sent to document ->', JSON.stringify(msg))
    clients.matchAll().then(clients => {
        clients.forEach(client => {
            dispatchMessageToClient(client, msg).then(m => {
                console.log("Request Interceptor Received Message <---: "+m);
            });
        })
    })
}

let dispatchMessageToClient  = (client, msg) => {
    return new Promise(function(resolve, reject){

        var channel = new MessageChannel();

        channel.port1.onmessage = function(event){

            if(event.data.error){
                reject(event.data.error);
            }else{
                resolve(event.data);
            }
        };

        client.postMessage(msg, [channel.port2]);
    });
}
