// fix @power, refactor to beta. 

$("#d_container").hide();

// from https://gist.github.com/borgar/3317728
function uniroot ( func, lowerLimit, upperLimit, errorTol, maxIter ) {
  var a = lowerLimit
    , b = upperLimit
    , c = a
    , fa = func(a)
    , fb = func(b)
    , fc = fa
    , s = 0
    , fs = 0
    , tol_act   // Actual tolerance
    , new_step  // Step at this iteration
    , prev_step // Distance from the last but one to the last approximation
    , p         // Interpolation step is calculated in the form p/q; division is delayed until the last moment
    , q
    ;

  errorTol = errorTol || 0;
  maxIter  = maxIter  || 1000;

  while ( maxIter-- > 0 ) {
  
    prev_step = b - a;
   
    if ( Math.abs(fc) < Math.abs(fb) ) {
      // Swap data for b to be the best approximation
      a = b, b = c, c = a;
      fa = fb, fb = fc, fc = fa;
    }

    tol_act = 1e-15 * Math.abs(b) + errorTol / 2;
    new_step = ( c - b ) / 2;

    if ( Math.abs(new_step) <= tol_act || fb === 0 ) {
      return b; // Acceptable approx. is found
    }

    // Decide if the interpolation can be tried
    if ( Math.abs(prev_step) >= tol_act && Math.abs(fa) > Math.abs(fb) ) {
      // If prev_step was large enough and was in true direction, Interpolatiom may be tried
      var t1, cb, t2;
      cb = c - b;
      if ( a === c ) { // If we have only two distinct points linear interpolation can only be applied
        t1 = fb / fa;
        p = cb * t1;
        q = 1.0 - t1;
      }
      else { // Quadric inverse interpolation
        q = fa / fc, t1 = fb / fc, t2 = fb / fa;
        p = t2 * (cb * q * (q - t1) - (b - a) * (t1 - 1));
        q = (q - 1) * (t1 - 1) * (t2 - 1);
      }

      if ( p > 0 ) {
        q = -q;  // p was calculated with the opposite sign; make p positive
      }
      else {
        p = -p;  // and assign possible minus to q
      }

      if ( p < ( 0.75 * cb * q - Math.abs( tol_act * q ) / 2 ) &&
           p < Math.abs( prev_step * q / 2 ) ) { 
        // If (b + p / q) falls in [b,c] and isn't too large it is accepted
        new_step = p / q;
      }
 
      // If p/q is too large then the bissection procedure can reduce [b,c] range to more extent
    }

    if ( Math.abs( new_step ) < tol_act ) { // Adjust the step to be not less than tolerance
      new_step = ( new_step > 0 ) ? tol_act : -tol_act;
    }

    a = b, fa = fb;     // Save the previous approx.
    b += new_step, fb = func(b);  // Do step to a new approxim.

    if ( (fb > 0 && fc > 0) || (fb < 0 && fc < 0) ) {
      c = a, fc = fa; // Adjust c for it to have a sign opposite to that of b
    }
  }

}


// function getES(alpha, power, n) {
// 	if(para.onetailed) {
// 		var alpha = alpha;
// 	} else {
// 		var alpha = alpha/2;
// 	}
// 	var sigma = 1;
// 	var ES = Math.sqrt((Math.pow((jStat.normal.inv(1 - (alpha), 0, 1) + jStat.normal.inv(power, 0, 1)),2) * Math.pow(sigma, 2))/n);
// 	return ES;
// }
function getZcrit(alpha) {
	if(para.onetailed) {
		alpha = alpha;
	} else {
		alpha = alpha/2;
	}

	return (jStat.normal.inv(1-alpha, 0, para.sigma1));
	
}
function getPower(alpha, d, n) {
	if(para.onetailed) {
		alpha = alpha;
	} else {
		alpha = alpha/2;
	}
	var power = 1-jStat.normal.cdf(jStat.normal.inv(1-alpha, 0,1)*(1/Math.sqrt(n)), mean=d, std=1/Math.sqrt(n));

	if(para.onetailed) {
		return power;
	} else {
		var lwr = jStat.normal.cdf(-1*(jStat.normal.inv(1-(alpha), 0, 1) * (1/Math.sqrt(n))), mean=d, std=1/Math.sqrt(n));
		return power + lwr;
	}	
}

function getN(power,alpha, d) {
	var f = function(n) {return getPower(alpha, d, n=n) - power};
	var n = uniroot(f, 1, 1e6);
	return n;
}
function getAlpha(power,n, d) {
	var f = function(a) {return getPower(alpha=a, d, n) - power};
	var a = uniroot(f, 1e-10, 1 - 1e-10);
	return a;
}
function getES(alpha, power, n) {
	var f = function(d) {return getPower(alpha, d=d, n) - power};
	var d = uniroot(f, 1e-10, 10);
	return d;
}


var para = {
	mu1: 0,
	n: 20,
	alpha: 0.05,
	type1: 0.05,
	type2: 0.2,
	power: 0.8,
	onetailed: false,
	param: "d"};
para.cohend = getES(0.05, 0.8, para.n);	
para.sigma1 = 1/Math.sqrt(para.n); // SE
para.sigma2 = 1/Math.sqrt(para.n);
para.mu2 = para.cohend,
para.z_crit = getZcrit(para.alpha);

d3.select("h4#power").text("Power (1-β = "+ d3.round((para.power), 2) + ")")
d3.select("h4#alpha").text("Significance level (α = 0.05)");	
d3.select("h4#n").text("Sample size (n = "+ d3.round((para.n), 2) + ")");
d3.select("h4#d").text("Effect size (d = "+ d3.round((para.cohend), 2) + ")");


