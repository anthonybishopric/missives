
// components

TealBox = Klass(Rectangle, {
	initialize : function(widthHeight, config){
		Rectangle.initialize.call(this, widthHeight, widthHeight, config);
		this.opacity = (config.opacity != null) ? config.opacity : 0.6;
		if(!config.white){
			this.fill = config.fill || '#008080';
		}
		else{
			this.fill = 'black';
		}
		
		this.flashCount = 0;
	},
	burnOutAfter : function(time,afterBurn){
		this.after(time, this.burnOut);
		this.afterBurn = afterBurn;
	},
	burnOut : function(afterBurn){
		var r = 0;
		var g = 128;
		var b = 128;
		if(this.white){
			r = 0;
			g = 0;
			b = 0;
		}
		
		if(afterBurn)
		{
			this.afterBurn = afterBurn;
		}
		this.addFrameListener(function(t,dt){
			this.opacity += 0.01;
			if(this.red){
				ar = Math.min(r+=5, 254),
				ab = 0;
				ag = 0;
			}
			else if(this.black)
			{
				this.opacity = 0.9;
				if(Math.random() * 100 < 80)
				{		
					this.fill = rgbToHex(254, 254, 254);
					this.flashCount++;
					return;
				}
				else
				{
					this.opacity = 0;
					if(this.flashCount == 4)
					{
						this.removeSelf();
					}
				}

			}
			else{
				ar = Math.min(r+=5, 254);
				ab = Math.min(b+=5, 254);
				ag = Math.min(g+=5, 254);					
			}
			this.fill = rgbToHex(ar, ag, ab);
			if(ar == 254){
				this.removeSelf();
		
			}
		});
		
	}
});

TealShaft = Klass(TealBox, {
	initialize : function(config){
		TealBox.initialize.call(this, 50, config);
		this.height = config.height || canvas_width * 1.2;
		
	},
	
});

Beam = Klass(Path, {
	initialize : function( config){
		Path.initialize.call(this, [
			['moveTo', [0,0]],
			['quadraticCurveTo', [8, 0, 0, 50]],
			['moveTo', [0,0]],
			['quadraticCurveTo', [8, 0, 50, 50]],
			['moveTo', [0,0]],
			['quadraticCurveTo', [8, 0, 50, 0]],
			['moveTo', [0,0]],
			['quadraticCurveTo', [8, 0, 0, 0]],
		]);
		this.fill = new Gradient({
			type: 'radial',
			endRadius: 46,
			colorStops: [
				[0, 'rgba(255, 255, 255, 1)'],
				[0.2, 'rgba(67, 99, 99, 0.6)'],
				[1, 'rgba(36, 68, 68, 0.1)']
			]
		});
		this.ox = config.x;
		this.oy = config.y;
		this.resetFlyingValues();
	}, 
	
	resetFlyingValues : function(){
		this.rx = 2*Math.random() - 1;
		this.ry = 2*Math.random() - 1;
	
	},
	/*
	* shoots the beam out of the origin in a random, mostly linear
	* direction. pos is used to guide the severity of the circular bend
	*/
	flyOutOfOrigin: function(t, et, pos){
		var distance = (et % 4000)/6;
		// this.x = this.rx* Math.cos(distance)*pos*distance + this.ox;
		// this.y = this.ry* Math.sin(distance)*pos*distance + this.oy;
		
		
		var newX = this.rx * distance + distance*pos*Math.cos(distance/(70*Math.PI)) + this.ox;
		var newY = this.ry * distance + distance*pos*Math.sin(distance/(70*Math.PI)) + this.oy;
		
		this.rotation = Curves.lineAngle([this.x,this.y], [newX, newY])+Math.PI/2;
		
		this.x = newX;
		this.y = newY;
	}
})

