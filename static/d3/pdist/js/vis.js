var $slider = $("#slider");


var para = {n: 20, d:0.5, lwr:0.1, upr:0.2, logged:false};
$("#ES_lab").text(para.d);
$("#n_lab").text(para.n);

if ($slider.length > 0) {
  $slider.slider({
    min: 0,
    max: 3,
    value: para.d,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 0.01,
	change: function(event, ui) {
		updateLine(d=ui.value, n=para.n);
	},
	slide: function(event, ui) {
		$(".tooltip-inner").text(ui.value);
		tmp_line_slide(d=ui.value, n=para.n);
	},
	start: function(event, ui) {
		tooltip.tooltip("show"); $(".tooltip-inner").text(ui.value);
		tmp_line_start(d=ui.value, n=para.n);
	},
	stop: function() {
		tooltip.tooltip("hide");

	}
	 });
	}

$slider.find(".ui-slider-handle").append("<div class='slide-tooltip'/>");

var tooltip = $(".slide-tooltip").tooltip( {title: $("#slider").slider("value"), trigger: "manual"});



var $slider2 = $("#slider2");
if ($slider2.length > 0) {
  $slider2.slider({
    min: 5,
    max: 100,
    value: para.n,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 1,
	change: function(event, ui) {
		updateLine(d=para.d, n=ui.value);

	},
	slide: function(event, ui) {
		$(".tooltip-inner").text(ui.value);
		tmp_line_slide(d=para.d, n=ui.value);
	},
	start: function(event, ui) {
		tooltip2.tooltip("show"); 
		$(".tooltip-inner").text(ui.value);
		tmp_line_start(d=para.d, n=ui.value);
	},
	stop: function() {
		tooltip2.tooltip("hide");
		
	}
	 });
	}

$slider2.find(".ui-slider-handle").append("<div class='slide-tooltip2'/>");

var tooltip2 = $(".slide-tooltip2").tooltip( {title: $("#slider2").slider("value"), trigger: "manual"});

$("#select-help").tooltip( {title: "Select a slice of p-values. Alternatively you can click-and-drag on the x-axis"});
$("#rescale").tooltip( {title: "Change y-scale's limits. This can also be changed by 'scrolling' over the plot"});
$("#labelMaxn").tooltip( {title: "Change sample size-slider's max n"});

// plot dimensions
var ww = parseInt(d3.select('body').style('width'), 10);
 if(ww < 767) {
	var aspect = 0.6;
	var margin = {top: 0, right: 15, bottom: 40, left: 30};
} else {
	var aspect = 0.4;
	var margin = {top: 0, right: 20, bottom: 55, left: 50};
}

var	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
var	h = aspect * w - margin.top - margin.left;

// Axes min and max
var x_max = 1;
var x_min = 1e-3;
var y_max = pdist(0.001, para.n, para.d); // also used when rescaling


// p.values 
function incr(i) {
	if(para.logged) {
		if(para.d < 1.5) {
					return i < 0.05 ? 0.0001 : 0.01;
				} else {
					if(i < 0.001) {
						return 0.00001;
					} else if(i < 0.05) {
						return 0.0001;
					} else {
						return 0.01;
					}
					
				}

	} else {
		return i < 0.3 ? 0.001 : 0.01;
	}
}
function genX() {
	var x = [];
	for (var i = x_min; i <= 1; i += incr(i) ) {
		x.push(i);
	}
	x.push(1);
return x;
}
var x = genX();
	
function pdist(p, n, d) {
	if(p == 0) return y_max;
	return Math.exp(- ((n * Math.pow(d,2))/4)) * Math.cosh( Math.sqrt(n) * d * jStat.erfcinv(2-p));
}
function power() {
	var d = para.d,
		n = para.n;
	b = 1 - jStat.normal.cdf(d * Math.sqrt(n/2) + jStat.normal.inv(1-0.05/2, 0, 1), 0, 1) + jStat.normal.cdf(d * Math.sqrt(n/2) - jStat.normal.inv(1-0.05/2, 0, 1), 0 ,1);
	return d3.round(b * 100, 2) ;
}
para.power = power()/100;