var $slider_power = $("#slider_power");
if ($slider_power.length > 0) {
  $slider_power.slider({
    min: 0.01,
    max: 0.999,
    value: para.power,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 0.01,
	change: function(event, ui) {},
	slide: function(event, ui) {
	 if(ui.value > para.alpha || para.param == "alpha"){
           $(".tooltip-inner").text(ui.value);
        } else {
			return false;
		}
	},
	start: function(event, ui) {tooltip1.tooltip("show"); $(".tooltip-inner").text(ui.value)},
	stop: function(event, ui) {sliderChange(ui.value, para.alpha, para.cohend, para.n);tooltip1.tooltip("hide");}
	 });
	};

var $slider_alpha = $("#slider_alpha");
if ($slider_alpha.length > 0) {
  $slider_alpha.slider({
    min: 0.01,
    max: 0.999,
    value: para.alpha,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 0.01,
	change: function(event, ui) {},
	slide: function(event, ui) {
		 if(ui.value < para.power){
           $(".tooltip-inner").text(ui.value);
        } else {
        	para.power = ui.value+0.01;
        	$slider_power.slider("value", ui.value);
			$(".tooltip-inner").text(ui.value);
		}
	},
	start: function(event, ui) {tooltip2.tooltip("show"); $(".tooltip-inner").text(ui.value)},
	stop: function(event, ui) {sliderChange(para.power, ui.value, para.cohend, para.n); tooltip2.tooltip("hide")}
	 });
	};

var $slider_d = $("#slider_d");
if ($slider_d.length > 0) {
  $slider_d.slider({
    min: 0,
    max: 2,
    value: para.cohend,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 0.01,
	change: function(event, ui) {},
	slide: function(event, ui) {$(".tooltip-inner").text(ui.value)},
	start: function(event, ui) {tooltip3.tooltip("show"); $(".tooltip-inner").text(ui.value)},
	stop: function(event, ui) {sliderChange(para.power, para.alpha, ui.value, para.n); tooltip3.tooltip("hide");}
	 });
	};

var $slider_n = $("#slider_n");
if ($slider_n.length > 0) {
  $slider_n.slider({
    min: 1,
    max: 200,
    value: para.n,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 1,
	change: function(event, ui) {},
	slide: function(event, ui) {$(".tooltip-inner").text(ui.value)},
	start: function(event, ui) {tooltip4.tooltip("show"); $(".tooltip-inner").text(ui.value)},
	stop: function(event, ui) {sliderChange(para.power, para.alpha, para.cohend, ui.value); tooltip4.tooltip("hide");}
	 });
	};	

$slider_power.find(".ui-slider-handle").append("<div id='tooltip_power' class='slide-tooltip'/>");
$slider_alpha.find(".ui-slider-handle").append("<div id='tooltip_alpha' class='slide-tooltip'/>");
$slider_d.find(".ui-slider-handle").append("<div id='tooltip_d' class='slide-tooltip'/>");
$slider_n.find(".ui-slider-handle").append("<div id='tooltip_n' class='slide-tooltip'/>");

 var tooltip1 = $("#tooltip_power").tooltip( {title: $("#slider_power").slider("value"), trigger: "manual"});
 var tooltip2 = $("#tooltip_alpha").tooltip( {title: $("#slider_alpha").slider("value"), trigger: "manual"});
 var tooltip3 = $("#tooltip_d").tooltip( {title: $("#slider_d").slider("value"), trigger: "manual"});
 var tooltip4 = $("#tooltip_n").tooltip( {title: $("#slider_n").slider("value"), trigger: "manual"});






$('#one-tailed').change(function () {

	para.onetailed = true; 
	para.z_crit = jStat.normal.inv(1-(para.alpha), 0, para.sigma1);
	poly_beta = genBetaPoly(para.alpha);
	sliderChange(para.power, para.alpha, para.cohend, para.n);
	text_alpha.text("α");
	

});
$('#two-tailed').change(function () {

	para.onetailed = false; 
	para.z_crit = jStat.normal.inv(1-(para.alpha/2), 0, para.sigma1);
	poly_beta = genBetaPoly(para.alpha);
	sliderChange(para.power, para.alpha, para.cohend, para.n);
	text_alpha.text("α/2");
	
});
$("#zoom-reset").on("click", reset);
$("#radioAlpha").on("ifClicked", toggleAlpha);
$("#radioPower").on("ifClicked", togglePower);
$("#radioD").on("ifClicked", toggleD);
$("#radioN").on("ifClicked", toggleN);
function toggleAlpha() {
		$("#alpha_container").hide();
		$("#d_container").show();
		$("#n_container").show();
		$("#power_container").show();
		$slider_d.slider("option", "min", 0.01);
		para.param = "alpha";

}
function togglePower() {

		$("#power_container").hide();
		$("#d_container").show();
		$("#n_container").show();
		$("#alpha_container").show();
		$slider_d.slider("option", "min", 1e-7);
		para.param = "power";

}
function toggleD() {

		$("#d_container").hide();
		$("#power_container").show();
		$("#n_container").show();
		$("#alpha_container").show();
		$slider_d.slider("option", "min", 1e-7);
		para.param = "d";

}
function toggleN() {
		$("#n_container").hide();
		$("#d_container").show();
		$("#power_container").show();
		$("#alpha_container").show();
		$slider_d.slider("option", "min", 0.1);
		para.param = "n";

}

// plot dimensions
 if(parseInt(d3.select('body').style('width'), 10) < 767) {
	var aspect = 0.5;
	var margin = {top: 70, right: 15, bottom: 40, left: 15};
} else {
	var aspect = 0.35;
	var margin = {top: 70, right: 20, bottom: 40, left: 20};
}

