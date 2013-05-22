// string formatting, via http://stackoverflow.com/a/5077091
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

//A simple Chipmunk.js Demo by Brynjar Harðarson a.k.a. gautamadude, heavily based on: http://dl.dropbox.com/u/2494815/demo/index.html

var v = cp.v;
var GRABABLE_MASK_BIT = 1 << 31;
var NOT_GRABABLE_MASK = ~GRABABLE_MASK_BIT;

var canvasLeft = $("#canvas").position().left;
var canvasTop = $("#canvas").position().top;
var canvasWidth = $("#canvas").width();
var canvasHeight = $("#canvas").height();

var ChipSimple = defineSpace("canvas", canvasWidth, canvasHeight);

var DENSITY = 1 / 10000;

var Stuff = function () {
    ChipSimple.call(this);
    
    //Configure space
    var space = this.space;
    space.iterations = 30;
    space.gravity = v(0, -500);
    space.sleepTimeThreshold = 0.5;
    space.collisionSlop = 0.5;
    
    //Add "floor"
    var floor = space.addShape(new cp.SegmentShape(space.staticBody, v(0, 0), v(this.width, 0), 10));
    floor.setElasticity(0.5);
    floor.setFriction(0.75);
    floor.setLayers(NOT_GRABABLE_MASK);

    //Add "ceiling"
    var ceiling = space.addShape(new cp.SegmentShape(space.staticBody, v(0, this.height), v(this.width, this.height), 10));
    ceiling.setElasticity(1);
    ceiling.setFriction(0.75);
    ceiling.setLayers(NOT_GRABABLE_MASK);

    //Add left "wall"
    var left_wall = space.addShape(new cp.SegmentShape(space.staticBody, v(0, this.height), v(0, 0), 10));
    left_wall.setElasticity(1);
    left_wall.setFriction(0.75);
    left_wall.setLayers(NOT_GRABABLE_MASK);

    //Add right "wall"
    var right_wall = space.addShape(new cp.SegmentShape(space.staticBody, v(this.width, this.height), v(this.width, 0), 10));
    right_wall.setElasticity(1);
    right_wall.setFriction(0.75);
    right_wall.setLayers(NOT_GRABABLE_MASK);

    //Add box shape
    var width = 180;
    var height = 20;
    var mass = width * height * DENSITY;
    var moment = cp.momentForBox(mass, width, height);
    var body = space.addBody(new cp.Body(mass, moment));
    body.setPos(v(canvasLeft + width, canvasHeight - height));
    this.shape = space.addShape(new cp.BoxShape(body, width, height));
    this.shape.setElasticity(mass * 1.25);
    this.shape.setFriction(0.6);

    //Add box shape
    var width = 40;
    var height = 60;
    var mass = width * height * DENSITY;
    var moment = cp.momentForBox(mass, width, height);
    var body = space.addBody(new cp.Body(mass, moment));
    body.setPos(v(canvasLeft + width, canvasHeight - height));
    this.shape = space.addShape(new cp.BoxShape(body, width, height));
    this.shape.setElasticity(mass * 1.25);
    this.shape.setFriction(0.6);

    //Add box shape
    var width = 150;
    var height = 40;
    var mass = width * height * DENSITY / 2;
    var moment = cp.momentForBox(mass, width, height);
    var body = space.addBody(new cp.Body(mass, moment));
    body.setPos(v(canvasLeft - width, canvasHeight - 40));
    this.shape = space.addShape(new cp.BoxShape(body, width, height));
    this.shape.setElasticity(mass * 1.25);
    this.shape.setFriction(0.6);

    //Add circle shape
    var radius = 20;
    mass = radius * 3140 * DENSITY;
    console.log(mass);
    var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0, radius, v(0, 0))));
    body.setPos(v(50, 300));
    var circle = space.addShape(new cp.CircleShape(body, radius, v(0, 0)));
    circle.setElasticity(1.25);
    circle.setFriction(0.9);

    //Add circle shape
    var radius = 30;
    mass = radius * 3140 * DENSITY;
    console.log(mass);
    var body = space.addBody(new cp.Body(mass, cp.momentForCircle(mass, 0, radius, v(0, 0))));
    body.setPos(v(50, 300));
    var circle = space.addShape(new cp.CircleShape(body, radius, v(0, 0)));
    circle.setElasticity(0.75);
    circle.setFriction(0.9);
};

