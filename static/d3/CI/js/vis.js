var m = 0,
sd=2
n=5
draws=50,
CI_cov = [[0,0]];
drawn=1;
var speed = 500;
var CI_coverage = 0;
var ani_pause = false;


d3.select('#sample_size')
  .attr('placeholder', n)
  .on('change', function() {
    n = this.value
    dciUpdate();
  });
d3.select('#n-minus').on('click', function() {
  if(n - 1 > 2) {
    n = n - 1;
    dciUpdate();
    d3.select('#sample_size')
  .attr('placeholder', n);
  }
});
d3.select('#n-plus').on('click', function() {
    n = n + 1;
    dciUpdate();
    d3.select('#sample_size')
  .attr('placeholder', n);
});
d3.select('#draws')
  .attr('placeholder', draws)
  .on('change', function() {changeDraws(this.value);});
d3.select("#ani_toggle").on('click', function() {
  if(ani_pause == false) {
    ani_pause = true;
    d3.select(this).text('resume');
  } else {
    ani_pause = false;
    d3.select(this).text('pause');
    start();
  }
} );
d3.select('#plus').on('click', function() {

  if((speed - 50) >= 10) {
    speed = speed - 50;  
  } else speed = 5;
  });
d3.select('#minus').on('click', function() {speed = speed + 50});


var confidence = 0.95;
var $slider = $("#slider");
if ($slider.length > 0) {
  $slider.slider({
    min: 0.01,
    max: 0.99,
    value: 0.95,
    orientation: "horizontal",
    range: "min",
    animate: "fast",
    step: 0.01,
    slide: function(event, ui) {
        //$slider.slider("option", "step", parseFloat(0.1));
        confidence = ui.value;
        change(ui.value);
        $(".tooltip-inner").text(ui.value);},
    start: function(event, ui) {tooltip.tooltip("show"); $(".tooltip-inner").text(ui.value)},
    stop: function(event, ui) {tooltip.tooltip("hide"); updateCI(ui.value)}
     });
    }

$slider.find(".ui-slider-handle").append("<div class='slide-tooltip'/>");

var tooltip = $(".slide-tooltip").tooltip( {title: $("#slider").slider("value"), trigger: "manual"});







var drawGaussian = function(n, m, sd) {
  var tmp = [];
  var stop = n;
  for(var i = 0; i < stop; i++) {
    tmp[i] = jStat.normal.sample(m,sd);
  } 
  return tmp; 
}


// D3
  x_scale = d3.scale.linear();
    y_scale = d3.scale.linear();
function visSetup() {
  margin = {top: 20, right: 20, bottom: 50, left: 20},
  width = parseInt(d3.select('#viz').style('width'), 10) - margin.left - margin.right,
  height = draws * 12 - margin.top - margin.bottom;


    x_scale.range([0, width]);


  y_scale.range([0, height]);

  x_scale.domain([-5,5]);
  y_scale.domain([0,draws]);

  xAxis = d3.svg.axis()
  .scale(x_scale)
  .ticks(5)
  .orient("bottom");

};
visSetup();



// var yAxis = d3.svg.axis()
//   .scale(y_scale)
//   .ticks(5)
//   .orient("left");
svg = d3.select("#viz").append("svg");
function visSvg() {
  
  svg.attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .attr("transform", "translate(" + 0 + "," + 0 + ")");  

};
visSvg();

var sg = svg.append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
  
var lab = svg.append('g').attr("class", "labs");
var slab = lab.append('text')
  .attr("text-anchor", 'middle')
  .text("Sample mean");

function visLabs() {
  slab.attr("x", width/2+margin.left)
  .attr("y", height + margin.top + margin.bottom - 15);

};
visLabs();


lab.append('line').attr('class', 'mu-line')
  .attr("x1", 10) 
   .attr("x2", 20) 
  .attr("y1", 20)
  .attr("y2", 20) 
  lab.append('text').attr("class", "lab-text")
  .attr("x", 25)
  .attr("y", 24)
  .attr("text-anchor", 'left')
  .text("Population mean");

  lab.append('circle')
          .attr("class", "dot")
          .attr("r", 5)
  .attr("cx", 15) 
   .attr("cy", 35) 

  lab.append('text').attr("class", "lab-text")
  .attr("x", 25)
  .attr("y", 40)
  .attr("text-anchor", 'left')
  .text("Sample mean");