var	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
var	h = aspect*w-margin.top - margin.left;



// x.values 
function genX() {
		var x = [];
		for (var i = para.mu1-3; i <= 5+3*para.sigma2; i += 0.01) {
			x.push(i);
		}
		return x;
}
	
var x = genX();	

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


			tmp.unshift([[x[0], y[0]]][0]);	
			tmp.unshift([[x[0], 0]][0]);

		var data = {
			data: tmp,
			x: x,
			y: y
		};
	return data;
}	
	
// Data sets
var data1 = genData(para.mu1, para.sigma1),
	data2 = genData(para.mu2, para.sigma2);

// alpha poly
var tmp_x = [],
	tmp_y = [],
	tmp_y2 = [];
function genAlphaPolyUpper(alpha) {

	if(para.onetailed) {
		alpha = alpha;
	} else {
		alpha = alpha/2;
	}
	var z_crit = jStat.normal.inv(1-(alpha), 0, para.sigma1);

	tmp_x = data1.x;
	tmp_y1 = [],
	tmp_y2 = [];
	
	for(var i = 0; i < data1.x.length; i++) {
		if(tmp_x[i] > z_crit) {
		 tmp_y1[i] = data1.y[i]
		} else {
			tmp_y2[i] = 0;
		}
	}
	tmp_y1 = jQuery.grep(tmp_y1, function(n, i){
  			return (n !== "" && n != null);
			});
	tmp_y = tmp_y2;
	tmp_y = tmp_y.concat(tmp_y1);
	
	var poly = [];
		for(var i = 0; i < tmp_x.length; i++) {
			poly.push([tmp_x[i], tmp_y[i]]);
		}

	poly[tmp_y2.length] = [z_crit, jStat.normal.pdf(z_crit, para.mu1, para.sigma1)];	
	poly[tmp_y2.length-1] = [z_crit, 0];		
	return poly;	
}



function genAlphaPolyLower(alpha) {
	if(para.onetailed) {
		alpha = 0;
	} else {
		alpha = alpha/2;
	}
	var z_crit = jStat.normal.inv(alpha, 0, para.sigma1);
	
	tmp_x = data1.x,
	tmp_y1 = [],
	tmp_y2 = [];
	
	for(var i = 0; i < data1.x.length; i++) {
		if(tmp_x[i] < z_crit) {
		 tmp_y1[i] = data1.y[i]
		} else {
			tmp_y2[i] = 0;
		}
	}
	tmp_y2 = jQuery.grep(tmp_y2, function(n, i){
  			return (n !== "" && n != null);
			});
	tmp_y = tmp_y1;
	tmp_y = tmp_y.concat(tmp_y2);

		var poly = [];
		for(var i = 0; i < tmp_x.length; i++) {
			poly.push([tmp_x[i], tmp_y[i]]);
		}
	poly.unshift([poly.slice(0,1)[0][0], 0]);
	poly[tmp_y1.length-1] = [z_crit, jStat.normal.pdf(z_crit, para.mu1, para.sigma1)];	
	poly[tmp_y1.length] = [z_crit, 0];	

	return poly;	
}

function genBetaPoly(alpha) {
	if(para.onetailed) {
		alpha = alpha;
	} else {
		alpha = alpha/2;
	}
	var z_crit = jStat.normal.inv(1-alpha, 0, para.sigma1);
	
	var tmp_x = data2.x;
	 tmp_y1 = [];
	 tmp_y2 = [];
	var poly = [];
	
	for(var i = 0; i < data1.x.length; i++) {

		if(!para.onetailed) {
			if(tmp_x[i] < z_crit && tmp_x[i] > -z_crit) {
			 tmp_y1.push(i);
			 poly.push([tmp_x[i], data2.y[i]]);
		} else {
			poly.push([tmp_x[i], 0]);
		}
	} else {
			if(tmp_x[i] < z_crit) {
			 tmp_y1.push(i);
			 poly.push([tmp_x[i], data2.y[i]]);
		} else {
			poly.push([tmp_x[i], 0]);
		}
	}	 

	}
		

	if(!para.onetailed) {
		poly[tmp_y1[0]-1] = [-z_crit, 0];
		poly[tmp_y1[0]] = [-z_crit, jStat.normal.pdf(-z_crit, para.mu2, para.sigma2)];

	}	
	poly[tmp_y1[tmp_y1.length-2]] = [z_crit, jStat.normal.pdf(z_crit, para.mu2, para.sigma2)];	
	poly[tmp_y1[tmp_y1.length-1]] = [z_crit, 0];	



		var output = {
		"data": poly,
		"y_mean": d3.mean(tmp_y),
	}
	

	return output;	
}

var poly_alpha_upper = genAlphaPolyUpper(para.alpha);
var poly_alpha_lower = genAlphaPolyLower(para.alpha);
var poly_beta = genBetaPoly(para.alpha); // is actually 1-beta poly
	


// Axes min and max
var x_max = para.mu2+para.sigma2*3;
var x_min = para.mu1-para.sigma1*3;
var y_max = d3.max([d3.max(data1.y), d3.max(data2.y)]);

// Create scales
var xScale = d3.scale.linear().domain([x_min, x_max]).range([0,w]);
var yScale = d3.scale.linear().domain([0, y_max]).range([0,h]);

var zoom = d3.behavior.zoom()
    .x(xScale)
    .y(yScale)
    .scaleExtent([0.2, 10])
    .center([w / 2, h / 2])
    .size([w, h])
    .on("zoom", zoomed);

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
			.attr("id", "SVG-container")
			.call(zoom)
			.on("wheel.zoom", null)
			.on("mousewheel.zoom", null);