Flare = Klass(Circle, {
	initialize: function(radius, config){
		Circle.initialize.call(this, radius, config);
		// this.fill = this.flareGradient;
		this.fill = 'white';
		this.radius = radius || 30;
		this.hoverRate = 0;
		
		//used in sparkle
		this.minOpacity = 0;
		this.maxOpacity = 1; 
		
		this.zIndex = 10;
	},
	flareGradient : new Gradient({
		type: 'radial',
		endRadius: 30,
		colorStops: [
			[0, 'rgba(255, 255, 255, 1)'],
			[0.1, 'rgba(255, 102, 102, 0.8)'],
			[0.4, 'rgba(204, 0, 10, 0.3)'],
			[1, 'rgba(102, 0, 10, 0.1)']
		],
	}),
	becomeCenter: function(center){
		this.cancelHovering();
		this.minOpacity = 0.4;
		var ox = this.x;
		var oy = this.y;
		var me = this;
		this.zIndex = 0;
		executeEvents(this, function(list){
			list
			.addEvent({
				duration: 10000,
				eventFn : function(t, et, pos){
					me.x = gradedChange(ox, center.x, et, 10000);
					me.y = gradedChange(oy, center.y, et, 10000);
				}
			})
		});
		
	},
	swellToWhite: function(){
		var me = this;
		var or = this.radius;
		var duration = 20000;
		
		
		executeEvents(this, function(list){
			list
			.addEvent({
				duration: duration,
				eventFn: function(t, et, pos, dt){
					me.radius = gradedChange(or, 240, et, duration);
					var rToW = Math.floor(gradedChange(102, 255, et, duration));
					var r2ToG = Math.floor(gradedChange(204, 222, et, duration));
					var bToG = Math.floor(gradedChange(0, 217, et, duration));
					var r3ToG = Math.floor(gradedChange(102, 166, et, duration));
					var b2ToG = Math.floor(gradedChange(0, 162, et, duration));
					
					var g = new Gradient({
						type: 'radial',
						endRadius: me.radius,
						colorStops: [
							[0, rgbaToS(255, 255,255,1)],
							[0.1, rgbaToS(255, rToW, rToW, 0.8)],
							[0.4, rgbaToS(r2ToG, bToG, bToG, 0.3)],
							[1, rgbaToS(r3ToG, b2ToG, b2ToG, 0.1)]
						]
					});
					me.fill = g;
					
				}
			})
		});
	},
	// this is an eventFn hook-in
	becomeBlack: function(et,duration){

		
		var toBlack = function(value){
			return Math.floor(gradedChange(value, 0, et, duration));
		}
		
		var wToB = toBlack(255)
		var g1ToB = toBlack(240);
		var g2ToB = toBlack(222);
		var g3ToB = toBlack(217);
		var g4ToB = toBlack(166);
		var g5ToB = toBlack(162);
		
		var gradientDelta = gradedChange(0.3, 0.7, et, duration);
		
		var stops = [
			[0, rgbaToS(wToB, wToB, wToB, 1)],
			[0.1, rgbaToS(wToB, wToB, wToB, 0.8)],
			[0.4, rgbaToS(g2ToB, g3ToB, g3ToB, gradientDelta)],
			[1, rgbaToS(g4ToB, g5ToB, g5ToB, 0.1)]
		]
		
		var g = new Gradient({
			type: 'radial',
			endRadius: this.radius,
			colorStops: stops
		});
		
		this.fill = g;
		
	},
	launchBeams: function(){
		var center = {x: 0,y: 0};
		executeEvents(this, function(list){
			list
			.addEvent({ 
				duration: 20000,
				onBegin : function(){
					beams = [];
					for(var i = 0; i < 60; i++){
						var beam = new Beam(center);
						beam.opacity = 1;
						beam.compositeOperation = 'lighter';
						this.append(beam);
						beams[i] = beam;
					}
					all_beams = function(fn){
						$(beams).each(function(i){							
							fn.call(beams[i]);
						});
					}
					this.allBeamOffset = 0;
				},
				eventFn: function(t,et,pos){

					var beamTimeOffset = 0;
					var allBeamOffset = this.allBeamOffset;
					all_beams(function(){
						this.flyOutOfOrigin(t,et+beamTimeOffset,pos);
						beamTimeOffset+= allBeamOffset;
					});
					this.allBeamOffset++;
				}
			})

			.addEvent({
				duration: 1000,
				eventFn: function(t, et, pos){
					all_beams(function(){
						this.opacity = 1-pos;
					});
				},
				onComplete: function(){
					all_beams(function(){
						this.removeSelf();
					});

					delete all_beams;
					delete beams;
				}
			})
		
		});
	},
	leave: function(center){
		this.cancelHovering();
		leaveToOuterCircle.call(this, center, 10000);
	},
	
	sparkleEvery : function(t,dt){
		this.opacity = Math.max(this.minOpacity, Math.min(this.maxOpacity, this.opacity + Math.random() * 0.3 - 0.15));
	},

	darken : function(time){
		var fn = createTimedOperation(this, function(dt){
			var r =(dt/time);
			
			var f = 0 + (254)*(1-r);
			var hex = rgbToHex(gradedChange(254, 0, dt, time), f, f);
			this.fill = hex;
			
		}, time);
		fn.call();
	},
	makeFlareAppear: function(){
		var me = this;
		me.opacity = 0;
		me.animateTo('opacity', .8, 1000);
		me.fill = me.flareGradient;
		
	},
	
	startHovering : function(x_variance, y_variance){

		var me = this;
		var startHover = new EventList(this.parent);
		startHover
			.addEvent({
				duration: 2000,
				onBegin: function(){
					me.hoverListener = function(t, dt){
						me.x += me.hoverRate * hazeMultiplier(0, x_variance, t/4);
						me.y += me.hoverRate * hazeMultiplier(0, y_variance, t/4);
					}			
					me.addFrameListener(me.hoverListener);
				},
				eventFn: function(t, et, pos){
					me.hoverRate = pos;
				}

			});
		startHover.execute();
		
		
	},
	cancelHovering : function(){
		if(this.hoverListener){
			var me = this;
			var cancelHover = new EventList(this.parent);
			cancelHover
				.addEvent({
					duration: 2000,
					eventFn: function(t,et,pos){
						me.hoverRate = 1-pos;
					},
					onComplete: function(){
						me.removeFrameListener(me.hoverListener);
						me.hoverListener = null;
					
					}
				});
		
			cancelHover.execute();
		}
	},
	sparkle : function(){
		this.addFrameListener(this.sparkleEvery);
	},
	stopSparkle : function(){
		this.removeFrameListener(this.sparkleEvery);
	}		
});