// Generates data
function genData(n, d) {
	
		var y = [];
		for(var i = 0; i < x.length; i++) {
			y.push(pdist(x[i], n, d));
		}
		var tmp = [];
			for(var i = 0; i < x.length; i++) {
				tmp.push([x[i], y[i]]);
			}
		var data = {
			data: tmp,
			x: x,
			y: y
		};
	return data;
}	

// Data sets
var data1 = genData(20, 0.5);
var data2 = genData(20, 0.5);

data2.data.unshift([x_min,0]);
data2.data.push([1,0]);



// Create scales
var xScale = d3.scale.linear().domain([x_min, x_max]).range([0, w]);
var yScale = d3.scale.linear().domain([0, y_max]).range([h, 0]);


		// fixes smooth transition after change in data resolution
		function cleanUp() {

			x = genX();
				data1 = genData(n=para.n, d=para.d);
			data2 = genData(n=para.n, d=para.d);
			data2.data.unshift([x_min, 0]);
			//data2.data.unshift([0, yScale(y_max)]);
			data2.data.push([1,0]);

			lineFunc.attr("d", line(data1.data));
			shadeFunc.attr("d", line(data2.data));
			selectFunc.attr("d", line(data.data));	
		}
function makeLog() {



	if(!para.logged) {
		para.logged = true;
		x = genX();
		data1 = genData(n=para.n, d=para.d);
		data2 = genData(n=para.n, d=para.d);
		data2.data.unshift([x_min, 0]);
		data2.data.push([1, 0]);

		lineFunc.attr("d", line(data1.data));
		shadeFunc.attr("d", line(data2.data));
		selectFunc.attr("d", line(data.data));	

		xScale = d3.scale.log().domain([x_min, x_max]).range([0, w]);
		xAxis.scale(xScale).ticks(20, "r").tickValues(function() {
					  	if(ww > 767) {
								return [0.001, 0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
							} else {
								return [0.05, 0.2, 0.4, 0.6, 0.8, 1]
							}

					  });
		;
		xAx.transition().duration(1000).call(xAxis);
		brush.x(xScale);
		d3.select("#alpha")
			.transition()
			.duration(1000)
			.attr("x1", xScale(0.05))
			.attr("x2", xScale(0.05))
			.attr("y1", yScale(0))
			.attr("y2", -h);

		lineFunc.transition().duration(1000).attr("d", line(data1.data));
		shadeFunc.transition().duration(1000).attr("d", line(data2.data));
		selectFunc.transition().duration(1000).attr("d", line(data.data));	

		xLAb.text("Log₁₀ p-values");

	      d3.select(".grid").transition().call(make_x_axis()
        		.ticks(10)
        		.tickSize(h, 0, 0)
      			.tickFormat("")
      			);

    if(para.lwr == 0) {

		var start = 1e-3
			console.log(start)
	} else {
		var start = para.lwr;
	}

		brush.extent([start, para.upr]);
		gBrush.call(brush);


	    bLAb.transition().duration(1000)
			.attr("x", brushMiddle());



	brushRect.transition().duration(1000)
		.attr("x", xScale(start))
	    .attr("width", function() {
	    	ex = brush.extent();
	    	return xScale(ex[1])-xScale(start);
	    });

		d3.select("#log").text("Unlog x-axis");


} else if(para.logged) {
				para.logged = false;
			xScale = d3.scale.linear().domain([x_min, x_max]).range([0,w]);
		xAxis.scale(xScale).ticks("r").tickValues(function() {
					  	if(ww > 767) {
								return [0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
							} else {
								return [0.05, 0.2, 0.4, 0.6, 0.8, 1]
							}

					  });
		
		xAx.transition().duration(1000).call(xAxis);

		lineFunc.transition().duration(1000).attr("d", line(data1.data));
		shadeFunc.transition().duration(1000).attr("d", line(data2.data));
		selectFunc.transition().duration(1000).attr("d", line(data.data)).each("end", cleanUp);	

			brush.x(xScale);
		d3.select("#alpha")
			.transition()
			.duration(1000)
			.attr("x1", xScale(0.05))
			.attr("x2", xScale(0.05))
			.attr("y1", yScale(0))
			.attr("y2", -h);

		

		xLAb.text("p-values");

		      d3.select(".grid").transition().call(make_x_axis()
        		.ticks(10)
        		.tickSize(h,0,0)
      			.tickFormat("")
      			);

		brush.extent([para.lwr, para.upr]);
		gBrush.call(brush);

		    bLAb.transition().duration(1000)
			.attr("x", brushMiddle());

			brushRect.transition().duration(1000)
		.attr("x", xScale(brush.extent()[0]))
	    .attr("width", function() {
	    	ex = brush.extent();
	    	return xScale(ex[1])-xScale(ex[0]);
	    });




	d3.select("#log").text("Log x-axis");
}


}

// Line function
var line = d3.svg.line()
			.x(function(d) { 
			 return	xScale(d[0])

			})
			.y(function(d) { 
				return yScale(d[1]);
			});

var brush = d3.svg.brush()
    .x(xScale)
    .extent([0.1, 0.2])
    .on("brush", brushmove); 

var zoomListener = d3.behavior.zoom()
  .scaleExtent([0.1, 10])
  .y(yScale)
  .on("zoom", zoom);


// Append SVG
var svg = d3.select("#viz")
			.append("svg")
			.attr("height", h + margin.top + margin.bottom)
			.attr("width", w + margin.left + margin.right)
			.attr("id", "SVG-container")
			.call(zoomListener);


var dists = svg.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");				

dists.append("rect")
	.attr("class", "bg")
    .attr("width", w)
    .attr("height",h);


var brushRect = g.append("rect")
 	.attr("transform", "translate(0," + (h) + ")")
	.attr("id", "brush-vis")
	.attr("y", 0)
	.attr("x", xScale(brush.extent()[0]))
    .attr("height", 40)
    .attr("width", function() {
    	ex = brush.extent();
    	return xScale(ex[1])-xScale(ex[0]);
    })

function brushMiddle() {
	var ex = brush.extent();
	return (xScale(ex[0]) + xScale(ex[1]))/2;
}

var bLAb = g.append("text")
	.attr("transform", "translate(0," + (h) + ")")
	.attr("id", "bLab")
	.attr("text-anchor", "middle")
	.attr("x", xScale(brushMiddle()))
    .attr("y", 35)
    .attr("dy", 0)
    .text(para.lwr + " < p < " + para.upr)

var xLAb = g.append("text")
	.attr("transform", "translate(0," + (h) + ")")
	.attr("id", "xLab")
	.attr("text-anchor", "middle")
	.attr("x", xScale(0.5))
    .attr("y", 50)
    .attr("dy", 0)
    .text("p-values")

var yLAb = g.append("text")
	.attr("transform", "rotate(-90)")
	.attr("id", "yLab")
	.attr("text-anchor", "middle")
	.attr("x", -(h/2))
    .attr("y", -20)
    .attr("dy", 0)
    .text("Density")

// var lLwr = dists.append("line")
// 	.attr("id", "lLwr")
// 	.attr("x1", xScale(para.lwr))
// 	.attr("x2", xScale(para.lwr))
// 	.attr("y1", h)
// 	.attr("y2", h+40);

//Define X axis

function make_x_axis() {
    return d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(5)
}
var xAxis = d3.svg.axis()
				  .scale(xScale)
				  .orient("bottom")
				  .ticks(20)
				  .tickValues(function() {
				  	if(ww > 767) {
							return [0.01, 0.05, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
						} else {
							return [0.05, 0.2, 0.4, 0.6, 0.8, 1]
						}

				  });
	

var yAxis = d3.svg.axis()
    .scale(yScale)
    .ticks(5)
    .orient("left");


var xAx = g.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + (h) + ")")
	.call(xAxis);

var yAx = g.append("g")
      .attr("class", "y axis")
      .call(yAxis);

var gBrush = g.append("g")
	.attr("transform", "translate(0," + (h) + ")")
    .attr("class", "brush")
    .call(brush)
    .on('mousedown.zoom',null);

gBrush.selectAll("rect")
	.attr("id", "test2")
	.attr("y", 0)
    .attr("height", 40);


// Append dists
var t = textures.lines()
  .thicker(1).stroke("#6C7A89");

dists.call(t);

var t2 = textures.lines()
	.thicker(2)
	.stroke("#6C7A89");

dists.call(t2);

svg.append("circle")
  .style("fill", t.url());
var shadeFunc = dists.append("path")
	.attr("id", "shade")
	.attr("d", line(data2.data))
	.style("fill", t.url());

// change
function make_x_axis() {
    return d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(20)
}

 dists.append("g")         
        .attr("class", "grid")
        .call(make_x_axis()
        		.ticks(10)
        		.tickSize(h,0,0)
      			.tickFormat("")
      			);


var selectFunc = dists.append("path")
					.attr("id","section")
					.style("fill", t2.url());



var lineFunc = dists.append("path")
	.attr("d", line(data1.data))
	.attr("id","dist1");


dists.append("line")
	.attr("id", "alpha")
	.attr("x1", xScale(0.05))
	.attr("x2", xScale(0.05))
	.attr("y1", yScale(0))
	.attr("y2", -h)


var chart_w = $("#donut-power").width();

	var chart = donut()
              .$el(d3.select("#donut-power"))
              .width(chart_w)
              .height(chart_w)
              .data(power()/100)
              .render();
var chart2 = donut()
              .$el(d3.select("#donut-power2"))
               .width(chart_w)
                .height(chart_w)
                .data(get_sect())
              .render();

function updateLine(d, n) {
	x = genX();
	if(!(para.old_d < 1.5 && d < 1.5) && !(para.old_d > 1.5 && d > 1.5) && para.logged) {
		data1 = genData(n=para.n, d=para.old_d);
		data2 = genData(n=para.n, d=para.old_d);
		data2.data.unshift([x_min, 0]);
		data2.data.push([1,0]);

			lineFunc.attr("d", line(data1.data));
			shadeFunc.attr("d", line(data2.data));

	}
	data1 = genData(n=para.n, d=para.d);
	data2 = genData(n=para.n, d=para.d);
	data2.data.unshift([x_min, 0]);
	//data2.data.unshift([0, yScale(y_max)]);
	data2.data.push([1,0]);
	
	lineFunc
		.transition()
		.duration(600)
		.attr("d", line(data1.data));

	shadeFunc
		.transition()
		.duration(600)
		.attr("d", line(data2.data))
		.each("end", function() { $(".dist1-tmp").hide(); });

	d == 0 ? $("#power").text("Type 1 error") : $("#power").text("Power") 

	$("#ES_lab").text(d);
	$("#n_lab").text(n);
	test(transition=true);

	p = power()/100;
	chart.label(d3.round(p*100, 2)).data(p).render();



}
	tmp_line = dists.append("path").attr("class","dist1-tmp");
function tmp_line_start(d, n) {
	para.old_d = para.d;
	para.d = d;
	para.n = n;
	data1 = genData(n=para.n, d=para.d);
	$(".dist1-tmp").show();
	tmp_line
		.attr("d", line(data1.data));
}

function tmp_line_slide(d, n) {
	para.d = d;
	para.n = n;
	data1 = genData(n=para.n, d=para.d);
	tmp_line
		.attr("d", line(data1.data));
}



function brushmove() {
	extent = brush.extent();

	// if moving
	// if (d3.event.mode === "move") {
	// 	para.lwr = d3.round(extent[0], 2);
	// 	para.upr = para.lwr + (extent[1] - extent[0]);

	// } else {
	// 	para.lwr = d3.round(extent[0], 2);
	// 	para.upr = d3.round(extent[1], 2);
	// }

	// round based on log
	var rn = Math.abs(Math.floor(Math.log(extent[0])/Math.log(10))),
		rn1 = Math.abs(Math.floor(Math.log(extent[1])/Math.log(10)));

	// if moving
	if (d3.event.mode === "move") {
		if(para.logged) {
			xwidth = xScale(extent[1]) - xScale(extent[0]);
			para.lwr = d3.round(extent[0], rn);
			para.upr = xScale.invert(xScale(para.lwr) + xwidth);
		} else {
			para.lwr = d3.round(extent[0], 2);
			para.upr = d3.round(extent[1], 2);
		}

	} else {
			if(para.logged) {
				
				para.lwr = d3.round(extent[0], rn);
				para.upr = d3.round(extent[1], rn1);

			} else {
					para.lwr = d3.round(extent[0], 2);
					para.upr = d3.round(extent[1], 2);
			}

	}

	
	brushRect
	.attr("x", xScale(para.lwr))
    .attr("width", function() {
    	return xScale(para.upr)-xScale(para.lwr);
    })

	var lwr = para.lwr  == 1e-3 ? 0 : para.lwr;
	$("#inputLwr").val(lwr, 3);
	$("#inputUpr").val(para.upr, 3);
	d3.select(this).call(brush.extent([para.lwr, para.upr]));
	test();

	
}



function zoom() {
	scale = zoomListener.scale();
	yScale.domain([0, y_max * scale]);
	yAx.call(yAxis);
	lineFunc.attr("d", line(data1.data));
	shadeFunc.attr("d", line(data2.data));
	selectFunc.attr("d", line(data.data));	
}

function test(transition) {


	var x2 = [];
	if(para.lwr == 0) {
		var start = 1e-3;
	} else {
		var start = para.lwr;
	}
	for (var i = start; i <= para.upr; i += incr(i) ) {
		x2.push(i);
	}

	x2.push(para.upr);

	var y = [];
	for(var i = 0; i < x2.length; i++) {
		y.push(pdist(x2[i], para.n, para.d));
	}
	var tmp = [];
		for(var i = 0; i < x2.length; i++) {
			tmp.push([x2[i], y[i]]);
		}
	data = {
		data: tmp,
		x: x2,
		y: y
	};
	data.data.unshift([start, 0]);
	data.data.push([para.upr, 0]);
	
	if(transition == true) {
		selectFunc
			.transition()
			.duration(600)
			.attr("d", line(data.data));
	} else {
		selectFunc
			.attr("d", line(data.data));
	}


	var d = para.d;
	var n = para.n;
	sect = get_sect();
	$("#text_section").text(d3.round(sect*100, 2));
	chart2.label(d3.round(sect*100, 2)).data(sect).render();

	bLAb
		.attr("x",brushMiddle())
	    .text(d3.round(para.lwr,4) + " < p < " + d3.round(para.upr, 4))
}
d3.select("#set_lim").on('click', function() {
	var lwr =  Number($("#inputLwr").val());
	var upr = Number($("#inputUpr").val());

    lwr = lwr > upr ? upr : lwr;
    upr = upr < lwr ? lwr : upr;

	para.lwr = lwr < 0 ? 0 : lwr;
	para.lwr = lwr > 1 ? 1 : para.lwr;
	para.upr = upr > 1 ? 1 : upr;
	para.upr = upr < 0 ? 0 : para.upr;

	Number($("#inputLwr").val(para.lwr));
	Number($("#inputUpr").val(para.upr));


	if(para.lwr == 0) {
		var start = x_min;
	} else {
		var start = para.lwr;
	}

	brushRect
		.attr("x", xScale(start))
	    .attr("width", function() {
	    	return xScale(para.upr)-xScale(start);
	    })

	brush.extent([start, para.upr]);
	gBrush.call(brush);    

	test();

});
d3.select("#inputMaxn").on('change', function() {
	var maxn = Number($("#inputMaxn").val());
	maxn = maxn < 6 ? 6 : maxn;
	$("#inputMaxn").val(maxn)
	$slider2.slider({max:  maxn});

});
d3.select("#set_max_n").on('click', function() {
	var maxn = Number($("#inputMaxn").val());
	maxn = maxn < 6 ? 6 : maxn;
		$("#inputMaxn").val(maxn)

	$slider2.slider({max:  maxn});

});



d3.select("#rescale").on("click", rescale);
d3.select("#log-toggle").on("click", makeLog);

function rescale() {
	zoomListener.scale(1);
	if(para.logged) {
		y_max = para.d == 0 ? 8 : pdist(0.0001, para.n, para.d);
	} else {
			y_max = para.d == 0 ? 8 : pdist(0.005, para.n, para.d);
	}

	yScale.domain([0, y_max]);	
	yAx.transition().call(yAxis);
	lineFunc.transition().attr("d", line(data1.data));
	shadeFunc.transition().attr("d", line(data2.data));
	selectFunc.transition().attr("d", line(data.data));	

}

function get_sect() {

	var lwr = para.lwr == 1e-3 ? 0 : para.lwr;
	
	return (1 - jStat.normal.cdf(para.d * Math.sqrt(para.n/2) + jStat.normal.inv(1-para.upr/2, 0, 1), 0, 1) + jStat.normal.cdf(para.d * Math.sqrt(para.n/2) - jStat.normal.inv(1-para.upr/2, 0, 1), 0 ,1)) - 
		(1 - jStat.normal.cdf(para.d * Math.sqrt(para.n/2) + jStat.normal.inv(1-lwr/2, 0, 1), 0, 1) + jStat.normal.cdf(para.d * Math.sqrt(para.n/2) - jStat.normal.inv(1-lwr/2, 0, 1), 0 ,1));

}

// donut charts
function donut(){  
  // Default settings
  var $el = d3.select("body")
  var data = {};


  // var showTitle = true;
  var width = 500;
      height = 400,
      radius = Math.min(width, height) / 2;

  var currentVal;
  var color = d3.scale.category20();
  var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.value; });

  var svg, g, arc; 


  var object = {};

  // Method for render/refresh graph
  object.render = function(){
    if(!svg){
      arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - (radius/5));

      svg = $el.append("svg")
        .attr("width", width)
        .attr("height", height)
      .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

      g = svg.selectAll(".arc")
        .data(pie(d3.entries([data, 1-data])))
	      .enter().append("g")
	      .attr("class", "arc");

      g.append("path")
        // Attach current value to g so that we can use it for animation
        .each(function(d) { this._current = d; })
        .attr("d", arc)
        .attr("class", function(d,i) { return "donut"+i });
      
       g.append("text")
    			.attr("class", "perc")
    			.attr("text-anchor","middle")
    			.attr("x", 0)
    			.attr("y", 0)
    			.attr("dy", "0.35em")
    			.style("font-size", w/40)
       			.text(d3.round(data*100, 2) + " %");

  

    }else{
      g.data(pie(d3.entries([data, 1-data]))).exit().remove();

      g.select("path")
      .transition().duration(200)
      .attrTween("d", function(a){
        var i = d3.interpolate(this._current, a);
        this._current = i(0);
        return function(t) {
            return arc(i(t));
        };
      })

      g.select("text")
      	.text(d3.round(data*100,2) + " %");
    }      
    return object;
  };

  // Getter and setter methods
  object.data = function(value){
    if (!arguments.length) return data;
    data = value;
    return object;
  };

  object.$el = function(value){
    if (!arguments.length) return $el;
    $el = value;
    return object;
  };

  object.width = function(value){
    if (!arguments.length) return width;
    width = value;
    radius = Math.min(width, height) / 2;
    return object;
  };

  object.height = function(value){
    if (!arguments.length) return height;
    height = value;
    radius = Math.min(width, height) / 2;
    return object;
  };
  object.label = function(value) {
  	 if (!arguments.length) return 0;
  	label = value
  	return object;
  }

  return object;
};
test();




// resize