var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");
var dists = g.append("g")
			.attr("clip-path", "url(#clip)");

// clip-path
  var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "-5")
        .attr("width", w)
        .attr("height", h);

//Define X axis
var xAxis = d3.svg.axis()
				  .scale(xScale)
				  .orient("bottom")
				   .tickSize(5);

var xAx = g.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + (h) + ")")
	.call(xAxis);



	function zoomed() {
		scale = zoom.scale();
		yScale.domain([0, y_max * 1/scale]);
		//xScale.domain([x_min * scale, x_max * scale]);

  g.select(".x.axis").call(xAxis);

 redraw(0);

}			

function reset() {
	x_max = para.mu2+para.sigma2*3;
     x_min = para.mu1-para.sigma1*3;
	y_max = d3.max([d3.max(data1.y), d3.max(data2.y)]);
  
  d3.transition().duration(750).tween("zoom", function() {
    var ix = d3.interpolate(xScale.domain(), [x_min, x_max]),
        iy = d3.interpolate(yScale.domain(), [0, y_max]);
    return function(t) {
      zoom.x(xScale.domain(ix(t))).y(yScale.domain(iy(t)));
        g.select(".x.axis").call(xAxis);
 redraw(0);
    };
  });
}


// overlap
var tooltip = d3.select(".container")
    .append("div")
    .append("p")
    .attr("class", "tooltip_overlap")
    .style("position", "absolute")
    .style("z-index", "10")
    .style("visibility", "hidden")
    .text("");

var overlap_alpha_lower = dists.append("svg:path")
							.attr("d", line(poly_alpha_lower))
							.attr("class", "poly")
							.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Alpha. The rejection region.");})
							.on("mousemove", function(){return tooltip.style("top",
								    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
							.on("mouseout", function(){return tooltip.style("visibility", "hidden");});


// Append dists
var dist2 = dists.append("svg:path")
	.attr("d", line(data2.data))
	.attr("id","dist2")
				.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Power. 1-beta");})
								.on("mousemove", function(){return tooltip.style("top",
								    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
								.on("mouseout", function(){return tooltip.style("visibility", "hidden");});


var overlap_beta = dists.append("svg:path")
						.attr("d", line(poly_beta.data))
						.attr("class", "poly")
						.attr("id", "beta")
						.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Beta (Type II error)");})
						.on("mousemove", function(){return tooltip.style("top",
						    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
						.on("mouseout", function(){return tooltip.style("visibility", "hidden");});								
								
				



var overlap_alpha_upper = dists.append("svg:path")
								.attr("d", line(poly_alpha_upper))
								.attr("class", "poly")
								.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Alpha. The rejection region");})
								.on("mousemove", function(){return tooltip.style("top",
								    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
								.on("mouseout", function(){return tooltip.style("visibility", "hidden");});

var dist1 = dists.append("svg:path")
	.attr("d", line(data1.data))
	.attr("id","dist1");
											


// z-critical line
var z_crit_line = g.append("line")
					.attr("id", "z_crit")
					.attr("x1", xScale(para.z_crit))
					.attr("x2", xScale(para.z_crit))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));

// mu lines

var mu1_line = g.append("line")
					.attr("id", "mu1")
					.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu1))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));

var mu2_line = g.append("line")
					.attr("id", "mu2")
					.attr("x1", xScale(para.mu2))
					.attr("x2", xScale(para.mu2))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));			


// marker
svg.append("svg:defs").append("marker")
    .attr("id", "marker-start")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 1)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,0L10,-5L10,5");	

svg.append("svg:defs").append("marker")
    .attr("id", "marker-end")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 9)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");	

var line_end = 40;
var mu_connect = g.append("line")
					.attr("id", "mu_connect")
					.attr("marker-start", "url(#marker-start)")
					.attr("marker-end", "url(#marker-end)")
					.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu2))
					.attr("y1", -line_end)
					.attr("y2", -line_end);	


		g.append("text")
					.attr("class", "cohen_float")
					.attr("text-anchor", "middle")
					.attr("x", xScale((para.mu1+para.mu2)/2))
					.attr("y", (-10-line_end))
					.append("tspan")
						.text("Cohen's ")
					.append("tspan")
						.attr("font-style", "italic")
						.text("d: ");
		var cohend_float = d3.select(".cohen_float").append("tspan")
								.text(d3.round(para.cohend, 2));


var centroid = {
	"beta": (jStat.normal.inv(0.01, para.mu2, para.sigma1) + para.z_crit) / 2,
	"alpha": (jStat.normal.inv(0.99, para.mu1, para.sigma1) + para.z_crit) / 2
};


var line_beta = g.append("line")
				.attr("class", "beta_line")
				.attr("x1", xScale(centroid.beta))
				.attr("x2", xScale(centroid.beta))
				.attr("y1", h-10)
				.attr("y2", h+20);
var text_beta = g.append("text")
				.attr("text-anchor", "middle")
				.attr("x", xScale(centroid.beta))	
				.attr("y", h+35)
				.text("β");

var line_alpha = g.append("line")
				.attr("class", "beta_line")
				.attr("x1", xScale(centroid.alpha))
				.attr("x2", xScale(centroid.alpha))
				.attr("y1", h-10)
				.attr("y2", h+20);
var text_alpha = g.append("text")
				.attr("text-anchor", "middle")
				.attr("x", xScale(centroid.alpha))	
				.attr("y", h+35)
				.text(function() {if(para.onetailed) {
						return "α";
					} else {
						return "α/2";
					}
				});

var labs = {};
labs.H0 = g.append("text")
			.attr("class", "h0")
			.attr("text-anchor", "middle")
			.attr("x", xScale(para.mu1))
			.attr("y", -15)
			.append("tspan")
			  .text("H")
			.append("tspan")
			  .attr("baseline-shift", "sub")
			  .text("0");

