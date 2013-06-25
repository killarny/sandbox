function sortObject(obj) {
    var keys = Object.keys(obj); // or loop over the object to get the array
    // keys will be in any order
    keys.sort(); // maybe use custom sort, to change direction use .reverse()
    // keys now will be in wanted order
    var sortedObject = {};
    for (var i=0; i<keys.length; i++) { // now lets iterate in sort order
        var key = keys[i];
        sortedObject[key] = obj[key];
    }
    return sortedObject;
}


angular.module('chat', ['ui.bootstrap'])
    .config(function($interpolateProvider) {
        $interpolateProvider.startSymbol('<%').endSymbol('%>');
    })
    .factory('ClientService', ['$rootScope', '$q', function($rootScope, $q) {
        // We return this object to anything injecting our service
        var Service = {};
        // Keep all pending requests here until they get responses
        var callbacks = {};
        // Create a unique callback ID to map requests to responses
        var currentCallbackId = 0;
        // object to store the websocket connection
        var ws;
        // turn debugging on or off
        Service.debugging = false;
        // objects for storing requests and responses
        Service.requests = [];
        Service.responses = [];
        Service.events = [];

        function sendRequest(request) {
            var defer = $q.defer();
            var callbackId = getCallbackId();
            callbacks[callbackId] = {
                time: new Date(),
                cb: defer
            };
            request.id = callbackId;
            request.session_id = session_id;
            request = sortObject(request);
            if (Service.debugging) {
                console.log('Sending request', request);
            }
            ws.send(JSON.stringify(request) + '\n\n');
            Service.requests.push(JSON.stringify(request, undefined, 4));
            return defer.promise;
        }

        function listener(data) {
            data = sortObject(data);
            // If an object exists with id in our callbacks
            // object, resolve it
            if(callbacks.hasOwnProperty(data.id)) {
                Service.responses.push(JSON.stringify(data, undefined, 4));
                var cb = callbacks[data.id].cb;
                if (data.result) {
                    cb.resolve(data.data);
                } else {
                    if (data.missing) {
                        console.log('Missing values for keys:', data.missing);
                    }
                    cb.reject(data.error);
                }
                delete callbacks[data.callbackID];
            } else {
                Service.events.push(JSON.stringify(data, undefined, 4));
                var id = data.id;
                var event_name = data.event;
                switch(event_name) {
                    case 'client_connected':
                        var username = data.username;
                        try { Service.event_cb.on_client_connected({
                            id: data.id,
                            username: data.username,
                            fullname: data.username.split('@', 1)[0] // FIXME: use the actual fullname when available
                        }); } catch (e) { if (e.name === 'TypeError') {} }
                        break;
                    case 'client_disconnected':
                        var username = data.username;
                        try { Service.event_cb.on_client_disconnected({
                            id: data.id,
                            username: data.username,
                            fullname: data.username.split('@', 1)[0] // FIXME: use the actual fullname when available
                        }); } catch (e) { if (e.name === 'TypeError') {} }
                        break;
                    case 'chat_say':
                        try { Service.event_cb.on_chat_say(
                            {
                                id: data.author_id,
                                username: data.author_username,
                                fullname: data.author_username.split('@', 1)[0] // FIXME: use the actual fullname when available
                            },
                            data.message
                        ); } catch (e) { if (e.name === 'TypeError') {} }
                        break;
                    default:
                        console.log('No callback found for message:', data);
                }
            }
            $rootScope.$apply();
        }
        // This creates a new callback ID for a request
        function getCallbackId() {
            currentCallbackId += 1;
            if(currentCallbackId > 10000) {
                currentCallbackId = 0;
            }
            return currentCallbackId;
        }

        Service.connect = function(address, callback_func) {
            // Create our websocket object with the address to the websocket
            ws = new SockJS(address);
            Service.event_cb = callback_func();

            ws.onopen = function(){
                try { Service.event_cb.onopen();
                } catch (e) { if (e.name === 'TypeError') {} }
            };

            ws.onclose = function(){
                try { Service.event_cb.onclose();
                } catch (e) { if (e.name === 'TypeError') {} }
            };

            ws.onmessage = function(message) {
                var data = JSON.parse(message.data);
                listener(data);
                try { Service.event_cb.onmessage(data);
                } catch (e) { if (e.name === 'TypeError') {} }
            };
        }

        Service.disconnect = function() {
            ws.close();
        }

        Service.say = function (message) {
            return sendRequest({
                command: "chat_say",
                message: message
            });
        }

        Service.user_list = function() {
            return sendRequest({
                command: "client_list"
            });
        }

        return Service;
    }])
    .controller('client', ['$scope', 'ClientService',
        function($scope, ClientService) {
            $scope.connection = {
                address: 'http://ec2.killarny.net:10173',
                status: 'disconnected',
                requests: ClientService.requests,
                responses: ClientService.responses,
                events: ClientService.events
            };
            $scope.users = [];
            $scope.log = [];

            // user pressed enter in the input box
            $scope.input_send = function () {
                if (!this.input) { return; }
                ClientService.say(this.input);
                this.input = '';
            }

            ClientService.connect(
                $scope.connection['address'],
                function() {
                    var obj = {};
                    obj.onopen = function () {
                        var message = "You are connected.";
                        if (ClientService.debugging) { console.log(message); }
                        $scope.connection.status = 'connected';
                        // update the log
                        $scope.log.push({
                            type: "status",
                            message: message
                        });
                        // update the user list
                        ClientService.user_list().then(function(data) {
                            angular.forEach(data, function(user, index) {
                                $scope.users.push(user);
                                $scope.users.sort();
                            });
                        });
                        $scope.$apply();
                    }
                    obj.onclose = function () {
                        var message = "You have been disconnected.";
                        if (ClientService.debugging) { console.log(message); }
                        $scope.connection.status = 'disconnected';
                        // update the log
                        $scope.log.push({
                            type: "status",
                            message: message
                        });
                        $scope.$apply();
                    }
                    obj.on_client_connected = function (user) {
                        var message = user.username + ' has joined.';
                        if (ClientService.debugging) { console.log(message); }
                        // update the log
                        $scope.log.push({
                            type: "joined",
                            user: user
                        });
                        // update the user list
                        $scope.users.push(user);
                        $scope.users.sort();
                        $scope.$apply();
                    }
                    obj.on_client_disconnected = function (user) {
                        var message = user.username + ' has left.';
                        if (ClientService.debugging) { console.log(message); }
                        // update the log
                        $scope.log.push({
                            type: "left",
                            user: user
                        });
                        // update the user list
                        $scope.users.pop(user);
                        $scope.users.sort();
                        $scope.$apply();
                    }
                    obj.on_chat_say = function (author, message) {
                        // update the log
                        $scope.log.push({
                            type: "say",
                            author: author,
                            message: message
                        });
                    }
                    return obj;
                }
            );
        }
    ])