logo = ImageNode.load('logo.png');
logo.configure = function(x, y, content){
	content.append(this);
	logo.opacity = 0;
	logo.y = y;
	logo.x = x;	
};

logo.itchIn  = function(){
	var me = this;
	executeEvents(this, function(list){
		list
		.addEvent({
			duration:3000,
			eventFn: function(t,et,pos){
				me.opacity = gradedItchTween(pos) ? pos : 0;
			},
			onComplete: function(){
				me.opacity = 1;
			}
		})
	});
};


logo.itchOut = function(){
	var me = this;
	executeEvents(this,function(list){
		list
		.addEvent({
			duration: 3000,
			eventFn: function(t,et,pos){
				me.opacity = gradedItchTween(pos) ? 0 : 1-pos;
			},
			onComplete: function(){
				me.removeSelf();
			}
		})
	});
};



playButton = ImageNode.load('play.png');
playButton.configure = function(x, y, content){
	content.append(this);
	playButton.opacity = 0;
	playButton.y = y;
	playButton.x = x;	
};

playButton.addEventListener('mousedown', function(ev){
	playButton.opacity = 1;
});

playButton.addEventListener('mouseup', function(ev){
	playButton.opacity = 0.8;
});


Background = Klass(Drawable, {
	initialize : function(content){
		Drawable.initialize.call(this);
		this.content = content;
		this.content.fill = [0,0,0,1];
	},
	hazingFunction : function(t,dt){
		var v = Math.floor(hazeMultiplier(28, 10, t));
		this.content.fill = [v,v,v,0.1];
	},
	startHazing: function(){
		this.addFrameListener(this.hazingFunction);
	},
	stopHazing: function(){
		this.removeFrameListener(this.hazingFunction);
	},
	makeTransparent : function(){
		this.content.animateTo('opacity', 0.4, 400, 'square');
		this.content.globalCompositeOperation = 'lighter';
	},
	makeOpaque : function(){
		this.content.animateTo('opacity', 1, 400, 'square');
		this.content.globalCompositeOperation = 'copy';
	}
});




RadialLense = Klass({
	initialize: function(config){
		this.over = config.over;
		this.over.opacity = 0;
		this.wb = config.widthBuffer || 0;
		this.hb = config.heightBuffer || 0;
		this.overlap = new Rectangle(config.width || this.over.width, config.height || this.over.height, {
			x: this.over.x - this.wb/2, 
			y: this.over.y - this.hb/2, 
			opacity: 1
		});
		
		var radiusBase = Math.min(config.width, config.height);

		var lense = new Gradient({
			type: 'radial', 
			endRadius: radiusBase*0.48,
			startRadius: radiusBase*0.25,
			startX: this.overlap.width/2,
			endX: this.overlap.width/2,
			startY: this.overlap.height/2,
			endY: this.overlap.height/2,
			colorStops: [
				[0.3, 'rgba(0,0,0,0)'],
				[0.6, 'rgba(0,0,0,0.4)'],
				[0.9, 'rgba(0,0,0,0.8)'],
				[1, 'rgba(0,0,0,1)']
			]
		});
		this.overlap.fill = lense;
	},
	reposition: function(x,y){
		this.overlap.x = x;
		this.overlap.y = y;
	},
	
	hide: function(){
		this.overlap.opacity = 0;
	},
	show: function(){
		this.overlap.opacity = 1;
	},
	apply: function(canvas){
		canvas.append(this.overlap);
	},
	removeSelf: function(){
		this.overlap.removeSelf();
	}
});