labs.Ha = g.append("text")
			.attr("class", "ha")
			.attr("text-anchor", "middle")
			.attr("x", xScale(para.mu2))
			.attr("y", -15)
			.append("tspan")
			  .text("H")
			.append("tspan")
			  .attr("baseline-shift", "sub")
			  .text("a");		

labs.z_crit = g.append("text")
			.attr("class", "z_crit")
			.attr("text-anchor", "middle")
			.attr("x", xScale(para.z_crit))
			.attr("y", -15)
			.append("tspan")
			  .text("Z")
			.append("tspan")
			  .attr("baseline-shift", "sub")
			  .text("crit");				  		  								

// donut charts
if(parseInt(d3.select('body').style('width'), 10) < 992) {
	var donut_resize = 0.5;
} else {
	var donut_resize = 0.3;
}
var donut_radius = 0.9;
// alpha
var alpha_donut = {w: parseInt(d3.select('div#alpha_donut').style('width'), 10)*donut_resize};
	alpha_donut.h = alpha_donut.w;
    alpha_donut.radius = Math.min(alpha_donut.w, alpha_donut.h) / 2;

	alpha_donut.color = ["#c0392b", "#FFF"];

	alpha_donut.pie = d3.layout.pie()
    			.sort(null);

    alpha_donut.arc = d3.svg.arc()
			    .innerRadius(alpha_donut.radius-1)
			    .outerRadius(alpha_donut.radius * donut_radius);

    alpha_donut.svg = d3.select("div#alpha_donut").append("svg")
    			.attr("id", "alpha-container")
			    .attr("width", alpha_donut.w)
			    .attr("height", alpha_donut.h);

    alpha_donut.g = alpha_donut.svg   
    .append("g")
    .attr("transform", "translate(" + (alpha_donut.w / 2) + "," + (alpha_donut.h / 2) + ")");

   alpha_donut.path = alpha_donut.g.selectAll("path")
    .data(alpha_donut.pie([para.type1, (1-para.type1)]))
   .enter().append("path")
    .attr("fill", function(d, i) { return alpha_donut.color[i]; })
    .attr("d", alpha_donut.arc)
    .each(function(d) { this._current = d; });

    alpha_donut.text = alpha_donut.svg.append("text")
    			.attr("class", "perc")
    			.attr("text-anchor","middle")
    			.attr("x", alpha_donut.w/2)
    			.attr("y", alpha_donut.h/2)
    			.attr("dy", "0.35em")
       			.text(d3.round(para.type1*100, 2) + " %");
    d3.select('div#alpha_donut')
    	.append("p")
    	.attr("class", "donuts")
    	.html("Type I error")    			
// beta
var beta_donut = {w: parseInt(d3.select('div#beta_donut').style('width'), 10)*donut_resize};
	beta_donut.h = beta_donut.w;
    beta_donut.radius = Math.min(beta_donut.w, beta_donut.h) / 2;

	beta_donut.color = ["#30394F", "#fff"];
	
	beta_donut.pie = d3.layout.pie()
    			.sort(null);

    beta_donut.arc = d3.svg.arc()
			    .innerRadius(beta_donut.radius-1)
			    .outerRadius(beta_donut.radius * donut_radius);

    beta_donut.svg = d3.select("div#beta_donut").append("svg")
    			.attr("id", "beta-container")
			    .attr("width", beta_donut.w)
			    .attr("height", beta_donut.h);

    beta_donut.g = beta_donut.svg   
	    .append("g")
	    .attr("transform", "translate(" + (beta_donut.w / 2) + "," + (beta_donut.h / 2) + ")");

   beta_donut.path = beta_donut.g.selectAll("path")
	    .data(beta_donut.pie([(1-para.power), para.power]))
	   .enter().append("path")
	    .attr("fill", function(d, i) { return beta_donut.color[i]; })
	    .attr("d", beta_donut.arc)
	    .each(function(d) { this._current = d; });

    beta_donut.text = beta_donut.svg.append("text")
    			.attr("class", "perc")
    			.attr("text-anchor","middle")
    			.attr("x", beta_donut.w/2)
    			.attr("y", beta_donut.h/2)
    			.attr("dy", "0.35em")
       			.text(d3.round((1-para.power) * 100, 2) + " %");
     d3.select('div#beta_donut')
     	.append("p")
     	.attr("class", "donuts")
     	.text("Type II error");    			