var xAx =  sg.append("g");
function visxAx() {
  xAx.attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(xAxis);
};
visxAx();

var ci_y  = 0;

var mu_line = sg.append('line')
  .attr("class", "mu-line");

function visMuLine() {
  mu_line.attr("y1", y_scale(0))
  .attr("y2", y_scale(draws))
  .attr('x1', x_scale(m))
  .attr('x2', x_scale(m));
};
visMuLine();  

var CI_not_mu = 0;

var ani_delay = 200;

function changeDraws(d) {

  if(d < 70) {
    $(window).off('.affix');
    $("#wrap-coverage")
        .removeClass("affix affix-top affix-bottom")
        .removeData("bs.affix");
  } else activateAffix();
  draws = d;
  height = draws * 12 - margin.top - margin.bottom;
  y_scale.range([height,0]).domain([draws, 0]);;

  svg.attr("height", height + margin.top + margin.bottom);
    yAx.transition().call(yAxis);
    xAx.transition().attr("transform", "translate(0," + height + ")").call(xAxis);
}

      // dots.transition()
      //   .duration(1000)
      //   .attr("cx", function(d) { return x_scale(z); })
      //   .attr("cy", function(d) { return y_scale(ci_y); });

      // dots.exit().remove();
      



function arcTween(a) {
  var i = d3.interpolate(this._current, a);
  this._current = i(0);
  return function(t) {
    return coverage.arc(i(t));
  };
}




//if(parseInt(d3.select('body').style('width'), 10) < 992) {
//  var donut_resize = 0.8;
//} else {
  var donut_resize = 0.4;
//}
var donut_radius = 0.7;
// coverage
var coverage = {};
coverage.Setup = function() {
  coverage.w = parseInt(d3.select('div#coverage').style('width'), 10);
  coverage.h = coverage.w * donut_resize+20;
  coverage.radius = (Math.min(coverage.w) / 2)*donut_resize - 30;
};
coverage.Setup();


coverage.color = ["#b5ccd4", "#F22613"];

coverage.pie = d3.layout.pie()
  .sort(null);

coverage.arc = d3.svg.arc()
  .innerRadius(coverage.radius-1)
  .outerRadius(coverage.radius *donut_radius);

coverage.svg = d3.select("div#coverage").append("svg")
  .attr("id", "coverage-container")
  .attr("width", coverage.w)
  .attr("height", coverage.h);
  //.attr("class", 'center-block');

coverage.g = coverage.svg   
  .append("g")
  .attr("transform", "translate(" + (coverage.w / 2) + "," + ((coverage.h+25) / 2) + ")");

coverage.path = coverage.g.selectAll("path")
  .data(coverage.pie([confidence, (1-confidence)]))
  .enter().append("path")
  .attr("fill", function(d, i) { return coverage.color[i]; })
  .attr("d", coverage.arc)
  .each(function(d) { this._current = d; });
  
  coverage.caption = coverage.g.append("text")
  .attr("class", "hitCaption")
  .attr("text-anchor","middle")
  .attr("x", 0)
  .attr("y", -coverage.radius-30)
  .attr("dy", "0.35em")
  .text("CI coverage (%)");

// CI gauge


// marker
svg.append("svg:defs").append("marker")
    .attr("id", "marker-start")
    .attr("class", "pointer")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 1)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,0L10,-5L10,5");  

  var range = 360,
    r = coverage.w/2;

  scale = d3.scale.linear()
      .range([0,1])
      .domain([0, 100]);
      
    ticks = d3.range(0,100, 5);

var label = coverage.g.append('g')
        .attr('class', 'label');
        //.attr('transform', 'translate('+r +','+ r +')');


    var pg = coverage.g.append('g').data([0]);
        //.attr('transform', 'translate('+r +','+ r +')');
        