RectangleMagic = Klass(CanvasNode, {
	initialize: function(config){
		CanvasNode.initialize.call(this,config);
		this.corner();
		this.rectangleCenter =  {x: canvas_width/2, y: canvas_height/2};
	},
	rectangleRange: function(){
		return  {
					x: this.rectangleCenter.x +Math.random()*this.start_x-this.start_x/2, 
					y: this.rectangleCenter.y + Math.random()*this.start_y - this.start_y/2
				};
	},
	corner : function(){
		this.start_x = 0;
		this.start_y = 0;
	},
	everywhere: function(t)
	{
		this.start_x = (Math.sin(t/400)+1)*canvas_width;
		this.start_y = (Math.sin(t/400)+1)*canvas_height;
	},
	constantlyMakeRectangles : function(){
		this.addFrameListener(function(t,dt){
			var tealBox = new TealBox(Math.random() * 120, this.rectangleRange(), {white: this.useWhite});
			if(this.useBlack)
			{
				tealBox.black = true;
			}
			else if(this.useRed)
			{
				tealBox.red = true;
			}
			else if(this.useWhite){
				tealBox.white = true;
			}
			this.parent.append(tealBox);
			tealBox.burnOutAfter(Math.random() * 40);			
		})
	},
	oscillateCenter: function(){
		this.addFrameListener(function(t,dt){
			this.rectangleCenter.x += Math.sin(t/200)*2;
			this.rectangleCenter.y += Math.sin(t/200)*2;
			this.everywhere(t);	
		});
	}
	
})


EyeController = Klass(CanvasNode, {
	initialize: function(canvas,config){
		CanvasNode.initialize.call(this,config)
		this.eyes = [];
		this.canvas = canvas;
		for(i = 0; i < 5; i++){	
			eye = new EyeOfXOR( {x: 190*i + canvas_width/4, y: canvas_height/1.5, opacity: 0.01}); 
			this.eyes.push(eye);
			canvas.append(eye);
		}
	},
	all : function(fn){
		var me = this;
		$(this.eyes).each(function(i){
			fn.call(me.eyes[i],i);
		})
	}, 
	at: function(i){
		return this.eyes[i];
	},
	stack : function(time, x, y, callback){
		var stacking = new EventList(this.canvas);
		var eyes = this.eyes;
		this.all(function(i){
			var eye = this;
			var ox = this.x;
			var oy = this.y;

			stacking.addEvent({
				duration: time,
				blocking: i == eyes.length - 1,
				eventFn: function(t,et,pos){
					eye.x = gradedChange(ox, x, et, time);
					eye.y = gradedChange(oy, y+(i*-100), et, time);
				},
				onComplete: function(){
					eye.x = x;
					eye.y = y + (i*-100);
				}
			})
		});
		
		if(callback){
			stacking.then(callback);
		}
		
		stacking.execute();
	}
});


/**
* Eye of XOR is a cube with broad
* strokes that alternately has colored faces and XOR faces, or other effects,
* causing the underlying image to become visible.
*
*/
EyeOfXOR = Klass(CanvasNode,{
	initialize: function(config){
		CanvasNode.initialize.call(this, config);
		this.fill = 'black';
		this.initCube();
		
	},
	initCube: function(){
		var p = new Polygon([]);
	    p.stroke = 'black';
		p.fill = 'black';
		p.strokeWidth = 0.01;
	    for (var i=0; i<6; i++) {
	      p.segments.push(Math.cos(i*Math.PI/3 - Math.PI/6))
	      p.segments.push(Math.sin(i*Math.PI/3 - Math.PI/6))
	    }
	
		
		var firstLine = new Line(0,0,p.segments[0],p.segments[1]);
		p.append(firstLine)
		
		var secondLine = new Line(0,0,p.segments[4],p.segments[5]);
		p.append(secondLine)

		var lastLine = new Line(0,0,p.segments[8],p.segments[9])
		p.append(lastLine)
		
		var ps = p.segments;
		
		var ls = new EyeSide([
			0,0,
			ps[4],ps[5],
			ps[6],ps[7],
			ps[8],ps[9]
		]);  // left surface

		
		var bs = new EyeSide([
			0,0,
			ps[0],ps[1],
			ps[2],ps[3],
			ps[4],ps[5]
		]); // bottom surface
		
		var ts = new EyeSide([
			0,0,
			ps[0],ps[1],
			ps[10],ps[11],
			ps[8],ps[9],
		]);
		
		

		p.append(ls);
		p.append(ts);
		p.append(bs);
		
		// bs.flicker();
		
		this.append(p);
		this.scale = 100;
		
		this.bottomSide = bs;
		this.topSide = ts;
		this.leftSide = ls;
	},
	allSides: function(fn){
		fn.call(this.bottomSide);
		fn.call(this.leftSide);
		fn.call(this.topSide);
	},
	enableXOR: function(){
		this.allSides(function(){
			this.compositeOperation = 'xor';
		});
	}
});

