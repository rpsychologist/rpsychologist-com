	
var para = {
	mu1: 0,
	sigma1: 1,
	df: 1};


var $slider = $("#slider");
if ($slider.length > 0) {
  $slider.slider({
    min: 1,
    max: 100,
    value: para.df,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 1,
	change: function(event, ui) {sliderChange(ui.value);},
	slide: function(event, ui) {
		$(".tooltip-inner").text(ui.value);},
	start: function(event, ui) {tooltip.tooltip("show"); $(".tooltip-inner").text(ui.value)},
	stop: function() {tooltip.tooltip("hide")}
	 });
	}

$slider.find(".ui-slider-handle").append("<div class='slide-tooltip'/>");

var tooltip = $(".slide-tooltip").tooltip( {title: $("#slider").slider("value"), trigger: "manual"});


// plot dimensions
var bodyw = parseInt(d3.select('body').style('width'), 10);
 if(bodyw < 767) {
	var aspect = 0.6;
	var margin = {top: 40, right: 15, bottom: 20, left: 15};
} else {
	var aspect = 0.4;
	var margin = {top: 40, right: 20, bottom: 30, left: 20};
}

var	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
var	h = aspect*w-margin.top - margin.left;

var xmin = -5,
	xmax = 5;

// x.values 
		var x = [];
		for (var i = xmin; i <= xmax; i += 0.01) {
			x.push(i);
		}
	

// Generates data
function genData(mu, sigma) {
	
		var y = [];
		for(var i = 0; i < x.length; i++) {
			y.push(jStat.normal.pdf(x[i], mu, sigma));
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
function genDataT(df) {
	
		var y = [];
		for(var i = 0; i < x.length; i++) {
			y.push(jStat.studentt.pdf(x[i], df));
		}

		var tmp = [];
			for(var i = 0; i < x.length; i++) {
				tmp.push([x[i], y[i]]);
			}
			tmp.unshift([xmin,0]);
			tmp.push([xmax,0]);
		var data = {
			data: tmp,
			x: x,
			y: y
		};
	return data;
}	
	
// Data sets
var data1 = genData(para.mu1, para.sigma1),
	data2 = genDataT(para.df);

function genDataPoly() {
	var poly = [];
for(var i = 0; i < data1.data.length; i++) {
	
	var tmp_y = Math.max(data1.y[i], data2.y[i]),
		tmp_x = data1.x[i];

	var tmp =  [tmp_x,tmp_y];

	poly.push(tmp);
}
poly.unshift([xmin, 0]);
poly.push([xmax, 0]);
return poly;
}

var poly = genDataPoly();

// Axes min and max
var y_max = d3.max([d3.max(data1.y), d3.max(data2.y)]);


// Create scales
var xScale = d3.scale.linear().domain([xmin, xmax]).range([0,w]);
var yScale = d3.scale.linear().domain([0, y_max]).range([0,h]);

// Line function
var line = d3.svg.line()
			.x(function(d) { 
			 return	xScale(d[0])

			})
			.y(function(d) { 
				return h-yScale(d[1]);
			})

// Append SVG
var svg = d3.select("#viz")
			.append("svg")
			.attr("height", h + margin.top + margin.bottom)
			.attr("width", w + margin.left + margin.right)
			.attr("id", "SVG-container");


var dists = svg.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				

var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");				



//Define X axis
var xAxis = d3.svg.axis()
				  .scale(xScale)
				  .orient("bottom")
				   .tickSize(5);

var xAx = dists.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + (h) + ")")
	.call(xAxis);


// legend
g.append("svg:text")
	.attr("class", "legend")
	.attr("x", 25)
	.attr("y", 0)
	.text("t-distribution");

g.append("svg:line")
	.attr("class","dist2")
	.attr("x1", 0)
	.attr("x2", 20)
	.attr("y1", -5)
	.attr("y2", -5);

g.append("svg:text")
	.attr("class", "legend")
	.attr("x", 25)
	.attr("y", 15)
	.text("Normal distribution");	

g.append("svg:line")
	.attr("class","dist1")
	.attr("x1", 0)
	.attr("x2", 20)
	.attr("y1", 10)
	.attr("y2", 10);	

// fills
var t = textures.lines()
    .size(8)
    .strokeWidth(2).stroke("#6C7A89");

dists.call(t);

// Append dists

// clip-path
  var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "0")
        .attr("width", xScale(-1.644))
        .attr("height", h);

