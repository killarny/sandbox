// string formatting, via http://stackoverflow.com/a/5077091
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

$(window).load(function() {
    var sock = new SockJS('http://ec2.killarny.net:10173');
    var status_text = $("#status #title")
    var callback_id = 0;
    
    // pull the client-info template block out of the DOM
    var client_info_template = $("#player-list #client-info");
    client_info_template.hide();

    // pull the history-entry template block out of the DOM
    var history_entry_template = $("#history #history-entry");
    history_entry_template.hide();

    status_text.html("connecting..");

    function nextCallbackId() {
        return callback_id += 1;
    }

    function sendRequest(str) {
        json = JSON.parse(str.format(nextCallbackId()));
        as_string = JSON.stringify(json, undefined, 4);
        sock.send(as_string + '\n\n');
        console.log('TX: ' + as_string);
    }

    function add_line_to_history(text) {
        // add line to history
        var history_entry = history_entry_template.clone();
        $('#history').append(history_entry)
        history_entry.find('#text').text(text);
        history_entry.show();
        // scroll to bottom of history
        $('#history').animate({ scrollTop: $('#history').prop("scrollHeight") - $('#history').height() }, 0);
    };
    
    function add_to_player_list(id) {
        // add entry to player list
        var client_info = client_info_template.clone();
        client_info.attr('id', id);
        client_info.find('#name').text(id);
        client_info.insertAfter(client_info_template).show();
    };
    
    function remove_from_player_list(id) {
        // remove entry from player list
        $('#player-list #{0}'.format(id)).addClass('disconnected')
            .fadeOut(2000, function() {
                $(this).remove();
            });
    };

    sock.onopen = function() {
        console.log('open');
        status_text.html("connected");
        sendRequest('{"id":{0},"command":"client_list"}');
    };

    sock.onmessage = function(e) {
        json = JSON.parse(e.data);
        as_string = JSON.stringify(json, undefined, 4);
        console.log('RX: ' + as_string);
        // parse events
        switch(json['result']) {
            case 'client_list':
                if(json['data'] != undefined) {
                    $.each(json['data'], function(i, id) {
                        add_to_player_list(id);
                    });
                }
                break;
        }
        switch(json['event']) {
            case 'client_connected':
                var id = json['id'];
                add_to_player_list(id);
                add_line_to_history('{0} has joined.'.format(id));
                break;
            case 'client_disconnected':
                var id = json['id'];
                remove_from_player_list(id);
                add_line_to_history('{0} has left.'.format(id));
                break;
            case 'chat_say':
                var author_id = json['author_id'];
                var message = json['message'];
                add_line_to_history('{0}: {1}'.format(author_id, message));
                break;
        }
    };

    sock.onclose = function() {
        console.log('close');
        status_text.html("disconnected");
    };

    $('#input input').on('keydown', function(ev) {
        if(ev.which === 13) {
            // get value from text box (strip all but letters & numbers)
            var text = $(this).val();
            // clear text box
            $(this).val('');
            // construct and send command to server
            sendRequest('{"id":{0},"command":"chat_say","message":"' + text + '"}');
            // don't submit the form
            return false;
        }
    });
});