pointer = pg.append('line')
        .attr('class', 'pointer')
        .attr("marker-start", "url(#marker-start)")
        .attr('transform', function(d) {
            var ratio = scale(d);
            var angle = (ratio * range);
            return 'rotate(' +angle +') translate(0,' +(10 - coverage.w/2) +')';
          })
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', r-10-coverage.arc.innerRadius()())
        .attr('y2', r-10-20);

coverage.ticks = label.selectAll('ticks')
        .data(ticks)
        .enter()
        .append('line')
        .attr("class", "gauge-ticks")
        .attr('transform', function(d) {
            var ratio = scale(d);
            var angle = (ratio * range);
            return 'rotate(' +angle +') translate(0,' +(10 - coverage.w/2) +')';
          })
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', r-10-coverage.arc.outerRadius()())
        .attr('y2', r-10-coverage.arc.innerRadius()());

 coverage.tick_text = label.selectAll('text')
        .data(ticks)
      .enter().append('text')
      .attr("class", "tick-text")
        .attr('transform', function(d) {
          var ratio = scale(d);
          var angle = (ratio * range);
          return 'rotate(' +angle +') translate(0,' +(-coverage.radius-5) +')';
        })
        .text(d3.format(',g'))
        .attr("text-anchor", "middle");  

  coverage.text = coverage.g.append("text")
  .attr("class", "percHit")
  .attr("text-anchor","middle")
  .attr("x", 0)
  .attr("y", 0)
  .attr("dy", "0.35em")
  //.text(d3.round(CI_coverage*100, 2) + " %");  
  .text(0);    

  coverage.hit = coverage.g.append("text")
  .attr("class", "hitLab")
  .attr("text-anchor","middle")
  .attr("x", coverage.w/3)
  .attr("y", -30)
  .attr("dy", "0.35em")
  .text("μ included");  

  coverage.hitmiss = coverage.g.append("text")
  .attr("class", "hitLab")
  .attr("text-anchor","middle")
  .attr("x", -coverage.w/3)
  .attr("y", -30)
  .attr("dy", "0.35em")
  .text("μ missed"); 

 cov_hit = coverage.g.append("text")
  .attr("class", "hitn")
  .attr("text-anchor","middle")
  .attr("x", coverage.w/3)
  .attr("y", 0)
  .attr("dy", "0.35em")
  .text(0);  

 cov_miss = coverage.g.append("text")
  .attr("class", "hitn")
  .attr("text-anchor","middle")
  .attr("x", -coverage.w/3)
  .attr("y", 0)
  .attr("dy", "0.35em")
  .text(0); 


function newCI(c) {
  // recalc CIs
  // called from slider
    var data2 = []
    confidence = c;
    var Z = jStat.studentt.inv(1-(1-confidence)/2,n-1)
    var i, y, stdev;
    for(i = 0; i < draws; i++) {
        y = data[i][0];
        stdev = data[i][2];
        data2.push([y, Z * stdev/Math.sqrt(n), stdev ]);
    }
    return data2
  }


  //var dots = svg.selectAll(".dot");

function checkCIcover(i, recalc) {
  if(Math.abs(data[i][0]) - data[i][1] > 0) {
    if(recalc == false) {
        CI_not_mu = CI_not_mu + 1;
    }

    return 'CI CI-reds';
    } else return 'CI';
}
function updateGauge(c) {

    coverage.text
           .text((d3.round(c*100,1))); 

      var ratio = scale(CI_coverage*100);
      var newAngle = (ratio * range);
      pointer
        .transition()
          .duration(200)
          .ease('elastic')
          .attr('transform', function(d) {
            var ratio = scale(CI_coverage*100);
            var newAngle = (ratio * range);
            return 'rotate(' +newAngle +') translate(0,' +(10 - coverage.w/2) +')';
          });
      //d3.select('#CIs-sampled').text(drawn); 
      
      updateRw();


}
function updateCount() {
  // updates count of CI coverage
    drawn++;       
    CI_coverage = 1 - (CI_not_mu / drawn);  
    CI_cov.push([CI_coverage, drawn]); 
    cov_miss.text(CI_not_mu);
    cov_hit.text(drawn-CI_not_mu);
}

