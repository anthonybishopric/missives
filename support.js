// atoms. lol

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

// stolen from glimr demos

ImageDataFill = Klass({
    description : 'Plot 640x480 pixels in an array and draw them on the canvas with putImageData.',
    controls : ['generateData'],
    generateData : true,

    initialize : function(canvas, cc) {
		this.canvas = canvas;
      	this.canvas.fillStyle = 'black'
	    this.canvas.fill = true
	    var c = canvas.getContext()
	    var support = c.putImageData && c.getImageData
	    if (support) {
	      if (!c.createImageData) {
	        c.createImageData = function(w,h){
	          var d = c.getImageData(0,0,w,h)
	          if (d.data.length != w*h*4) { // We're screwed, thanks a lot.
	            var ratio = d.data.length / (w*h*4)
	            w *= ratio
	            h *= ratio
	            d = c.getImageData(0,0,w,h)
	          }
	          return d
	        }
	      }
	      // Let's try it out. Should work.
	      var d = c.createImageData(1,1)
	      if (!d.setData) {
	        d.setData = function(data) {
	          for (var i=0; i<data.length; i++) {
	            this.data[i] = data[i]
	          }
	        }
	      }
	      d.setData([255, 0, 255, 255])
	      c.putImageData(d, 0, 0)
	      var idata = c.getImageData(0,0,1,1)
	      if (![255, 0, 255, 255].equals(idata.data)) {
	        support = false // Lies. Dirty lies.
	      }
	    }
	    if (!support) {
	      var msg = "Your browser doesn't support putImageData."
	      var notSupported = new ElementNode(E('div',
	        msg,
	        {style: {color:'white', textAlign:'center'}}
	      ), {x:320, y:240, align:'center', valign:'center'})
	      this.scene.append(notSupported)
	      return
	    }
	    this.scene.imageData = c.createImageData(640, 480)
	    this.scene.draw = function(ctx) {
	      var pixels = this.imageData.data
	      var r = Math.floor(Math.random() * 256)
	      var g = Math.floor(Math.random() * 256)
	      var b = Math.floor(Math.random() * 256)
	      if (this.effect.generateData) {
	        for (var i=0; i<640*480*4; i++) {
	          pixels[i] = r
	          pixels[++i] = g
	          pixels[++i] = b
	          pixels[++i] = 255
	        }
	      }
	      ctx.putImageData(this.imageData, 0, 0)
	    }
	  }
	});

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