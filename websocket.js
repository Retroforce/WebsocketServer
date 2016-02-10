// http://ejohn.org/blog/ecmascript-5-strict-mode-json-and-more/
"use strict";

// Optional. You will see this name in eg. 'ps' or 'top' command
process.title = 'node-chat';

// Port where we'll run the websocket server
var webSocketsServerPort = 8001;

// websocket and http servers
var webSocketServer = require('websocket').server;
var http = require('http');

/**
 * Global variables
 */
// latest 100 messages
var history = [ ];
// list of currently connected clients (users)
var clients = [ ];

/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function broadcastMessage(name, message, type) {
 
    var obj = {
        time: (new Date()).getTime(),
        text: htmlEntities(message),
        author: name
    };
                    
    history.push(obj);
    history = history.slice(-100);

    // broadcast message to all connected clients
    var json = JSON.stringify({ type: type, data: obj });
    for (var i=0; i < clients.length; i++) {
        clients[i].sendUTF(json);
    }
}

// Array with some colors
var colors = [ 'red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange' ];
// ... in random order
colors.sort(function(a,b) { return Math.random() > 0.5; } );

/**
 * HTTP server
 */
var server = http.createServer(function(request, response) {
    // Not important for us. We're writing WebSocket server, not HTTP server
});

server.listen(webSocketsServerPort, function() {
    console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
});

/**
 * WebSocket server
 */
var wsServer = new webSocketServer({
    // WebSocket server is tied to a HTTP server. WebSocket request is just
    // an enhanced HTTP request. For more info http://tools.ietf.org/html/rfc6455#page-6
    httpServer: server
});

// This callback function is called every time someone
// tries to connect to the WebSocket server
wsServer.on('request', function(request) {
    
    console.log((new Date()) + ' Connection from origin ' + request.origin + '.');

    // accept connection - you should check 'request.origin' to make sure that
    // client is connecting from your website
    // (http://en.wikipedia.org/wiki/Same_origin_policy)
    var connection = request.accept(null, request.origin); 
    // we need to know client index to remove them on 'close' event
    var index = clients.push(connection) - 1;
    var userName = false;
    var userColor = false;

    console.log((new Date()) + ' Connection accepted.');

    // send back chat history
    if (history.length > 0) {
        connection.sendUTF(JSON.stringify( { type: 'history', data: history} ));
    }
    
    // user sent some message
    connection.on('message', function(message) {

        console.log(message.utf8Data);
        console.log(clients);
        var json = JSON.stringify(message.utf8Data); 
        connection.sendUTF(JSON.stringify(clients));

//        if (message.type === 'utf8') { // accept only text
//            
//            var key = message.utf8Data.substring(0, 32);
//            
//            switch (key) {
//                case "81223B181AFE40A29C026FACC8A67F49":    // - Initial Connection                    
//                    
//                    //  Set new user name
//                    userName = htmlEntities(message.utf8Data.substring(32, message.utf8Data.length));
//                    
//                    //  Broadcast message to users
//                    broadcastMessage(userName, "has entered the room", "entered");
//
//                break;
//                
//                case "FE3EA8A1B0FA40B7A45D2368AA593D50":    // - Message
//                    console.log((new Date()) + ' Received Message from ' + userName + ': ' + message.utf8Data);
//                    
//                    //  Grab message
//                    var textMessage = htmlEntities(message.utf8Data.substring(32, message.utf8Data.length));
//                    
//                    //  Broadcast message to users
//                    broadcastMessage(userName, textMessage, "message");
//                    
//                break;
//            }
//                
//        }
    });

    // user disconnected
    connection.on('close', function(connection) {
       // if (userName !== false) {
         //   console.log((new Date()) + " Peer "
           //     + userName + " disconnected.");
        
            broadcastMessage(userName, "has left the room", "entered");
            // remove user from the list of connected clients
            clients.splice(index, 1);
            // push back user's color to be reused by another user
          //  colors.push(userColor);
        //}
    });

});