// CL
var power_donut = {w: parseInt(d3.select('div#power_donut').style('width'), 10)*donut_resize};
	power_donut.h = power_donut.w;
    power_donut.radius = Math.min(power_donut.w, power_donut.h) / 2;
	
	power_donut.color = ["#3498db", "#fff"];
	
	power_donut.pie = d3.layout.pie()
    			.sort(null);

    power_donut.arc = d3.svg.arc()
			    .innerRadius(power_donut.radius-1)
			    .outerRadius(power_donut.radius *donut_radius);

    power_donut.svg = d3.select("div#power_donut").insert("svg")
    			.attr("id", "power-container")
			    .attr("width", power_donut.w)
			    .attr("height", power_donut.h);

    power_donut.g = power_donut.svg   
	    .append("g")
	    .attr("transform", "translate(" + (power_donut.w / 2) + "," + (power_donut.h / 2) + ")");

   power_donut.path = power_donut.g.selectAll("path")
	    .data(power_donut.pie([para.power, (1-para.power)]))
	   .enter().append("path")
	    .attr("fill", function(d, i) { return power_donut.color[i]; })
	    .attr("d", power_donut.arc)
	    .each(function(d) { this._current = d; });

    power_donut.text = power_donut.svg.append("text")
    			.attr("class", "perc")
    			.attr("text-anchor","middle")
    			.attr("x", power_donut.w/2)
    			.attr("y", power_donut.h/2)
    			.attr("dy", "0.35em")
       			.text(d3.round((para.power)*100, 2) + " %");   

    d3.select('div#power_donut')
    	.append("p")
    	.attr("class", "donuts")
    	.text("Power")   	
 

 var n_donut = {w: parseInt(d3.select('div#n_donut').style('width'), 10)*donut_resize};
	n_donut.h = n_donut.w;


    n_donut.svg = d3.select("div#n_donut").insert("svg")
    			.attr("id", "power-container")
			    .attr("width", n_donut.w)
			    .attr("height", n_donut.h);

    n_donut.g = n_donut.svg   
	    .append("g")
	    .attr("transform", "translate(" + (n_donut.w / 2) + "," + (n_donut.h / 2) + ")");



    n_donut.text = n_donut.svg.append("text")
    			.attr("class", "perc")
    			.attr("text-anchor","middle")
    			.attr("x", n_donut.w/2)
    			.attr("y", n_donut.h/2)
    			.attr("dy", "0.35em")
       			.text(para.n);   

    d3.select('div#n_donut')
    	.append("p")
    	.attr("class", "donuts")
    	.text("Sample size")  

// change
function reDrawPoly(duration) {

	if(duration == 0) {

		overlap_alpha_lower
			.attr("d", line(poly_alpha_lower));

		overlap_alpha_upper
			.attr("d", line(poly_alpha_upper));	

		overlap_beta
			.attr("d", line(poly_beta.data));

		z_crit_line
					.attr("x1", xScale(para.z_crit))
					.attr("x2", xScale(para.z_crit));	
	} else {
			poly_alpha_lower = genAlphaPolyLower(para.alpha);
	poly_alpha_upper = genAlphaPolyUpper(para.alpha);
	poly_beta = genBetaPoly(para.alpha);

	overlap_alpha_lower
		.transition()
		.duration(duration)
		.attr("d", line(poly_alpha_lower));

	overlap_alpha_upper
		.transition()
		.duration(duration)
		.attr("d", line(poly_alpha_upper));	

	overlap_beta
		.transition()
		.duration(duration)
		.attr("d", line(poly_beta.data))
		.style("fill", function() {

			if(old_d < 0.001) {
				return "#30394F";
			}
		});



	z_crit_line.transition()
				.duration(600)
				.attr("x1", xScale(para.z_crit))
				.attr("x2", xScale(para.z_crit));	


}

	
}

function updateScales() {
	 x_max = para.mu2+para.sigma2*3
     x_min = para.mu1-para.sigma1*3
	y_max = d3.max([d3.max(data1.y), d3.max(data2.y)]);

	// Create scales
	xScale.domain([x_min, x_max]);
	yScale.domain([0, y_max]);

	// transform axis
	xAx.transition().call(xAxis);  
}

function reDrawDist2(duration) {
	//updateScales();

	if(para.cohend < 0.001) {
		var dt = genData(0, 1000);
	} else {
		var dt = data2; 
	}

	if(duration == 0) {
 dists.select("#dist2")
		.attr("d", line(dt.data));
	} else {
		 dists.select("#dist2")
		.transition()
		.duration(duration)
		.attr("d", line(dt.data))
		.each("end", function() {
			if(para.cohend < 0.001) {
				d3.select("#beta").transition().duration(600).style("fill", "#ecf0f1");
				overlap_alpha_lower.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Alpha (the rejection region)");})
				overlap_alpha_upper.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Alpha (the rejection region)");})
				overlap_beta.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Acceptance region");})

			} else if(old_d < 0.001) {
				
					
				
			}
		});

		if(old_d < 0.001) {
				
				overlap_alpha_lower.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Alpha (the rejection region)");})
				overlap_alpha_upper.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Alpha (the rejection region)");})
				overlap_beta.on("mouseover", function(){return tooltip.style("visibility", "visible").text("Beta (Type II error)");})
		
		}

	}

	
}
function reDrawDist1(duration) {
	//updateScales();

	if(duration == 0) {
 dists.select("#dist1")
		.attr("d", line(data1.data));
	} else {
		 dists.select("#dist1")
		.transition()
		.duration(duration)
		.attr("d", line(data1.data));
	}
	
}

function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
        return alpha_donut.arc(i(t));
    };
}
function updateDonuts() {

	alpha_donut.path.data(alpha_donut.pie([para.type1, (1-para.type1)]))
				.transition()
				.duration(600)
				.attrTween("d", arcTween);
		beta_donut.path.data(beta_donut.pie([(para.type2), 1-para.type2]))
				.transition()
				.duration(600)
				.attrTween("d", arcTween);	
		power_donut.path.data(power_donut.pie([para.power, (1-para.power)]))
				.transition()
				.duration(600)
				.attrTween("d", arcTween);
}