function CI_f(d,i) {
      var CI_lines = dots.append("line")
            .attr('class', function() {return checkCIcover(i, recalc = false)})
            .attr("y1", y_scale(i))
            .attr("y2", y_scale(i))
            .attr('x1', x_scale(d[0]))
            .attr('x2', x_scale(d[0]))
            .transition()
                .duration(600)   
               .attr('x1', function() { return x_scale(d[0] - d[1]); })
               .attr('x2', function() { return x_scale(d[0] + d[1]); })
               .each('end', function() {

                  if(i == 49) return start(); // start repeated ani
               })

      updateCount(); 
      // update donut chart text
      updateGauge(CI_coverage);
       
}

clip = sg.append("defs").append("clipPath")
    .attr("id", "clip_main")
  .append("rect")
    .attr("width", width)
    .attr("height", height);
var dots = sg.append('g').attr("clip-path", "url(#clip_main)").append('g').attr('class', 'CIs');

var data = [];

  for(k = 0; k < draws; k++) {
    data.push(oneCI());
  } 


   dot = dots.selectAll(".dot")
    .data(data)

    dot.enter().append("circle")
         .attr("class", "dot")
          .attr("r", 5)
          .attr("cx", function(d) { return x_scale(d[0]); })
          .attr("cy", function(d) { return y_scale(-10)})

    dot.transition()
      .delay(function(d,i) { return i * 50})
      .attr("cy", function(d,i) { return y_scale(i) })
      .each('end', CI_f);


function oneCI() {
      var y = drawGaussian(n, m, sd);
      var Z = jStat.studentt.inv(1-(1-confidence)/2,n-1)
      return [d3.mean(y), Z * jStat.stdev(y, true)/Math.sqrt(n), jStat.stdev(y, true) ];
}

function start() {

  function tick() {
    if(ani_pause == true) return // pause redraw

data.push(oneCI());
data.shift();

         d3.selectAll('.CI')
          .data(data)
          .attr("class", function(d,i) { 
                if(Math.abs(d[0]) -d[1] > 0) {
                  if(i == 49) CI_not_mu = CI_not_mu + 1;
                return 'CI CI-reds';
                } else return 'CI';
           }) 
          .attr("y1", function(d,i) { return y_scale(i)} )
          .attr("y2", function(d,i) { return y_scale(i)} )
          .attr('x1', function(d,i) { 
            if(i == 49) {
              return x_scale(d[0]);
            } else return x_scale(d[0] - d[1]); })
          .attr('x2', function(d,i) { 
            if(i == 49) {
              return x_scale(d[0]);
            } else return x_scale(d[0] + d[1]); })
          .transition()
             .duration(speed)   
               .attr('x1', function(d) { return x_scale(d[0] - d[1]); })
               .attr('x2', function(d) { return x_scale(d[0] + d[1]); }); 
        updateCount();
   
      // update donut chart text
      updateGauge(CI_coverage);

    dot.data(data) 
      .attr("cx", function(d,i) { return x_scale(d[0]) })
      .attr("cy", function(d,i) { 
        if(i == 49) {
          return y_scale(-5);
        } else return y_scale(i) 
      })
      .transition() 
          .attr("cy", function(d,i) {  return y_scale(i); });

      svg.select('.CIs')
        .attr("transform", "translate(" + 0 + "," + y_scale(1) + ")")
        .transition()
          .ease("linear")
          .duration(speed)
          .attr("transform", "translate(" + 0 + "," + y_scale(0) + ")")
          .each('end', tick)
      }
tick();

}
    

function change(c) {
  // updates guage, and heading count
  $('#confidence').text(d3.round(c*100,2));
        coverage.path.data(coverage.pie([confidence, (1-confidence)]))
        .transition()
        .duration(100)
        .attrTween("d", arcTween);
  $('#CIs-sampled').text(50);   
  dciUpdate();  
}


