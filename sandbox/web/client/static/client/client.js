// string formatting, via http://stackoverflow.com/a/5077091
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

$(window).load(function() {
    var sock = new SockJS('http://ec2.killarny.net:10173');
    var status_text = $("#statusText")
    var request_text = $("#lastRequest")
    var result_text = $("#lastResult")
    var buttons = $("#buttons")
    var callback_id = 0;

    buttons.hide();
    status_text.html("Connecting..");

    function nextCallbackId() {
        return callback_id += 1;
    }

    function sendRequest(str) {
        content = str.format(nextCallbackId())
        json = JSON.parse(content);
        new_request_text = JSON.stringify(json, undefined, 4)
        if(request_text.html().length) {
            request_text.html(new_request_text + '\n---\n' + request_text.html());
        } else { request_text.html(new_request_text); }
        sock.send(content + '\n\n');
    }

    sock.onopen = function() {
        console.log('open');
        status_text.html("Connected.");
        buttons.show();
        sendRequest('{"id":{0},"command":"ping"}');
    };

    sock.onmessage = function(e) {
        json = JSON.parse(e.data);
        as_string = JSON.stringify(json, undefined, 4);
        if(result_text.html().length) {
            result_text.html(as_string + '\n---\n' + result_text.html());
        } else { result_text.html(as_string); }
        console.log('message receivedL: ' + as_string.length + ' chars');
    };

    sock.onclose = function() {
        console.log('close');
        status_text.html("Disconnected.");
        buttons.hide();
    };

    $("#ping").on('click', function() {
        sendRequest('{"id":{0},"command":"ping"}');
    });
});