var overlap = dists.append("svg:path")
	.attr("fill", t.url())
	.attr("d", line(poly))
	.attr("class", "poly")
	.attr("clip-path", "url(#clip)");
var dist2 = dists.append("svg:path")
	.attr("d", line(data2.data))
	.attr("id","dist2");
var dist1 = dists.append("svg:path")
	.attr("d", line(data1.data))
	.attr("id","dist1");


// pnorm
	var zq = jStat.normal.cdf(-1.6444, 0, 1);
	var tq = jStat.studentt.cdf(-1.6444, para.df);

 if(bodyw < 767) {
 		var pw = 20,
 			px1 = w-40;
 } else {
 	var pw = 100,
 		 px1 = w-140;
 }


var labQ = g.append("svg:text")
	.attr("id", "labQ")
	.attr("class", "pnorm")
	.attr("text-anchor", "middle")
	.attr("x", px1+(pw/2))
	.attr("y", 5)
	.text("P(X < -1.644)");

var labQt = g.append("svg:text")
	.attr("class", "pnorm")
	.attr("text-anchor", "end")
	.attr("x", px1-10)
	.attr("y", 25)
	.text("t-dist");

var rectQtBq = g.append("svg:rect")
	.attr("class", "pnormBg")
	.attr("x", px1)
	.attr("y", 15)
	.attr("width", pw)
	.attr("height", 10);	

var rectQt = g.append("svg:rect")
	.attr("class", "pnorm")
	.attr("x", px1)
	.attr("y", 15)
	.attr("width", tq*pw)
	.attr("height", 10);	

var labQtp = g.append("svg:text")
	.attr("class", "pnorm")
	.attr("text-anchor", "start")
	.attr("x", px1+pw+10)
	.attr("y", 25)
	.text(d3.round(tq,3));

var labQz = g.append("svg:text")
	.attr("class", "pnorm")
	.attr("text-anchor", "end")
	.attr("x", px1-10)
	.attr("y", 45)
	.text("Normal");

var rectQzBg = g.append("svg:rect")
	.attr("class", "pnormBg")
	.attr("x", px1)
	.attr("y", 35)
	.attr("width", pw)
	.attr("height", 10);	

var rectQz = g.append("svg:rect")
	.attr("class", "pnorm")
	.attr("x", px1)
	.attr("y", 35)
	.attr("width", pw*zq)
	.attr("height", 10);	

var labQzp = g.append("svg:text")
	.attr("class", "pnorm")
	.attr("text-anchor", "start")
	.attr("x", px1+pw+10)
	.attr("y", 45)
	.text(d3.round(zq,3));

var cohend_float = g.append("text")
					.attr("class", "cohen_float")
					.attr("text-anchor", "middle")
					.attr("x", xScale(0))
					.attr("y", (-20))
					.text("Degrees of freedom: "+para.df);							


var brush = d3.svg.brush()
    .x(xScale)
    .extent([0, 0])
    .on("brush", brushed)
    .on("brushend", brushed); // safari workaround

    dists.call(brush);

cutline = g.append("svg:line")
	.attr("id","drag")
	.attr("x1", xScale(-1.644))
	.attr("x2", xScale(-1.644))
	.attr("y1", 0)
	.attr("y2", h);

function updateP(value) {
	zq = jStat.normal.cdf(value, 0, 1),
	tq = jStat.studentt.cdf(value, para.df);

  labQ.text("P(X < " + d3.round(value, 2) +")");

	rectQt.transition()
		.attr("width", tq*pw);	

	labQtp.text(d3.round(tq, 3));

	rectQz.transition()
		.attr("width", pw*zq);

	labQzp.text(d3.round(zq,3));
}



function brushed() {
  var value = brush.extent()[0];

  if (d3.event.sourceEvent) { // not a programmatic event
    value = xScale.invert(d3.mouse(this)[0]);
    brush.extent([value, value]);
  }

  cutline
  	.attr("x1", xScale(value))
  	 .attr("x2", xScale(value));

  clip.attr("width", xScale(value));	 

  updateP(value);
	
}