function updateCI(c) {
  data = newCI(c);
  drawn = 0;
  CI_not_mu = 0;
  CI_cov = [];
  d3.selectAll('.CI')
        .data(data)
        .transition()
              .attr('x1', function(d) { return x_scale(d[0] - d[1]); })
              .attr('x2', function(d) { return x_scale(d[0] + d[1]); })
              .attr('class', function(d,i) { return checkCIcover(i, recalc=true) });

for (var i = 0; i < 50; i++) {
        if(Math.abs(data[i][0]) - data[i][1] > 0) {
           CI_not_mu = CI_not_mu + 1;
        }
        CI_coverage = 1 - (CI_not_mu / (i+1));   
        drawn++;
        CI_cov.push([CI_coverage, drawn]);  
        };         
   rw.path.datum(CI_cov)
    .attr("d", rw.line)
    .attr("transform", null)
    .transition()
      .duration(speed)
      .ease("linear");

      function rw_max(c) {
              if(c + 0.2 >= 1) {
        return 1;
      } else {
        return (c + 0.2)
      };

      }
 
    rw.y.domain([c-0.2, rw_max(c)]);
    d3.selectAll("#random-walk .y.axis").transition().call(d3.svg.axis().scale(rw.y).orient("left").ticks("5"));
    rw.x.domain([0, rw.n]);
    d3.selectAll("#random-walk .x.axis").transition()
    .call(d3.svg.axis().scale(rw.x).orient("bottom"));
    rw.grid.transition().call(d3.svg.axis().scale(rw.x).orient('bottom')
          .tickSize(-rw.height, 0, 0)
          .tickFormat("")
          );
    rw.mu.transition()
      .attr("y1", rw.y(c))
      .attr("y2", rw.y(c));
  updateGauge( CI_coverage);              
  //checkCIcover(i, CI_lines);  

}


var rw = {margin: {top: 40, right: 20, bottom: 50, left: 40}};
    rw.n = 500;
    rw.x = d3.scale.linear();
    rw.y = d3.scale.linear();
 rw.Setup = function() {
    rw.width = parseInt(d3.select('#random-walk').style('width'), 10) - rw.margin.left - rw.margin.right;
    rw.height = 150 - rw.margin.top - rw.margin.bottom;
    rw.x
          .domain([0, rw.n])
          .range([0, rw.width]);

    rw.y
        .domain([0.8, 1])
        .range([rw.height, 0]);
 };
 rw.Setup();

rw.line = d3.svg.line()
    .x(function(d, i) { return rw.x(d[1]); })
    .y(function(d, i) { return rw.y(d[0]); });

rw.svg1 = d3.select("#random-walk").append("svg");
rw.setupSvg = function() {
      rw.svg1.attr("width", rw.width + rw.margin.left + rw.margin.right)
        .attr("height", rw.height + rw.margin.top + rw.margin.bottom);
   

};
rw.setupSvg();
rw.svg = rw.svg1.append("g")
        .attr("transform", "translate(" + rw.margin.left + "," + rw.margin.top + ")");

rw.clip = rw.svg.append("defs").append("clipPath").attr("id", "clip")
  .append("rect");
rw.setupClip = function() {
     rw.clip
    .attr("width", rw.width)
    .attr("height", rw.height);
};
rw.setupClip();


rw.xAx = rw.svg.append("g")
    .attr("class", "x axis");
rw.setupxAx = function() {
   rw.xAx.attr("transform", "translate(0," + rw.y(0.8) + ")")
    .call(d3.svg.axis().scale(rw.x).orient("bottom"));
};
rw.setupxAx();


rw.yAx = rw.svg.append("g")
    .attr("class", "y axis");
rw.setupyAx = function() {
  rw.yAx.call(d3.svg.axis().scale(rw.y).orient("left").ticks("5"));
};
rw.setupyAx();
    

rw.grid = rw.svg.append("g")            
  .attr("class", "grid");