function updateEStext(old_type1, old_power, old_n) {
	
	if(para.cohend < 0.001) {
			beta_donut.text.text("-");
			power_donut.text.text("-");
		
	} else {
			// update beta text
	beta_donut.text
		.transition()
		.duration(500)
		.tween("text", function() {
		  var i = d3.interpolate((old_type2), (para.type2));
		  return function(t) {
		    this.textContent = d3.round(i(t)*100, 0) + " %";
		  }});

	// update power text
	power_donut.text
		.transition()
		.duration(500)
		.tween("text", function() {
		  var i = d3.interpolate(old_power, para.power);
		  return function(t) {
		    this.textContent = d3.round(i(t)*100, 0) + " %";
		  }});	
	}
	alpha_donut.text
		.transition()
		.duration(500)
		.tween("text", function() {
		  var i = d3.interpolate(old_type1, para.type1);
		  return function(t) {
		    this.textContent = d3.round(i(t)*100, 0) + " %";
		  }});


	
		n_donut.text.text(d3.round(para.n, 2))
}
function redraw(duration) {
			// redraw dist
		reDrawDist1(duration);
		reDrawDist2(duration);
		// redraw poly
		reDrawPoly(duration);

		// update mu lines
		if(duration == 0) {

			mu1_line
				.attr("x1", xScale(para.mu1))
				.attr("x2", xScale(para.mu1));

		mu2_line
				.attr("x1", xScale(para.mu2))
				.attr("x2", xScale(para.mu2));		

		mu_connect
				.attr("x1", xScale(para.mu1))
				.attr("x2", xScale(para.mu2));	

		d3.select(".h0")
				.attr("x", xScale(para.mu1));
		d3.select(".ha")
				.attr("x", xScale(para.mu2));
		d3.select(".z_crit")
				.attr("x", xScale(para.z_crit));
	
		line_beta
				.attr("x1", xScale(centroid.beta))
				.attr("x2", xScale(centroid.beta));

		text_beta
				.attr("x", xScale(centroid.beta));		
		
		line_alpha
				.attr("x1", xScale(centroid.alpha))
				.attr("x2", xScale(centroid.alpha));

		text_alpha
				.attr("x", xScale(centroid.alpha));			

		d3.select(".cohen_float")
			.attr("x", xScale((para.mu1+para.mu2)/2))

		} else {
					mu1_line.transition()
				.duration(duration)
				.attr("x1", xScale(para.mu1))
				.attr("x2", xScale(para.mu1));

		mu2_line.transition()
				.duration(duration)
				.attr("x1", xScale(para.mu2))
				.attr("x2", xScale(para.mu2));		

		mu_connect.transition()
				.duration(duration)
				.attr("x1", xScale(para.mu1))
				.attr("x2", xScale(para.mu2));	

		d3.select(".h0")
			.transition()
				.duration(duration)
				.attr("x", xScale(para.mu1));
		d3.select(".ha")
			.transition()
				.duration(duration)
				.attr("x", xScale(para.mu2));

		if(para.cohend < 0.001) {
			$(".ha").hide();
		};
		if(old_d < 0.001) {
			$(".ha").show();
		}		
		d3.select(".z_crit")
			.transition()
				.duration(duration)
				.attr("x", xScale(para.z_crit));


		centroid = {
				"beta": (jStat.normal.inv(0.005, para.mu2, para.sigma1) + para.z_crit) / 2,
				"alpha": (jStat.normal.inv(0.99, para.mu1, para.sigma1) + para.z_crit) / 2
			};		
		line_beta.transition()
			.duration(duration)
				.attr("x1", xScale(centroid.beta))
				.attr("x2", xScale(centroid.beta));

		text_beta.transition()
			.duration(duration)
				.attr("x", xScale(centroid.beta));		
		
		line_alpha.transition()
			.duration(duration)
				.attr("x1", xScale(centroid.alpha))
				.attr("x2", xScale(centroid.alpha));

		text_alpha.transition()
			.duration(duration)
				.attr("x", xScale(centroid.alpha));			

		d3.select(".cohen_float")
			.transition()
			.duration(duration)
			.attr("x", xScale((para.mu1+para.mu2)/2))

		}

	
			
}

// update hidden slider
function updateSlider() {
 	  if(para.param == "d") {
	  	$slider_d.slider("value", d);
	  } else if(para.param == "n") {
	  	$slider_n.slider("value", n);

	  } else if(para.param == "alpha") {
	  	$slider_alpha.slider("value", alpha);

	  } else if(para.param == "power") {
	  	$slider_power.slider("value", power);
	  		
	  }
}
function sliderChange(power, alpha, d, n) {
	
	  if(para.param == "d") {
	  	 d = getES(alpha, power, n);
	  	 $slider_d.slider("value", d3.round(d, 2));
	  } else if(para.param == "n") {
	  	n = getN(power, alpha, d);
	  	$slider_n.slider("value", d3.round(n, 2));

	  } else if(para.param == "alpha") {
	  	alpha = getAlpha(power, n, d);
	  	$slider_alpha.slider("value", d3.round(alpha, 2));

	  } else if(para.param == "power") {
	  		power = getPower(alpha, d, n);
	  	    $slider_power.slider("value", d3.round(power, 2));
	  		
	  }


	  old_d = para.cohend;
	  	old_power = para.power;
		  old_type1 = para.type1;
		  old_type2 = para.type2;
		  old_n = para.n;
	 
	 if(d < 0.001) {
	 		  para.type1 = alpha;
	 		  para.power = 0;
	 		  para.type2 =0;

	 		} else {
	 		 para.type1 = alpha;
	 		 para.power = power;
	 		 para.type2 = 1 - power;	

	 		}

	  para.alpha = alpha;		

	  para.n = n;
	  para.cohend = d;
	  para.sigma1 = 1/Math.sqrt(n); // SE
	para.sigma2 = 1/Math.sqrt(n);

	 
	  para.mu2 = para.cohend;		
	  //x = genX();
	//updateScales();

	  	data1 = genData(para.mu1,para.sigma1);
	  data2 = genData(para.mu2,para.sigma2);
	  para.z_crit = getZcrit(para.alpha);
	  
	redraw(600);

	cohend_float
			.transition()
			.duration(600)
			.tween("text", function() {
			  var i = d3.interpolate(old_d, para.cohend);
			  return function(t) {
				this.textContent = d3.round(i(t), 2);
				  }});	


		 // update power labels
		 d3.select("h4#power").text("Power (1-β = "+ d3.round(para.power, 2) + ")")
		 d3.select("h4#alpha").text("Significance level (α = " + d3.round(para.alpha,2) + ")");		
		 d3.select("h4#n").text("Sample size (n = "+ d3.round((para.n), 2) + ")");
		 d3.select("h4#d").text("Effect size (d = "+ d3.round((para.cohend), 2) + ")");

		updateDonuts();
		// update donut text		 
		updateEStext(old_type1, old_power, old_n);		

	    			
	};	


