// TODO

// * kolla om data.x data.y data.data behövs
// * fixa så  donuts resizar
// * slider ticklabel blir fler with resize
// * förtydliga om n är total eller per grupp





var rpsy = {};




// overlap poly


// d3
function MakeChart() {
  // plot dimensions
  var margin = {top: 60, right: 5, bottom: 70, left: 5},
  width = 500,
  aspect = 0.6,
  height = width *aspect;
  m1 = 0,
  s1 = 1,
  m2 = 0.5,
  s2 = 1,
  duration = 600;


  // private
  var svg, xScale, yScale, w, h, container, dist1, dist2, y_max, x_max, n=10, x;

     // Line function
     var line = d3.svg.line()
     .x(function(d) { 
       return xScale(d[0])

     })
     .y(function(d) { 
      return yScale(d[1]);
    })

     _data = {};



// Generates data
var genData = function(mu, sigma) {

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

// relax colliding labels
var relax = function() {
  var collided = {};
  var textLabels = d3.selectAll(".dist-label");

  function relax_end() {
  // reset if no overlap
  if(collided.prior == false && collided.likelihood == false && collided.posterior == false) {
    d3.selectAll(".dist-label").transition().attr("y", -15)
  }
}

  // move colliding labels
  var move = function(a, b) {
    spacing = 15,
    alpha = 0.5;
    var again;

    var mover = function() {
      abox = a.getBBox();
      da = d3.select(a);
      y1 = da.attr("y");
      again = false;
      bbox = b.getBBox();

      // a & b are the same element and don't collide.
      if (a == b) return;
      var db = d3.select(b);
      atext = da.attr("class").split(" ")[1];
      btext = db.attr("class").split(" ")[1];
      // a & b too far apart and don't collide
      var collision = !(((abox.x + abox.width) < bbox.x) || (abox.x > (bbox.x + bbox.width)));
      if(!collision) {
        collided[atext] = false;
        collided[btext] = false;
        return;
      };
      collided[atext] = true;  
      collided[btext] = true;         

      // delta y
      y2 = db.attr("y");
      dy = y1 - y2;
      
      if (Math.abs(dy) > spacing) return;
      
      // move
      again = true;
      sign = dy > 0 ? 1 : -1;
      djust = sign * alpha;
      adjust = alpha;

      db.attr("y",+y2 - 0.5);

      if(again) {
        setTimeout(mover, 20)
      }
    }
    return mover();
  }

 // compare recursive
 function combinations(str) {
    function compare(a,b, fn) {

    b.forEach(function(d) {
      fn(a,d);
    })
  }
  var fn = function(active, rest) {
    if (rest.length == 1) {
      relax_end();
      return;
    }
    var a = rest[0],
    b = rest.slice(1)

    compare(a,b, move)
    fn(b[0], b);
  }
  return fn([], str);
}

combinations(textLabels[0]);
}

// dist creator
var Dist = function(_name, _type, _m, _s) {

  // defaults
  var _m = typeof _m !== 'undefined' ?  _m : 0;
  var _s = typeof _s !== 'undefined' ?  _s : 1;

  var name = _name,
  type = _type,
      m = _m, // mean 
      s = _s, // sd
      init = {"m":m, "s":s},
      label;
      var that = {};
      that.mean = function(_m) {
        if (!arguments.length) return m;
        m = _m;
        return this;
      }
      that.sd = function(_sd) {
        if (!arguments.length) return s;
        s = _sd;
        return this;
      }
      that.type = function(_type) {
        if (!arguments.length) return type;
        type = _type;
        return this;
      }
      that.init = function() {
        return init;
      }
      that.CI = function() {
        var lwr = m - 1.96*s;
        var upr = m + 1.96*s;
        var line = svg.select(".CI-group").selectAll(".CI-line."+type).data([[lwr, upr]]),
        padding, lab;
        if(type == "likelihood") {
          lab = "95 % CI"
          padding = 40;
        } else if (type == "posterior") {
          lab = "95 % HDI"
          padding = 60;

        }
        var anchor = m > 0 ? "end" : "start",
        labx = m > 0 ? xScale(lwr)-5:xScale(upr)+5;

        line.enter().append("line")
        .attr("class", "CI-line "+type);


        var label = svg.select(".CI-group").selectAll("text."+type).data([[lwr, upr]])   
        label.enter().append("text")
        .attr("text-anchor", anchor)
        .attr("class", type)
        .text(lab + " [" + d3.round(lwr,2) + ", " + d3.round(upr,2) + "]") 

        line.transition()
        .attr("x1", function(d) {return xScale(d[0])})
        .attr("x2", function(d) {return xScale(d[1])})
        .attr("y1", h+padding)
        .attr("y2", h+padding)  



        label.transition()
        .attr("text-anchor", anchor)
        .attr("x", labx)
        .attr("y", h+padding+5)
        .text(lab + " [" + d3.round(lwr,2) + ", " + d3.round(upr,2) + "]");



      } 
      that.slide = function(_x) {
        if(type == "likelihood" && _x == "m") {
          m = sliders.m.slider("getValue")
          d3.select("#span_d").html(m);
        } else if(type == "prior" && _x == "sd") {
          s = sliders.sd.slider("getValue")
          d3.select("#span_sd").html(s);
        } else if(type == "likelihood" && _x == "n") {
          n =  sliders.n.slider("getValue")
          if(n == 101) n = 1000;
          if(n == 102) n = 10000;
          d3.select("#span_n").html(n);
          s = Math.sqrt(1/n + 1/n);
        }
        that.render();
      }
      that.render = function() {
       _data[name] = genData(init.m, s);

    // var dist = svg.select(".dist-group."+type).selectAll("." + name).data([_data[name].data]);
    var dist = svg.select(".dist-group."+type).selectAll("." + name).data([_data[name].data]);

    dist.enter().append("path") 
    .attr("d", line)
    .attr("class", name);

    svg.select(".dist-group."+type).transition()
    .ease("linear")
    .duration(duration)
    .attr("transform", "translate(" + (xScale(m)-xScale(init.m)) + "," + 0 + ")");


    dist.transition().duration(duration)
      .attr("d", line);

    label = svg.select(".dist-group").selectAll(".dist-label."+type).data([m]);

    label.enter().append("text")
      .attr("x", xScale(m))
      .attr("y", yScale(y_max)-15)
      .attr("text-anchor", "middle")
      .attr("class","dist-label "+type)
      .append("tspan")
      .text(type)
      .append("tspan")
      .attr("class","legend")
      .text(" •");

    label.transition().duration(duration)
     .attr("x", xScale(m));

    if(type != "likelihood") {
     var lik = jStat.normal.pdf(0, m, s);     
     var likdot = svg.select(".dist-group.circle").selectAll(".lik."+type).data([lik]);

     likdot.enter().append("circle")
       .attr("cx", xScale(0))
       .attr("cy", yScale)
       .attr("r", 5)
       .attr("class", "lik "+type);

     likdot.transition().duration(duration)
       .attr("cy", yScale)
       .attr("cx",  xScale(0));

   }

 }

 return that;
};




function exports(_selection) {
  _selection.each(function() {


    w = width - margin.left - margin.right,
    h = height - margin.top - margin.bottom;
            // Axes min and max
            x_max = 3,
            x_min = -3,
            y_max = [];
            for(i in _data) {
              y_max.push(d3.max(_data[i].y))
            }
            y_max = y_max.length == 0 ? 1.329 : d3.max(y_max);

      // Create scales
      xScale = d3.scale.linear().domain([x_min, x_max]).range([0,w]);
      yScale = d3.scale.linear().domain([0, y_max]).range([h,0]);

      svg = d3.select(this)
        .selectAll("svg")
        .data([_data]);

      container = svg.enter().append("svg")
       .append("g").classed("container-group", true);
      container.append("g").classed("dist-group prior", true);
      container.append("g").classed("dist-group posterior", true);
      container.append("g").classed("dist-group likelihood", true);
      container.append("g").classed("dist-group circle", true);

      container.append("g").classed("x-axis-group axis", true);
      container.append("g").classed("y-axis-group axis", true);
      container.append("g").classed("CI-group", true);
      container.append("text").classed("xlab", true);


      svg.transition()
        .duration(duration)
        .attr({width: width, height: height});

      svg.select(".container-group")
        .attr({transform: "translate(" + margin.left + "," + margin.top + ")"});
      
      //Define X axis
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .tickSize(5);

      var yAxis = d3.svg.axis()
        .scale(yScale)
        .ticks(5)
        .tickSize(w)
        .orient("right");

      svg.select(".x-axis-group.axis")
      .attr({transform: "translate(0," + (h) + ")"})
        .transition()
        .duration(duration)
        
        .call(xAxis)


      function customAxis() {
        svg.select(".y-axis-group.axis").selectAll("text")
        .attr("x", 4)
        .attr("dy", -4);
      }

      svg.select(".y-axis-group.axis")
      .transition()
      .duration(duration)
      //.attr({transform: "translate(0," + 0 + ")"})
      .call(yAxis)
      .selectAll("text") // cancel transition on customized attributes
      .tween("attr.x", null)
      .tween("attr.dy", null)
      .call(customAxis)

      svg.select(".xlab")
      .attr("x",xScale(0))
      .attr("y", h+25)
      .attr("class", "xlab")
      .attr("text-anchor", "middle")
      .text("Effect (d)")

      exports.dist1.render();
      exports.dist2.render();
      exports.dist3.render();
      exports.dist2.CI();
      exports.dist3.CI();
      relax();
    });


}

exports.width = function(_x) {
  if (!arguments.length) return width;
  width = parseInt(_x);
  height = width * aspect;

        // x-values = data resolution
        var incr = 6 / width;
        x = [];
        for (var i = -3; i <= 3; i += incr) {
          x.push(i);
        }

        return this;
      };
  exports.height = function(_x) {
    if (!arguments.length) return height;
    height = parseInt(_x);
    return this;
  };
    exports.aspect = function(_x) {
    if (!arguments.length) return aspect;
    aspect = _x;
    return this;
  };
  exports.duration = function(_x) {
    if (!arguments.length) return duration;
    duration = parseInt(_x);
    return this;
  };
  exports.data = function() {
    return _data;
  }


    exports.dist1 = Dist("dist1", "prior", 0, 0.3); // prior
    exports.dist2 = Dist("dist2", "likelihood", 1, Math.sqrt(1/10 + 1/10))
    exports.dist3 = Dist("dist3", "posterior",   0.4736842,  0.3077935)
    exports.bf = function() {
      var h1, h0,m,s,mp,sp;

      m = exports.dist1.mean();
      s = exports.dist1.sd();
      mp = exports.dist3.mean();
      sp = exports.dist3.sd();

      h0 = jStat.normal.pdf(0, m, s);
      h1 = jStat.normal.pdf(0, mp, sp);

      return(h1/h0);  
    }
    exports.pval = function() {
      var z, p, mu, sd;
      mu = exports.dist2.mean();
      se = exports.dist2.sd();
      z = mu/ se;
      p = 2*(jStat.normal.cdf(-Math.abs(z), 0, 1)); //two-tailed

      return p;
    }
    exports.relax = relax;

    return exports;
  }
      
// ***********
// ** Donut **
// ***********

function makeDonut(_type){  
  // Default settings

  var _data = {}, _type = _type;


  // var showTitle = true;
  var width = 200;
  height = 200,
  h = height,
  radius = Math.min(width, height) / 2,
  duration = 600;

  var color = d3.scale.category20();
  var pie = d3.layout.pie()
    .sort(null)
    .value(function(d) { return d.value; });

  var svg, g, arc, container, lab, toplabel; 

  if(_type == "bf01") {
    toplabel = "Support H₀ (BF₀₁)";
  } else if(_type == "bf10") {
    toplabel = "Support H₁ (BF₁₀)";
  } else if(_type == "pval") {
    toplabel = "p-value"
  }

  // Method for render/refresh graph
  function exports(_selection) {
    _selection.each(function() {

      arc = d3.svg.arc()
      .outerRadius(radius)
      .innerRadius(radius - (radius/5));

      svg = d3.select(this)
      .selectAll("svg")
      .data([_data]);

      container = svg.enter().append("svg")
        .append("g").classed("container-group", true);
      container.append("g").classed("arc-group", true);              
      container.append("g").classed("label-group", true);
      container.append("g").classed("label-top", true);  

      svg.transition()
        .duration(duration)
        .attr("width", width)
        .attr("height", h);

      svg.select(".container-group") 
       .attr("transform", "translate(" + width / 2 + "," + h / 2 + ")");

      svg.selectAll(".arc")
        .data(pie(d3.entries([_data, 1-_data])))
        .enter().append("g")
        .attr("class", "arc");

      var path = svg.select(".arc-group").selectAll("path").data(pie(d3.entries([_data, 1-_data])))

      path.enter().append("path")
        .each(function(d) { this._current = d; })
        .attr("d", arc)
        .attr("class", function(d,i) { return "arc"+i });
      
      var label = svg.select(".label-group").selectAll("text").data([_data])
    
      label.enter().append("text")
        .attr("class", "lab")
        .attr("text-anchor","middle")
        .attr("x", 0)
        .attr("y", 0)
        .attr("dy", "0.35em")

      var labeltop = svg.select(".label-top").selectAll("text").data([_data])

      labeltop.enter().append("text")
        .attr("class", "lab top")
        .attr("text-anchor","middle")
        .attr("x", 0)
        .attr("y", -(radius+20))
        .attr("dy", "0.35em")
        .text(toplabel)

      path.exit().remove();

      path.transition().duration(200)
        .attrTween("d", function(a){
         var i = d3.interpolate(this._current, a);
         this._current = i(0);
         return function(t) {
           return arc(i(t));
           };
         })

      if(_data < 1e-6) {
          var form = function() { return "< 1e-6" };
      }
      else if(_data < 0.001) {
        var form = d3.format(".1e")
      } else {
       var form = d3.format(".3g")
     }
     label.text(form(lab));


   });
};

  // Getter and setter methods
  exports.data = function(value){
    if (!arguments.length) return _data;

    if(_type == "bf01") {
      _data = value / (1+value);
      lab = value;
    } else if(_type == "bf10") {
      _data = 1/value / (1+ 1/value);
      lab = 1/value;
    } else if(_type == "pval") {
      _data = value;
      lab = value;
    }
    return exports;
  };

  exports.width = function(value){
    if (!arguments.length) return width;
    width = value;
    radius = Math.min(width, height) / 2;
    return exports;
  };

  exports.height = function(value){
    if (!arguments.length) return height;
    height = value;
    h = height + 60;
    radius = Math.min(width, height) / 2;
    return exports;
  };
  exports.type = function(value){
    if (!arguments.length) return _type;
    _type = value;
    return exports;
  };

  return exports;
};

// ********************
// * Append charts
//  ******************

// Main
var donut = {};
function setsize() {
   rpsy.w = parseInt(d3.select('#viz').style('width'), 10);
    donut.w = parseInt(d3.select('#donutBf01').style('width'), 10);
  if(rpsy.w < 400) {
    // small screens
    rpsy.aspect = 0.8;
    donut.h = 50;
  } else {
    rpsy.aspect = 0.6;
    donut.h = 100;
  }
}
setsize();
chart = MakeChart().aspect(rpsy.aspect).width(rpsy.w);
container =  d3.select('#viz')
                .call(chart);

// bf


donut.bf01 = makeDonut("bf01").width(donut.w).height(donut.h).data(chart.bf());
container.bf01 =  d3.select('#donutBf01')
.call(donut.bf01);

donut.bf10 = makeDonut("bf10").width(donut.w).height(donut.h).data(chart.bf());
container.bf10 =  d3.select('#donutBf10')
.call(donut.bf10);
// pval
donut.pval = makeDonut("pval").width(donut.w).height(donut.h).data(chart.pval());
container.pval =  d3.select('#donutPval')
.call(donut.pval);


// **********
// * RESIZE *
// **********
function resize() {
  setsize();

 // var h =parseInt(d3.select('#viz').style('height'), 10);
 chart.width(rpsy.w).duration(200);
 chart.dist1.render();
 chart.dist2.render();
 chart.dist3.render();
 container.call(chart);
 container.bf01.call(donut.bf01.width(donut.w).height(donut.h));
 container.bf10.call(donut.bf10.width(donut.w).height(donut.h));
 container.pval.call(donut.pval.width(donut.w).height(donut.h));
 chart.duration(500);
}

// resize  after resize-events event complete
function debounce(fn, wait) {
  var timeout;

  return function () {
    var context = this,              // preserve context
        args = arguments,            // preserve arguments
        later = function () {        // define a function that:
            timeout = null;          // * nulls the timeout (GC)
            fn.apply(context, args); // * calls the original fn
          };

    // (re)set the timer which delays the function call
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

$(window).resize(debounce(resize,500));


// ************
// * Sliders **
// ************

var sliders ={};

sliders.m = $("#slider-m").slider({min: -3, 
  max: 3,
  value:chart.dist2.mean(),
  step:0.1,
  ticks: [-3, -2, -1, 0, 1, 2, 3],
  ticks_labels: ['-3', '-2', '-1', '0', '1', "2","3"],
  tooltip:"hide"
    }) // mean prior
.on("change", function() {
  chart.dist2.slide("m");
  updatePosterior();
  updateDonuts();
  chart.dist2.CI();
  chart.dist3.CI();
})
.on("slideStop", function() {
  setTimeout(function() {
    container.call(chart)
    chart.relax()}, 1000)
}); 
sliders.sd = $("#slider-sd").slider({min: 0.1,
 max: 5, 
 value: chart.dist1.sd(),
 step:0.1,
 ticks: [0.1, 1, 2, 3, 4, 5],
 ticks_positions: [1,20, 40, 60, 80, 100],
 ticks_labels: ["0.1","1", "2", "3", "4", "5"],
 ticks_snap_bounds: 0, 
 tooltip:"hide"
                           }) // sd prior
.on("change", function() {
  chart.dist1.slide("sd");
   updatePosterior();
  updateDonuts();
  chart.dist2.CI();
  chart.dist3.CI();
})
.on("slideStop", function() {
  setTimeout(function() {
    container.call(chart)
    chart.relax()}, 1000)
});
sliders.n = $("#slider-n").slider({min: 1, max: 101, value:10, step:1,
  ticks: [1,10, 20, 30, 40, 50, 75,100, 101],
  ticks_positions: [1, 10, 20, 30, 40, 50, 75, 96, 100],
  ticks_labels: ["1","10", "20", "30", "40", "50", "75","100", "1k"],
  ticks_snap_bounds: 0,
  tooltip:"hide"}) // sample n
.on("change", function() {
    chart.dist2.slide("n");
    updatePosterior();
  updateDonuts();
  chart.dist2.CI();
  chart.dist3.CI();
})
.on("slideStop", function() {
  setTimeout(function() {
    container.call(chart)
    chart.relax()}, 1000)
}); 


// sliders.n = $("#slider-n").slider({min: 1, max: 100, value:10, step:1,
//   ticks: [1,10, 20, 30, 40, 50, 75,100, 101, 102],
//   ticks_positions: [0.0, 10, 20, 30, 40, 50, 75, 90, 95, 100],
//   ticks_labels: ["1","10", "20", "30", "40", "50", "75","100", "1000", "10 000"],
//   ticks_snap_bounds: 1,
//   tooltip:"hide"}) // sample n
// .on("change", function() {
//     chart.dist2.slide("n");
//     updatePosterior();
//   updateDonuts();
//   chart.dist2.CI();
//   chart.dist3.CI();
// })
// .on("slideStop", function() {
//   setTimeout(function() {
//     container.call(chart)
//     chart.relax()}, 1000)
// }); 


function updatePosterior() {
  var s0 = chart.dist1.sd(), // prior sd
      s = 1, // sd
      mu0 = chart.dist1.mean(), // prior mean
      xbar = chart.dist2.mean(), // sample mean
      n = sliders.n.slider("getValue");
      if(n == 101) n = 1000;
          if(n == 102) n = 10000;

  var sp1 = ((s*s)*(s0*s0))/((s*s)+n*(s0*s0)), // var post 1 sample
      sp = Math.sqrt(sp1+sp1), // sd posterior mean diff
      mp = ((s*s)*mu0 + n*(s0*s0)*xbar) / (n*(s0*s0)+(s*s)); 

      chart.dist3.mean(mp).sd(sp).render();
};   
function updateDonuts() {
  container.bf01.call(donut.bf01.data(chart.bf()));
  container.bf10.call(donut.bf10.data(chart.bf()));
  container.pval.call(donut.pval.data(chart.pval()));
}