rw.setupGrid = function() {
  rw.grid.
    attr("transform", "translate(0," + rw.height + ")")
    .call(d3.svg.axis().scale(rw.x).orient('bottom')
        .tickSize(-rw.height, 0, 0)
        .tickFormat("")
  );
};
rw.setupGrid();


rw.rlabel = rw.svg.append('text')
  .attr("class", "rlabel")  
  .attr("y", -15)
  .attr("text-anchor", "middle")
  .text('Proportion of CIs that include population mean');
rw.setupRlabel = function() {
      rw.rlabel.attr("x", rw.x(250));
};
rw.setupRlabel();  


rw.rlabel_bottom = rw.svg.append('text')
  .attr("class", "rlabel_bottom")
  .attr("text-anchor", "middle")
  .text('Samples drawn');

rw.setupRlabel_bottom = function() {
  rw.rlabel_bottom
      .attr("x", rw.x(250))
      .attr("y", rw.height + 40);
};
rw.setupRlabel_bottom(); 

rw.path = rw.svg.append("g")
    .attr("clip-path", "url(#clip)")
  .append("path")
    .datum(CI_cov)
    .attr("class", "line");
    
rw.setupPath = function() {
  rw.path
    .attr("d", rw.line);
};
rw.setupPath();

rw.mu = rw.svg.append('line')
  .attr("class", "mu-line");
rw.setupMu = function() {
  rw.mu
    .attr("x1", rw.x(0))
    .attr("x2", rw.x(500))
    .attr("y1", rw.y(0.95))
    .attr("y2", rw.y(0.95));
};
rw.setupMu();  

function updateRw() {      
  rw.path
  .attr("d", rw.line)
  .attr("transform", null)
  .transition()
    .duration(speed)
    .ease("linear");

if(CI_cov.length > rw.n) {
    rw.x.domain([drawn-rw.n, drawn])
    d3.selectAll("#random-walk .x.axis").transition()
    .call(d3.svg.axis().scale(rw.x).orient("bottom"));
    rw.grid.transition().call(d3.svg.axis().scale(rw.x).orient('bottom')
          .tickSize(-rw.height, 0, 0)
          .tickFormat("")
          );
    CI_cov.shift();
    }
  };

function qci(a,n) {
  // ger percentile of CI samp dist
  var s2 = Math.pow(sd, 2);
  var q = Math.sqrt(s2*jStat.chisquare.inv(a, n-1)/(n-1))*2*jStat.studentt.inv(1-(1-confidence)/2, n-1)/Math.sqrt(n);
  return q;
}


  

 var wdist = [qci(0.001, n), qci(0.999, n)]

    function dchi(x, df) {
      // density function chi distribution
      var y = Math.pow(2,(1- df/2)) * Math.pow(x, (df-1)) * Math.exp(-(Math.pow(x,2)/2))/jStat.gammafn(df/2);
      return y;
    };
    function dciData() {
      // gen scaled chi dist
      var a = 1-confidence;
      var x = [];
      for (var i = wdist[0]; i <= wdist[1]; i += 0.01) {
        x.push(i);
      }

      var y = [];
      var s2 = Math.pow(sd, 2);
      sp = Math.sqrt(s2/(n-1)) * 2 * jStat.studentt.inv(1-a/2, (n-1))/Math.sqrt(n)   // scale parameter
      for(var i = 0; i < x.length; i++) {
        var hx = dchi(x[i]/sp, n-1)/sp;
        y.push(hx);
      }
        var data = [];
        for(var i = 0; i < x.length; i++) {
          data.push([x[i], y[i]]);
        }
        return {x:x, y:y, data:data};
      }

  dci = {data: dciData()};
  dci.margin = {top: 40, right: 20, bottom: 50, left: 20};
  dci.x = d3.scale.linear();
  dci.y = d3.scale.linear();
  dci.Setup = function () {
      dci.width = parseInt(d3.select('#dci').style('width'), 10) - dci.margin.left - dci.margin.right;
      dci.height = 150 - dci.margin.top - dci.margin.bottom;

      dci.x.domain(wdist)
          .range([0, dci.width]);
      dci.y.domain([0, d3.max(dci.data.y)*1.1])
        .range([dci.height, 0]);
  }
   dci.Setup();
  