// resize
$(window).on("resize", resize);

function resize() {
//var aspect = 0.4;
//var margin = {top: 40, right: 20, bottom: 30, left: 20},

 if(parseInt(d3.select('body').style('width'), 10) < 767) {
	var aspect = 0.5;
	var margin = {top: 70, right: 15, bottom: 40, left: 15};
} else {
	var aspect = 0.4;
	var margin = {top: 70, right: 20, bottom: 40, left: 20};
}
 	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
	h = aspect*w-margin.top - margin.left;
	
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
	
	overlap_beta.attr("d", line(poly_beta.data));
	
	overlap_alpha_lower.attr("d", line(poly_alpha_lower));
	
	overlap_alpha_upper.attr("d", line(poly_alpha_upper));
							
	
// clip path
clip.attr("width", w)
        .attr("height", h);	
		
// mu lines
mu1_line.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu1))
					.attr("y1", yScale(0))
					.attr("y2", h);

mu2_line.attr("id", "mu2")
					.attr("x1", xScale(para.mu2))
					.attr("x2", xScale(para.mu2))
					.attr("y1", yScale(0))
					.attr("y2", h);			
mu_connect.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu2))
					.attr("y1", -line_end)
					.attr("y2", -line_end);	

d3.select(".cohen_float").attr("x", xScale((para.mu1+para.mu2)/2))
					.attr("y", (-10-line_end));

line_beta.attr("x1", xScale(centroid.beta))
				.attr("x2", xScale(centroid.beta))
				.attr("y1", h-10)
				.attr("y2", h+20);
				
text_beta.attr("x", xScale(centroid.beta))	
				.attr("y", h+35);


line_alpha.attr("x1", xScale(centroid.alpha))
				.attr("x2", xScale(centroid.alpha))
				.attr("y1", h-10)
				.attr("y2", h+20);
				
text_alpha.attr("x", xScale(centroid.alpha))	
				.attr("y", h+35);

d3.select(".h0").attr("x", xScale(para.mu1))
			.attr("y", (-15));
			

d3.select(".ha").attr("x", xScale(para.mu2));

 z_crit_line.attr("x1", xScale(para.z_crit))
					.attr("x2", xScale(para.z_crit))
					.attr("y1", yScale(0))
					.attr("y2", h);
					
d3.select(".z_crit").attr("x", xScale(para.z_crit))
			.attr("y", -15);
// donuts resize
if(parseInt(d3.select('body').style('width'), 10) < 992) {
	donut_resize = 0.5;
} else {
	donut_resize = 0.3;
}	
// alpha_donut
	alpha_donut.w = parseInt(d3.select('div#alpha_donut').style('width'), 10)*donut_resize;
	alpha_donut.h = alpha_donut.w;
    alpha_donut.radius = Math.min(alpha_donut.w, alpha_donut.h) / 2;

    alpha_donut.arc.innerRadius(alpha_donut.radius-1)
			    .outerRadius(alpha_donut.radius *donut_radius);

    alpha_donut.svg.attr("width", alpha_donut.w)
			    .attr("height", alpha_donut.h);

    alpha_donut.g.attr("transform", "translate(" + (alpha_donut.w / 2) + "," + (alpha_donut.h / 2) + ")");

   alpha_donut.path.attr("d", alpha_donut.arc);

    alpha_donut.text.attr("x", alpha_donut.w/2)
    			.attr("y", alpha_donut.h/2)
    			.attr("dy", "0.35em");

  // beta_donut
	beta_donut.w = parseInt(d3.select('div#beta_donut').style('width'), 10)*donut_resize;
	beta_donut.h = beta_donut.w;
    beta_donut.radius = Math.min(beta_donut.w, beta_donut.h) / 2;

    beta_donut.arc.innerRadius(beta_donut.radius-1)
			    .outerRadius(beta_donut.radius *donut_radius);

    beta_donut.svg.attr("width", beta_donut.w)
			    .attr("height", beta_donut.h);

    beta_donut.g.attr("transform", "translate(" + (beta_donut.w / 2) + "," + (beta_donut.h / 2) + ")");

   beta_donut.path.attr("d", beta_donut.arc);

    beta_donut.text	.attr("x", beta_donut.w/2)
    			.attr("y", beta_donut.h/2)
    			.attr("dy", "0.35em");
	  // power_donut
	power_donut.w = parseInt(d3.select('div#power_donut').style('width'), 10)*donut_resize;
	power_donut.h = power_donut.w;
    power_donut.radius = Math.min(power_donut.w, power_donut.h) / 2;

    power_donut.arc.innerRadius(power_donut.radius-1)
			    .outerRadius(power_donut.radius *donut_radius);

    power_donut.svg.attr("width", power_donut.w)
			    .attr("height", power_donut.h);

    power_donut.g.attr("transform", "translate(" + (power_donut.w / 2) + "," + (power_donut.h / 2) + ")");

   power_donut.path.attr("d", power_donut.arc);

    power_donut.text	
    			.attr("x", power_donut.w/2)
    			.attr("y", power_donut.h/2)
    			.attr("dy", "0.35em");	

	
			
}