EyeSide = Klass(Polygon,{
	initialize: function(segments){
		Polygon.initialize.call(this,segments);
		this.strokeWidth = 0.01
		this.stroke = 'white'
		this.currentEffect = null;
		this.onSwitch = null; //function to call before switching effects
	},
	switchEffect: function(effect){
		if(this.onSwitch){
			this.onSwitch.call(this);
			this.onSwitch = null;
		}
		if(this.currentEffect != null){
			this.removeFrameListener(this.currentEffect);
		}
		this.draw = Polygon.draw;
		this.currentEffect = effect;
		this.addFrameListener(effect);
		//optimistic lock test - if effect got changed quickly, remove this one
		if(this.currentEffect != effect){
			this.removeFrameListener(effect);
		}
	},
	flicker: function(){
		var timeToWhite = 2000;
		var timeElapsed = 0;
		this.switchEffect(function(t,dt){
			timeElapsed+= dt;
			timeElapsed = timeElapsed % 2000;
			var rgb = Math.floor(gradedChange(0, 255, timeElapsed, 2000));
			this.fill = rgbaToS(rgb,rgb,rgb,1);
			
		});
	},
	flash: function(config){
		var color = config.color;
		
		var colorSwitch = false;
		this.switchEffect(function(t,dt){
			
			if(colorSwitch){
				this.fill = color || 'red';
			}
			else{
				this.fill = 'black';
			}
			colorSwitch = !colorSwitch;
		});
	},
	stopEffect: function(){
		if(this.onSwitch != null){
			this.onSwitch.call(this);
			this.onSwitch = null;
		}
		if(this.currentEffect != null){
			this.removeFrameListener(this.currentEffect);
			this.currentEffect = null;
		}

	},
	projectShafts: function(){
		var timeToWhite = 2000;
		var timeElapsed = 0;
		this.switchEffect(function(t,dt){
			timeElapsed+= dt;
			alert("unimplemented");
		});
	},
	radarBounce: function(config){
		var innerPoly = new Polygon(this.segments);
		var polyStrokeColors = config.polyStrokeColors || ['yellow', 'teal', 'orange', 'green']
		var fillRate = config.fillRate || 0;
		if(config.fromCenter != null){
			var fromCenter = config.fromCenter;
		}
		else{
			var fromCenter = true;
		}
		
		var timeToScale = 400;
		var currentTime = 0;
		this.append(innerPoly);
		this.switchEffect(function(t,dt){
			currentTime+= dt;
			if(currentTime % timeToScale < currentTime){
				innerPoly.stroke = polyStrokeColors.randomValue();
				currentTime = currentTime % timeToScale;
				if(gradedItchTween(fillRate)){
					innerPoly.fill = innerPoly.stroke;
				}
				else{
					innerPoly.fill = 'rgba(0,0,0,0)';
				}
			}
			innerPoly.scale = gradedChange(0, 1, currentTime, timeToScale);

		});
		this.onSwitch = function(){
			innerPoly.removeSelf();
		}
	}
})

CoveredArea = Klass(Rectangle, {
	initialize: function(config){
		this.targetNode = config.target;
		this.fill = config.color || 'black';
		var w = config.target.width || config.width + (config.widthBuffer || 0);
		var h = config.target.height || config.height + (config.heightBuffer || 0);
		Rectangle.initialize.call(this, w,h, config);
		this.x = this.targetNode.x - (config.widthBuffer/2 || 0);
		this.y = this.targetNode.y - (config.heightBuffer/2 || 0);

	},
});