// qqplot
	var qq = {};
	 if(parseInt(d3.select('body').style('width'), 10) < 767) {
		qq.margin = {top: 5, right: 0, bottom: 25, left: 20, aspect: 1};
} else {
	 qq.margin = {top: 10, right: 10, bottom: 40, left: 35, aspect: 0.8};
}
    
    qq.w = parseInt(d3.select('#qqplot').style('width'), 10)*qq.margin.aspect - qq.margin.left - qq.margin.right;
    qq.h = parseInt(d3.select('#qqplot').style('width'), 10)*qq.margin.aspect - qq.margin.top - qq.margin.bottom;

    qq.x_scale = d3.scale.linear()
        .range([0, qq.w]);

    qq.y_scale = d3.scale.linear()
        .range([qq.h, 0]);

    qq.xAxis = d3.svg.axis()
    .scale(qq.x_scale)
    .ticks(5)
    .orient("bottom");

 qq.yAxis = d3.svg.axis()
    .scale(qq.y_scale)
    .ticks(5)
    .orient("left");
    
    qq.svg = d3.select("#qqplot").append("svg")
    .attr("id", "qqsvg")
    .attr("width", qq.w + qq.margin.left + qq.margin.right)
    .attr("height", qq.w + qq.margin.top + qq.margin.bottom);
  qq.g = qq.svg.append("g")
    .attr("transform", "translate(" + qq.margin.left + "," + qq.margin.top + ")");   

qq.x_scale.domain([-3,3]);
qq.y_scale.domain([-3,3]);

    qq.xAx =  qq.g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + qq.h + ")")
      .call(qq.xAxis);

  qq.yAx = qq.g.append("g")
      .attr("class", "y axis")
      .call(qq.yAxis);

qq.gridX = qq.g.append("g")         
        .attr("class", "grid")
        .attr("transform", "translate(0," + qq.h + ")")
        .call(qq.xAxis
            .tickSize(-qq.h, 0, 0)
            .tickFormat("")
        )

qq.gridY = qq.g.append("g")         
        .attr("class", "grid")
        .call(qq.yAxis
            .tickSize(-qq.w, 0, 0)
            .tickFormat("")
        )


function genqqT(df) {
	var t = [];
	for(var i = 0.001; i < 1; i += 0.001) {
		
		var tmp_y = jStat.studentt.inv(i, para.df),
			tmp_x = jStat.normal.inv(i, 0,1);

	if(i < 0.5) {
		tmp_y = -tmp_y;
	}

		var tmp =  [tmp_x,tmp_y];

		t.push(tmp);
	}
	return t;

}

qq.line = d3.svg.line()
			.x(function(d) { 
			 return	qq.x_scale(d[0])

			})
			.y(function(d) { 
				return qq.y_scale(d[1]);
			})

qq.t = genqqT(para.df);


var qqz = qq.g.append("svg:line")
	.attr("id","qq-lineZ")
	.attr("x1", qq.x_scale(-3))
	.attr("y1", qq.y_scale(-3))
	.attr("x2", qq.x_scale(3))
	.attr("y2", qq.y_scale(3))

	var qqt = qq.g.append("svg:path")
	.attr("d", qq.line(qq.t))
	.attr("id","qq-line");
						

// relative error
	var rel = {};
    rel.margin = qq.margin,
    rel.w = parseInt(d3.select('#relplot').style('width'), 10) * rel.margin.aspect - rel.margin.left - rel.margin.right,
    rel.h = parseInt(d3.select('#relplot').style('width'), 10) * rel.margin.aspect - rel.margin.top - rel.margin.bottom;

    rel.x_scale = d3.scale.linear()
        .range([0, rel.w]);

    rel.y_scale = d3.scale.linear()
        .range([rel.h, 0]);

    rel.xAxis = d3.svg.axis()
    .scale(rel.x_scale)
    .ticks(5)
    .orient("bottom");

 rel.yAxis = d3.svg.axis()
    .scale(rel.y_scale)
    .ticks(5)
    .orient("left");
    
    rel.svg = d3.select("#relplot").append("svg")
    .attr("id", "relsvg")
    .attr("width", rel.w + rel.margin.left + rel.margin.right)
    .attr("height", rel.w + rel.margin.top + rel.margin.bottom);
  
  rel.g = rel.svg.append("g")
    .attr("transform", "translate(" + rel.margin.left + "," + rel.margin.top + ")");   

