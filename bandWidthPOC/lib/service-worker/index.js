/**
 *  service worker for intercepting each network request from browser
 *
 *
 */

importScripts('./lib/service-worker/RequestInterceptor.js')

var RIInstance =  RequestInterceptor.getInstance()

// Invoked when a network request is sent  from the browser
self.addEventListener('fetch', (event) => {

   var middleWare  =  RIInstance.bandWidthCalculatorMiddleWare();

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

// Invoked for each message that comes from any other process/Document
self.addEventListener('message', function(event){
    var eventData =  event.data
    var response = {};
    if( eventData.name  ==  'RELOAD_INIT'){
        RIInstance.initialize(eventData.time)
    }else if ( eventData.name == 'CONTENT_LOADED'){
         response = {
             data:   RIInstance.calculateAndDispatchResourceData(),
             msgName: 'BW_CALC'
        }
        setTimeout( function(){
           event.ports[0].postMessage({
            data:   RIInstance.calculateAndDispatchResourceData(eventData.data),
            msgName: 'BW_CALC_RES'
           }); 
        })
    }else{
        console.warn('Message Name not defined/handled', eventData.name)
    }
     event.ports[0].postMessage(response);
});

// Invoked when the service worker is installed 
self.addEventListener('install', function(event){
    console.log('service Worker Installed!');
});

// Invoked when the service worker is invoked. 
self.addEventListener('activate', function(event){
    console.log('service Worker Activated!');
});


// In case you need to broadcast message to all the clients
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

// Dispatch a message to a particular client
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