dci.xAxis = d3.svg.axis().scale(dci.x).orient("bottom");

dci.line = d3.svg.line()
    .x(function(d, i) { return dci.x(d[0]); })
    .y(function(d, i) { return dci.y(d[1]); });

dci.svg = d3.select("#dci").append("svg")
    .attr("width", dci.width + dci.margin.left + dci.margin.right)
    .attr("height", dci.height + dci.margin.top + dci.margin.bottom);

dci.g = dci.svg.append("g")
    .attr("transform", "translate(" + dci.margin.left + "," + dci.margin.top + ")");

dci.gradient = dci.g.append("svg:defs")
  .append("svg:linearGradient")
    .attr("id", "gradient")
    .attr("x1", "0%")
    .attr("x2", "0%")
    .attr("y1", "0%")
    .attr("y2", "100%")
    .attr("spreadMethod", "pad");

dci.gradient.append("svg:stop")
    .attr("offset", "0%")
    .attr("stop-color", "#fff")
    .attr("stop-opacity", 0.4);

dci.gradient.append("svg:stop")
    .attr("offset", "100%")
    .attr("stop-color", "#fff")
    .attr("stop-opacity", 0);


dci.xAx = dci.g.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + dci.y(0) + ")")
    .call(dci.xAxis);

     dci.grid = dci.g.append("g")            
        .attr("class", "grid")
        .attr("transform", "translate(0," + dci.height + ")")
        .call(dci.xAxis
            .tickSize(-dci.height, 0, 0)
            .tickFormat("")
        )    

dci.label = dci.g.append('text')
  .attr("class", "dcilabel")
  .attr("x", dci.width/2)
  .attr("y", -15)
  .attr("text-anchor", "middle")
  .text('CIs sampling distribution');

dci.labelBottom = dci.g.append('text')
  .attr("class", "dcilabel_bottom")
  .attr("x", dci.width/2)
  .attr("y", dci.height + 40)
  .attr("text-anchor", "middle")
  .text('CI Width');

dci.path = dci.g.append("g")
  .append("path")
    .datum(dci.data.data)
    .attr("class", "line ci-dist")
    .attr("d", dci.line);

   dci.mulineL = dci.g.append('line')
      .attr("id", "dci-left")
      .attr("class", "mu-line")
      .attr("x1", dci.x(qci(0.025, n)))
      .attr("x2", dci.x(qci(0.025, n)))
      .attr("y1", 0)
      .attr("y2", dci.height);

     dci.mulineR = dci.g.append('line')
       .attr("id", "dci-right")
      .attr("class", "mu-line")
      .attr("x1", dci.x(qci(0.975, n)))
      .attr("x2", dci.x(qci(0.975, n)))
      .attr("y1", 0)
      .attr("y2", dci.height);


function dciUpdate() {
  wdist = [qci(0.001, n), qci(0.999, n)];
  dci.data = dciData();

  dci.x.domain(wdist);
  dci.y.domain([0, d3.max(dci.data.y)*1.1]);
  //dci.xAxis.scale(dci.x);
  dci.path.datum(dci.data.data)
    .attr("d", dci.line);
  d3.selectAll("#dci .x.axis").transition()
    .call(d3.svg.axis().scale(dci.x).orient("bottom"));


      d3.select('#dci-left').transition()
      .attr("x1", dci.x(qci(0.025, n)))
      .attr("x2", dci.x(qci(0.025, n)));

      d3.select('#dci-right').transition()
      .attr("x1", dci.x(qci(0.975, n)))
      .attr("x2", dci.x(qci(0.975, n)));

}