rel.x_scale.domain([0,8]);
rel.y_scale.domain([0,1]);

    rel.xAx =  rel.g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + rel.h + ")")
      .call(rel.xAxis);

 rel.yAx = rel.g.append("g")
      .attr("class", "y axis")
      .call(rel.yAxis);


rel.gridX = rel.g.append("g")         
        .attr("class", "grid")
        .attr("transform", "translate(0," + rel.h + ")")
        .call(rel.xAxis
            .tickSize(-rel.h, 0, 0)
            .tickFormat("")
        );

rel.gridY = rel.g.append("g")         
        .attr("class", "grid")
        .call(rel.yAxis
            .tickSize(-rel.w, 0, 0)
            .tickFormat("")
        );

rel.lab = rel.g.append("svg:text")
	.attr("class", "plotLab")
	.attr("text-anchor", "middle")
	.attr("x", rel.x_scale(4))
	.attr("y", rel.h + rel.margin.bottom)
	.text("P(X > x)");        	

rel.line = d3.svg.line()
			.x(function(d) { 
			 return	rel.x_scale(d[0])

			})
			.y(function(d) { 
				return rel.y_scale(d[1]);
			});

function genError(df) {
	var t = { abs : [],
			  rel : []};

	for(var i = 0; i <= 8; i += 0.01) {
		var et = 1-jStat.studentt.cdf(i, para.df),
			ez = 1-jStat.normal.cdf(i, 0, 1);
		
		var rel_y = Math.abs(et - ez) / et,
			rel_x = i;

		var abs_y = Math.abs(et - ez);

		t.rel.push([rel_x,rel_y]);
		t.abs.push([rel_x, abs_y])
	}
	return t;

}
rel.t = genError(para.df);


var relt = rel.g.append("svg:path")
	.attr("d", rel.line(rel.t.rel))
	.attr("id","rel-line");
					



// absolute error
	var abs = {};
    abs.margin = qq.margin,
    abs.w = parseInt(d3.select('#absplot').style('width'), 10) * abs.margin.aspect - abs.margin.left - abs.margin.right,
    abs.h = parseInt(d3.select('#absplot').style('width'), 10) * abs.margin.aspect - abs.margin.top - abs.margin.bottom;

    abs.x_scale = d3.scale.linear()
        .range([0, abs.w]);

    abs.y_scale = d3.scale.linear()
        .range([abs.h, 0]);

    abs.xAxis = d3.svg.axis()
    .scale(abs.x_scale)
    .ticks(5)
    .orient("bottom");

 abs.yAxis = d3.svg.axis()
    .scale(abs.y_scale)
    .ticks(5)
    .orient("left");
    
    abs.svg = d3.select("#absplot").append("svg")
    .attr("id", "abssvg")
    .attr("width", abs.w + abs.margin.left + abs.margin.right)
    .attr("height", abs.w + abs.margin.top + abs.margin.bottom)
  abs.g = abs.svg
	  .append("g")
	    .attr("transform", "translate(" + abs.margin.left + "," + abs.margin.top + ")");   

abs.x_scale.domain([0,5]);

var max = d3.max(rel.t.abs, function(d) {
  return d3.max(d.slice(1));
});
abs.y_scale.domain([0, max]);

abs.xAx =  abs.g.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + abs.h + ")")
  .call(abs.xAxis);

 abs.yAx = abs.g.append("g")
      .attr("class", "y axis")
      .call(abs.yAxis);

abs.gridX = abs.g.append("g")         
        .attr("class", "grid")
        .attr("transform", "translate(0," + abs.h + ")")
        .call(abs.xAxis
            .tickSize(-abs.h, 0, 0)
            .tickFormat("")
        );

