// string formatting, via http://stackoverflow.com/a/5077091
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

$(window).load(function() {
    var session_id = $('#session').html(); $('#session').remove();
    var static_location = $('#static_location').html(); $('#static_location').remove();
    
    var playground_div = $("#playground");
    var PLAYGROUND_WIDTH = playground_div.width();
    var PLAYGROUND_HEIGHT = playground_div.height();
    var REFRESH_RATE = 30;

    // create the playground
    playground_div.playground({
        height: PLAYGROUND_HEIGHT,
        width: PLAYGROUND_WIDTH
    });
    
    // background
    var smallStarSpeed = 1;
    var mediumStarSpeed = 2;
    var largeStarSpeed = 4;

    var background = $.playground().addGroup("background", {width: PLAYGROUND_WIDTH, height: PLAYGROUND_HEIGHT});
    
    var background1 = new $.gameQuery.Animation({imageURL: static_location + "client/images/background1.png"});
    var background2 = new $.gameQuery.Animation({imageURL: static_location + "client/images/background2.png"});
    var background3 = new $.gameQuery.Animation({imageURL: static_location + "client/images/background3.png"});

    background
    .addSprite("background1", {
        animation: background1,
        width: PLAYGROUND_WIDTH, 
        height: PLAYGROUND_HEIGHT
    }).addSprite("background2", {
        animation: background1,
        width: PLAYGROUND_WIDTH, 
        height: PLAYGROUND_HEIGHT,
        posx: PLAYGROUND_WIDTH
    }).addSprite("background3", {
        animation: background2,
        width: PLAYGROUND_WIDTH, 
        height: PLAYGROUND_HEIGHT
    }).addSprite("background4", {
        animation: background2,
        width: PLAYGROUND_WIDTH, 
        height: PLAYGROUND_HEIGHT,
        posx: PLAYGROUND_WIDTH
    }).addSprite("background5", {
        animation: background3,
        width: PLAYGROUND_WIDTH, 
        height: PLAYGROUND_HEIGHT
    }).addSprite("background6", {
        animation: background3,
        width: PLAYGROUND_WIDTH, 
        height: PLAYGROUND_HEIGHT,
        posx: PLAYGROUND_WIDTH
    });
    
    $.playground().registerCallback(function() {
    
        var newPos = ($("#background1").x() - smallStarSpeed - PLAYGROUND_WIDTH)
            % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
        $("#background1").x(newPos);

        newPos = ($("#background2").x() - smallStarSpeed - PLAYGROUND_WIDTH)
            % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
        $("#background2").x(newPos);

        newPos = ($("#background3").x() - mediumStarSpeed - PLAYGROUND_WIDTH)
            % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
        $("#background3").x(newPos);

        newPos = ($("#background4").x() - mediumStarSpeed - PLAYGROUND_WIDTH)
            % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
        $("#background4").x(newPos);
          
        newPos = ($("#background5").x() - largeStarSpeed - PLAYGROUND_WIDTH)
            % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
        $("#background5").x(newPos);

        newPos = ($("#background6").x() - largeStarSpeed - PLAYGROUND_WIDTH)
            % (-2 * PLAYGROUND_WIDTH) + PLAYGROUND_WIDTH;
        $("#background6").x(newPos);

    }, REFRESH_RATE);
    
    $.playground().startGame();
});