function resizeVis() {
  visSetup();
  visSvg();
  clip.attr("width", width)
      .attr("height", height);
  visLabs();
  visxAx();
  visMuLine();

  rw.Setup();
  rw.setupSvg();
  rw.setupyAx();
  rw.setupxAx();
  rw.setupMu();
  rw.setupPath();
  rw.setupRlabel();
  rw.setupRlabel_bottom();
  rw.setupClip();
  rw.setupGrid();

// break pattern...
      dci.width = parseInt(d3.select('#random-walk').style('width'), 10) - dci.margin.left - dci.margin.right;
      dci.height = 150 - dci.margin.top - dci.margin.bottom;

      dci.x.domain(wdist)
          .range([0, dci.width]);
      dci.y.domain([0, d3.max(dci.data.y)*1.1])
        .range([dci.height, 0]);



    

dci.xAx
  .attr("transform", "translate(0," + dci.y(0) + ")")
    .call(d3.svg.axis().scale(dci.x).orient("bottom"));

      dci.grid
        .attr("transform", "translate(0," + dci.height + ")")
            .call(dci.xAxis
                .tickSize(-dci.height, 0, 0)
                .tickFormat("")
            );
          dci.label.attr("x", dci.width/2);
          dci.labelBottom
              .attr("x", dci.width/2)
          .attr("y", dci.height + 40);
      dci.path.attr("d", dci.line);

      dci.mulineL
          .attr("x1", dci.x(qci(0.025, n)))
            .attr("x2", dci.x(qci(0.025, n)))
            .attr("y2", dci.height);
        dci.mulineR
          .attr("x1", dci.x(qci(0.975, n)))
          .attr("x2", dci.x(qci(0.975, n)))
          .attr("y2", dci.height);

coverage.Setup();
coverage.arc
    .innerRadius(coverage.radius-1)
    .outerRadius(coverage.radius *donut_radius);
coverage.svg
  .attr("width", coverage.w)
    .attr("height", coverage.h);

coverage.g
    .attr("transform", "translate(" + (coverage.w / 2) + "," + ((coverage.h+25) / 2) + ")");

coverage.path
  .attr("d", coverage.arc);

coverage.caption
    .attr("y", -coverage.radius-30);

r = coverage.w/2;

pointer
    .attr('transform', function(d) {
        var ratio = scale(d);
        var angle = (ratio * range);
        return 'rotate(' +angle +') translate(0,' +(10 - coverage.w/2) +')';
      })
    .attr('y1', r-10-coverage.arc.innerRadius()())
    .attr('y2', r-10-20);

coverage.ticks
        .attr('transform', function(d) {
            var ratio = scale(d);
            var angle = (ratio * range);
            return 'rotate(' +angle +') translate(0,' +(10 - coverage.w/2) +')';
          })
        .attr('y1', r-10-coverage.arc.outerRadius()())
        .attr('y2', r-10-coverage.arc.innerRadius()());

 coverage.tick_text 
        .attr('transform', function(d) {
          var ratio = scale(d);
          var angle = (ratio * range);
          return 'rotate(' +angle +') translate(0,' +(-coverage.radius-5) +')';
        });
coverage.hit
    .attr("x", coverage.w/3);

coverage.hitmiss
    .attr("x", -coverage.w/3);
cov_hit.attr("x", coverage.w/3);
cov_miss.attr("x", -coverage.w/3)

      dci.svg.attr("width", dci.width + dci.margin.left + dci.margin.right)
               .attr("height", dci.height + dci.margin.top + dci.margin.bottom);

};

// Bootstrap

  var wwidth = $(window).width();
  

             $(window).resize(function () {
              if($(window).width() != wwidth){
             console.log('resize');
                resizeVis();
            wwidth = $(window).width();
        }
             
            });



// debug
function testGauss(sims, n, m, s) {
	

	
	var mu = [];
	var sigma = [];
  for(var i = 0; i < sims; i++) {
  	var y = [];
  	for(var j = 0; j < n; j++) {
  		y[j] = jStat.normal.sample(m,s); 
  	}
   
    mu[i] = d3.mean(y);
    sigma[i] = jStat.stdev(y, true);

  } 
return {mu: mu, sigma:sigma, mu_hat: d3.mean(mu), sigma_hat: d3.mean(sigma)};
}