abs.gridY = abs.g.append("g")         
        .attr("class", "grid")
        .call(abs.yAxis
            .tickSize(-abs.w, 0, 0)
            .tickFormat("")
        );

abs.lab = abs.g.append("svg:text")
	.attr("class", "plotLab")
	.attr("text-anchor", "middle")
	.attr("x", abs.x_scale(2.5))
	.attr("y", abs.h + abs.margin.bottom)
	.text("P(X > x)");  

abs.line = d3.svg.line()
			.x(function(d) { 
			 return	abs.x_scale(d[0])

			})
			.y(function(d) { 
				return abs.y_scale(d[1]);
			});


var abst = abs.g.append("svg:path")
	.attr("d", abs.line(rel.t.abs))
	.attr("id","abs-line");

						




function reDrawDist2(newdata) {
	 dists.select("#dist2")
		.transition()
		.duration(600)
		.attr("d", line(data2.data));
}
function reDrawDist1(newdata) {
	 dists.select("#dist1")
		.transition()
		.duration(600)
		.attr("d", line(data1.data));
}
function reDrawDistPoly(newdata) {
	 overlap
		.transition()
		.duration(600)
		.attr("d", line(poly));
}

function sliderChange(value) {
	  var old_df = para.df;
	  para.df = value;
	  data2 = genDataT(para.df);
	  rel.t = genError(para.df);
	  poly = genDataPoly();

		// redraw dist
		//reDrawDist1();
		reDrawDist2();
		reDrawDistPoly();

		qq.t = genqqT(para.df);
		qqt.transition()
			.duration(600)
			.attr("d", qq.line(qq.t));

		relt.transition()
				.duration(600)
				.attr("d", rel.line(rel.t.rel));

abst.transition()
	.duration(600)
	.attr("d", abs.line(rel.t.abs));

  updateP(xScale.invert(cutline.attr("x1")));

		cohend_float
			.transition()
			.duration(500)
			.tween("text", function() {
			  var i = d3.interpolate(old_df, para.df);
			  return function(t) {
			    this.textContent = "Degrees of freedom: " + d3.round(i(t));
			  }});					
										
	};	





// resize
$(window).on("resize", resize);

