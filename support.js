// atoms. lol

Array.prototype.randomValue = function(){
	return this[Math.floor(Math.random() * this.length)];
};

rgbToHex = function(r,g,b){
	var color =  "#"+hex(r)+hex(g)+hex(b);
	return color;
}

rgbaToS = function(r,g,b,a){
	return "rgba("+r+","+g+","+b+","+a+")";
}

hex = function(v){
	var v = v % 255;
	return "0123456789ABCDEF".charAt((v-v%16)/16) + "0123456789ABCDEF".charAt(v%16);
}

gradedChange = function(original, desired, dt, rate)
{
	return Curves.cubicValue(original, (desired*2+original)/3, (desired*6+original)/7, desired, dt/rate);
}

gradedChangeTween = function(pos){
	return gradedChange(0, 1, pos, 1);
}

/*
* Uses the gradedChange to inform a probabalistic function that generates a true or false. Useful for "itchy" 
* stuff appearing, like the SWH text
*/
gradedItchBoolean = function(dt, rate)
{
	var grade = gradedChange(0, 100, dt, rate);
	return Math.random() * 100 < grade;
}

gradedItchTween = function(pos){
	return gradedItchBoolean(pos, 1);
}

createTimedOperation = function(assignee, op, totalTime)
{
	return function(){
		var originalTime = 0;
		var frameListener = function(t, dt){
			if(originalTime == 0){
				originalTime = t;
			}
			op.call(assignee, t-originalTime);
			if(t-originalTime > totalTime){
				this.removeFrameListener(frameListener);
			}
		}
		assignee.addFrameListener(frameListener);
	};
}

hazeMultiplier = function(middle, range, t){
	return middle + range*(Math.sin(t/500 + Math.sin(t/1500)));
}

/*
* Defines a rectangular area that can provide random locations in the area that are valid at any given time
*/
getRandomLocationInShape = function(shape, center){
	var loc = {
		x: shape.x + Math.random() * shape.width,
		y: shape.y + Math.random() * shape.height,
	};
	return loc;
}

opacityFlicker = function(t,dt){
	if(this.jitterMinOpacity == null){
		this.jitterMinOpacity = 0;
	}
	if(this.jitterMaxOpacity == null){
		this.jitterMaxOpacity = 1;
	}
	this.opacity = Math.max(this.jitterMinOpacity,
		 Math.min(this.jitterMaxOpacity, this.opacity + (Math.random() * 0.1 - 0.05)));
}

leaveToOuterCircle = function(center, timeToExecute){
	var ox = this.x;
	var oy = this.y;
	var me = this;
	
	/**
	* Places the current location of the flare on a circle that revolves around the center parameter,
	* then gradually expands the radius of that circle to match the global outlying circle, which should
	* cause the flare to go offscreen. After that, the flare is faded and destroyed.
	*/
	
	var oa = Curves.lineLength([center.y, center.x], [this.y, this.x]); // original distance from center
	var ct = Math.acos((this.x - center.x)/oa); // the value for t in the circle function for the duration of the animation.
	var g = Curves.lineLength([center.y, center.x], [0, canvas_width+center.x]); // global outlying circle radius


	executeEvents(this, function(list){
		list
		.addEvent({
			duration: timeToExecute,
			eventFn: function(t, et, pos, dt){
				var	adjustRate = gradedChange(0, 1, et, timeToExecute);
				
				var a = gradedChange(oa, g, et+dt, timeToExecute);
				var da = gradedChange(oa, g, et, timeToExecute);
				var x2 = a*Math.cos(ct)+center.x;
				var x1 = da * Math.cos(ct)+ center.x;
				var y2 = a + Math.sin(ct) + center.y;
				var y1 = da + Math.sin(ct) + center.y;
				
				me.x += adjustRate*(x2-x1);
				me.y += adjustRate*(y2-y1);
			}
		})
		.tween(me, 'opacity', 0, 2000)
		.then(function(){
			me.removeSelf();
		})
	});
}

/**
* Generalized, time-relative keyframe support for arbitrary events. Can be called multiple times (although, not concurrently)
*/
EventList = Klass({
	initialize : function(canvas){
		this.canvas = canvas;
		this.events = [];
	},
	/*
	*{
		duration: duration, //total executing time. Counter starts when event begins
		eventFn: eventFn, // (optional) function(absoluteTime, elapsedTime, position)
		onBegin: onBegin, // (optional) function(absoluteTime)
		onComplete: onComplete, // (optional) function(absoluteTime) called before this event is removed
		originalTime: null // (optional) absolute starting time of the event - informs duration calculation
	}
	*/
	addEvent : function(eventConf){
		this.events.push(eventConf);
		return this;
	},
	wait : function(duration){
		return this.addEvent({
			duration: duration,
		});
	},
	then : function(eventFn){ //allow a function to be called immediately, exactly once, at this point
		return this.addEvent({
			duration: -1,
			onBegin: eventFn
		});
	},
	tween : function(target, field, desired, duration){
		var original = target[field];
		return this.addEvent({
			duration: duration,
			eventFn: function(t, et, pos){
				target[field] = original + (desired - original)*pos;
			}
		})
	},
	execute : function(){
		var currentIndex = 0;
		var canvas = this.canvas;
		var events = this.events;
		var me = this;
		var executeListener = function(t,dt){
			if(events.length > currentIndex){
				var event = events[currentIndex];
				if(event.blocking == null || event.blocking){
					if(!event.originalTime){
						event.originalTime = t; // each event's duration is made relative to the first time they are invoked.
						if(event.onBegin){
							event.onBegin.call(canvas, t);
						}
					}
					var elapsed = (t - event.originalTime);
					if(elapsed > event.duration){
						if(event.onComplete){
							event.onComplete.call(canvas, t);
						}
						currentIndex++;
					}
					else if(event.eventFn){
						event.eventFn.call(canvas, t, t-event.originalTime, (t-event.originalTime)/event.duration, dt);
					}
				}
				else{
					var eventList = new EventList(canvas);
					event.blocking = true;
					eventList.addEvent(event);
					eventList.execute();
					currentIndex++;
				}
			}
			else{
				canvas.removeFrameListener(executeListener);
			}
		};
		canvas.addFrameListener(executeListener);
	},
});

executeEvents = function(target, listFn){
	var list = new EventList(target);
	listFn.call(target, list);
	list.execute();
}