Stuff.prototype = Object.create(ChipSimple.prototype);

Stuff.prototype.update = function (dt) {
    var steps = 1;
    dt = dt / steps;

    for (var i = 0; i < steps; i++) {
        this.space.step(dt);
    }
};

// An example of how to define a space,
// but if you just want to add bodies, shapes, etc and 
// do stuff with them then you should play with the code above.
function defineSpace(canvas_id, width, height) {
    var ChipSimple = function () {
        //Initialize
        var space = this.space = new cp.Space();
        this.mouse = v(0, 0);

        var self = this;
        var canvas2point = this.canvas2point = function (x, y) {
            var rect = canvas.getBoundingClientRect(); //so canvas can be anywhere on the page
            return v((x / self.scale) - rect.left, height - y / self.scale + rect.top);
        };

        this.point2canvas = function (point) {
            return v(point.x * self.scale, (height - point.y) * self.scale);
        };

        this.canvas.onmousemove = function (e) {
            self.mouse = canvas2point(e.clientX, e.clientY);
        };

        var mouseBody = this.mouseBody = new cp.Body(Infinity, Infinity);
        this.canvas.oncontextmenu = function (e) {
            return false;
        }

        this.canvas.onmousedown = function (e) {
            e.preventDefault();
            var rightclick = e.which === 3; // or e.button === 2;
            self.mouse = canvas2point(e.clientX, e.clientY);

            if (!rightclick && !self.mouseJoint) {
                var point = canvas2point(e.clientX, e.clientY);

                var shape = space.pointQueryFirst(point, GRABABLE_MASK_BIT, cp.NO_GROUP);
                if (shape) {
                    var body = shape.body;
                    var mouseJoint = self.mouseJoint = new cp.PivotJoint(mouseBody, body, v(0, 0), body.world2Local(point));

                    mouseJoint.maxForce = 50000;
                    mouseJoint.errorBias = Math.pow(1 - 0.15, 60);
                    space.addConstraint(mouseJoint);
                }
            }

            if (rightclick) {
                self.rightClick = true;
            }
        };

        this.canvas.onmouseup = function (e) {
            var rightclick = e.which === 3; // or e.button === 2;
            self.mouse = canvas2point(e.clientX, e.clientY);

            if (!rightclick) {
                if (self.mouseJoint) {
                    space.removeConstraint(self.mouseJoint);
                    self.mouseJoint = null;
                }
            }

            if (rightclick) {
                self.rightClick = false;
            }
        };
    };

    
    var canvas = ChipSimple.prototype.canvas = document.getElementById(canvas_id);
    var ctx = ChipSimple.prototype.ctx = canvas.getContext('2d');

    
    //Resize
    var w = ChipSimple.prototype.width = canvas.width = width;
    var h = ChipSimple.prototype.height = canvas.height = height;
    ChipSimple.prototype.scale = 1.0;
    ChipSimple.resized = true;


    // Update, should be overridden by the demo itself.
    ChipSimple.prototype.update = function (dt) {
        this.space.step(dt);
    };


    // Draw
    ChipSimple.prototype.draw = function () {
        var ctx = this.ctx;
        var self = this;

        // Draw shapes
        ctx.strokeStyle = 'black';
        ctx.clearRect(0, 0, this.width, this.height);

        this.space.eachShape(function (shape) {
            ctx.fillStyle = shape.style();
            shape.draw(ctx, self.scale, self.point2canvas);
        });

        if (this.mouseJoint) {
            ctx.beginPath();
            var c = this.point2canvas(this.mouseBody.p);
            ctx.arc(c.x, c.y, this.scale * 5, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.stroke();
        }

        this.space.eachConstraint(function (c) {
            if (c.draw) {
                c.draw(ctx, self.scale, self.point2canvas);
            }
        });
    };


    // Run
    ChipSimple.prototype.run = function () {
        this.running = true;

        var self = this;

        var lastTime = 0;
        var step = function (time) {
            self.step(time - lastTime);
            lastTime = time;

            if (self.running) {
                requestAnimationFrame(step);
            }
        };

        step(0);
    };


    // Stop
    ChipSimple.prototype.stop = function () {
        this.running = false;
    };


    // Step
    ChipSimple.prototype.step = function (dt) {
        // Move mouse body toward the mouse
        var newPoint = v.lerp(this.mouseBody.p, this.mouse, 0.25);
        this.mouseBody.v = v.mult(v.sub(newPoint, this.mouseBody.p), 60);
        this.mouseBody.p = newPoint;

        var lastNumActiveShapes = this.space.activeShapes.count;

        var now = Date.now();
        this.update(1 / 60);
        this.simulationTime += Date.now() - now;

        // Only redraw if the simulation isn't asleep.
        if (lastNumActiveShapes > 0 || ChipSimple.resized) {
            now = Date.now();
            this.draw();
            this.drawTime += Date.now() - now;
            ChipSimple.resized = false;
        }
    };


    // **** Draw methods for Shapes
    cp.PolyShape.prototype.draw = function (ctx, scale, point2canvas) {
        ctx.beginPath();

        var verts = this.tVerts;
        var len = verts.length;
        var lastPoint = point2canvas(new cp.Vect(verts[len - 2], verts[len - 1]));
        ctx.moveTo(lastPoint.x, lastPoint.y);

        for (var i = 0; i < len; i += 2) {
            var p = point2canvas(new cp.Vect(verts[i], verts[i + 1]));
            ctx.lineTo(p.x, p.y);
        }
        ctx.fill();
        ctx.stroke();
    };

    cp.SegmentShape.prototype.draw = function (ctx, scale, point2canvas) {
        var oldLineWidth = ctx.lineWidth;
        ctx.lineWidth = Math.max(1, this.r * scale * 2);

        var a = this.ta;
        var b = this.tb;
        a = point2canvas(a);
        b = point2canvas(b);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        ctx.lineWidth = oldLineWidth;
    };

    cp.CircleShape.prototype.draw = function (ctx, scale, point2canvas) {
        var c = point2canvas(this.tc);
        ctx.beginPath();
        ctx.arc(c.x, c.y, scale * this.r, 0, 2*Math.PI, false);
        ctx.fill();
        ctx.stroke();
        
        // And draw a little radian so you can see the circle roll.
        a = point2canvas(this.tc); b = point2canvas(cp.v.mult(this.body.rot, this.r).add(this.tc));
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
    };


    // Color
    var randColor = function () {
        return Math.floor(Math.random() * 256);
    };

    var styles = [];
    for (var i = 0; i < 100; i++) {
        styles.push("rgb(" + randColor() + ", " + randColor() + ", " + randColor() + ")");
    }

    cp.Shape.prototype.style = function () {
        var body;
        if (this.sensor) {
            return "rgba(255,255,255,0)";
        } else {
            body = this.body;
            if (body.isSleeping()) {
                return "rgb(50,50,50)";
            } else if (body.nodeIdleTime > this.space.sleepTimeThreshold) {
                return "rgb(170,170,170)";
            } else {
                return styles[this.hashid % styles.length];
            }
        }
    };

    return ChipSimple;
}


$(window).load(function() {
    var session_id = $('#session').html(); $('#session').remove();

    //Run
    var demo = new Stuff();
    demo.run();
    
});