function resize() {

var bodyw = parseInt(d3.select('body').style('width'), 10);
 if(bodyw < 767) {
	var aspect = 0.6;
	var margin = {top: 40, right: 15, bottom: 20, left: 15};
} else {
	var aspect = 0.4;
	var margin = {top: 40, right: 20, bottom: 30, left: 20};
}



	var margin = {top: 40, right: 20, bottom: 30, left: 20},
 	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
	h = aspect*w-margin.top - margin.left;

 if(bodyw < 767) {
 			 pw = 20,
 			px1 = w-40;
 } else {
 		 pw = 100,
 		 px1 = w-140;
 }
	
	// Scales
	xScale.range([0,w]);
	yScale.range([0,h]);
	
	
	// Axis
	xAx.attr("transform", "translate(0," + h + ")")
		.call(xAxis);  
	
	// do the actual resize...
	svg.attr("width", w + margin.left + margin.right)
		.attr("height", h + margin.top + margin.bottom);
		
		
	dist1
	.attr("d", line(data1.data));

	dist2
	.attr("d", line(data2.data));
		
	overlap
		.attr("d", line(poly));	

cutline
	.attr("x1", xScale(-1.644))
	.attr("x2", xScale(-1.644))
	.attr("y1", 0)
	.attr("y2", h);





	clip
        .attr("width", xScale(-1.644))
        .attr("height", h);

labQ
	.attr("x", px1+(pw/2));

labQt
	.attr("x", px1-10);

rectQtBq
	.attr("x", px1)
	.attr("width", pw);

rectQt
	.attr("x", px1)
	.attr("width", tq*pw);

labQtp
	.attr("x", px1+pw+10);

labQz
	.attr("x", px1-10);

rectQzBg
	.attr("x", px1)
	.attr("width", pw);

rectQz
	.attr("x", px1)
	.attr("width", pw*zq);

labQzp
	.attr("x", px1+pw+10);




cohend_float.attr("x", xScale(0))
					.attr("y", (-20));
	
    abs.w = parseInt(d3.select('#absplot').style('width'), 10) - abs.margin.left - abs.margin.right,
    abs.h = parseInt(d3.select('#absplot').style('width'), 10) - abs.margin.top - abs.margin.bottom;

    abs.x_scale 
        .range([0, abs.w]);

    abs.y_scale
        .range([abs.h, 0]);


    
    abs.svg
    .attr("width", abs.w + abs.margin.left + abs.margin.right)
    .attr("height", abs.w + abs.margin.top + abs.margin.bottom)
  abs.g 
	    .attr("transform", "translate(" + abs.margin.left + "," + abs.margin.top + ")");   


abs.xAx
  .attr("transform", "translate(0," + abs.h + ")")
  .call(d3.svg.axis()
    .scale(abs.x_scale)
    .ticks(5)
    .orient("bottom"));

 abs.yAx
      .call(d3.svg.axis()
    .scale(abs.y_scale)
    .ticks(5)
    .orient("left"));


abs.gridX
        .attr("transform", "translate(0," + abs.h + ")")
        .call(abs.xAxis
            .tickSize(-abs.h, 0, 0)
            .tickFormat("")
        );

abs.gridY
        .call(abs.yAxis
            .tickSize(-abs.w, 0, 0)
            .tickFormat("")
        );

abst.attr("d", abs.line(rel.t.abs));

abs.lab
	.attr("x", abs.x_scale(2.5))
	.attr("y", abs.h + abs.margin.bottom)



		
// rel
	rel.w =abs.w;
	rel.h = abs.h;
    rel.x_scale 
        .range([0, rel.w]);

    rel.y_scale
        .range([rel.h, 0]);


    
    rel.svg
    .attr("width", rel.w + rel.margin.left + rel.margin.right)
    .attr("height", rel.w + rel.margin.top + rel.margin.bottom)
  rel.g 
	    .attr("transform", "translate(" + rel.margin.left + "," + rel.margin.top + ")");   


rel.xAx
  .attr("transform", "translate(0," + rel.h + ")")
  .call(d3.svg.axis()
    .scale(rel.x_scale)
    .ticks(5)
    .orient("bottom"));

 rel.yAx
      .call(d3.svg.axis()
    .scale(rel.y_scale)
    .ticks(5)
    .orient("left"));


rel.gridX
        .attr("transform", "translate(0," + rel.h + ")")
        .call(rel.xAxis
            .tickSize(-rel.h, 0, 0)
            .tickFormat("")
        );

rel.gridY
        .call(rel.yAxis
            .tickSize(-rel.w, 0, 0)
            .tickFormat("")
        );

relt.attr("d", rel.line(rel.t.rel));

rel.lab
	.attr("x", rel.x_scale(4))
	.attr("y", rel.h + rel.margin.bottom);



// Q-Q
	qq.w =abs.w;
	qq.h = abs.h;
    qq.x_scale 
        .range([0, qq.w]);

    qq.y_scale
        .range([qq.h, 0]);


    
    qq.svg
    .attr("width", qq.w + qq.margin.left + qq.margin.right)
    .attr("height", qq.w + qq.margin.top + qq.margin.bottom)
  qq.g 
	    .attr("transform", "translate(" + qq.margin.left + "," + qq.margin.top + ")");   


qq.xAx
  .attr("transform", "translate(0," + qq.h + ")")
  .call(d3.svg.axis()
    .scale(qq.x_scale)
    .ticks(5)
    .orient("bottom"));

 qq.yAx
      .call(d3.svg.axis()
    .scale(qq.y_scale)
    .ticks(5)
    .orient("left"));

qqz
	.attr("x1", qq.x_scale(-3))
	.attr("y1", qq.y_scale(-3))
	.attr("x2", qq.x_scale(3))
	.attr("y2", qq.y_scale(3))

	qqt.attr("d", qq.line(qq.t));

qq.gridX
        .attr("transform", "translate(0," + qq.h + ")")
        .call(qq.xAxis
            .tickSize(-qq.h, 0, 0)
            .tickFormat("")
        );

qq.gridY
        .call(qq.yAxis
            .tickSize(-qq.w, 0, 0)
            .tickFormat("")
        );
			
}
