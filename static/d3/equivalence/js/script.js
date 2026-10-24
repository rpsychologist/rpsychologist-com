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
    var margin = {
            top: 25,
            right: 10,
            bottom: 30,
            left: 5
        },
        width = 500,
        aspect = 0.6,
        height = 250;
    m1 = 0,
        s1 = 1,
        m2 = 0.5,
        s2 = 1,
        duration = 600;

    n = 10;

    // private
    var svg, xScale, yScale, w, h, container, dist1, dist2, y_max, x_max, verdict,
        x;

    // Line function
    var line = d3.svg.line()
        .x(function(d) {
            return xScale(d[0])

        })
        .y(function(d) {
            return yScale(d[1]);
        })

    _data = {};




    // dist creator
    var Dist = function(_name, _type, _m, _s) {

        // defaults
        var _m = typeof _m !== 'undefined' ? _m : 0;
        var _s = typeof _s !== 'undefined' ? _s : 1;
        var _d = typeof _d !== 'undefined' ? _d : 0.3;

        delta = _d; // public
        m = _m;

        var name = _name,
            type = _type,
            s = _s, // sd

            init = {
                "m": m,
                "s": s
            },
            lab_heights = {
                "eq": {
                    "h": 30,
                    "y": 60
                },
                "ni": {
                    "h": 30,
                    "y": 0
                },
                "su": {
                    "h": 30,
                    "y": 30
                },
                "inf": {
                    "h": 30,
                    "y": 30
                },
                "pos": 30
            },
            lwr, upr, //ci
            label, brush;
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
        that.delta = function(_d) {
            if (!arguments.length) return delta;
            delta = _d;
            return this;
        }

        that.type = function(_type) {
            if (!arguments.length) return type;
            type = _type;
            return this;
        }

        // change height of margin regions
        that.lab_heights = function(_label, _height) {
            var height;
            if (arguments.length == 1) return lab_heights[_label];
            if (_height == "full") {
                if (_label == "eq") {
                    height = (h - lab_heights.pos - 30);
                } else if (_label == "su") {
                    height = (h - lab_heights.pos);
                } else if (_label == "inf") {
                    height = (h - lab_heights.pos);
                } else {
                    height = h;
                    lab_heights.ni.y = 0;
                    lab_heights.eq.y = 60;
                    lab_heights.su.y = 30;
                }
            } else height = _height;


            lab_heights[_label].h = height;
            return this;
        }
        that.init = function() {
            return init;
        }



        that.CI = function(_cover) {

            return function() {

                var z = -1 * jStat.normal.inv((1 - _cover) / 2, 0, 1);
                var name = _cover.toString().slice(2);
                name = "CI".concat(name);
                lwr = m - z * s;
                upr = m + z * s;
                console.log("lwr " + lwr + " upr " + upr + " z " + z + " se " + s)
                var line = svg.select(".CI-group").selectAll(".CI-line." + name).data([
                        [lwr, upr]
                    ]),
                    circle = svg.select(".CI-group").selectAll(".CI-circle").data([m]),
                    padding, lab;
                if (type == "likelihood") {
                    lab = "95 % CI"
                    padding = 40;
                } else if (type == "posterior") {
                    lab = "95 % HDI"
                    padding = 60;

                }
                var anchor = "middle",
                    labx = xScale(m);

                container.select(".CI-group").append("svg:line")
                    .attr("id", "h0-line")

                svg.select("#h0-line").transition()
                    .attr("x1", xScale(0))
                    .attr("y1", 0)
                    .attr("x2", xScale(0))
                    .attr("y2", h)

                line.enter().append("line")
                    .attr("class", "CI-line " + name);
                label_d_bg = svg.select(".CI-group").selectAll(".ci_d_bg").data([m]);


                var label = svg.select(".CI-group").selectAll("text.CI-range").data([{
                    "pos": xScale(lwr),
                    "anchor": "end"
                }, {
                    "pos": xScale(upr),
                    "anchor": "start"
                }]);
                label_verdict = svg.select(".CI-group").selectAll("text.verdict").data([m]);
                label_d = svg.select(".CI-group").selectAll("text.lab_d").data([m]);




                label_d_bg.enter().append("rect")
                    .attr("class", "ci_d_bg")
                    .attr("y", h * 0.75 - 45)
                    .attr("height", 30)
                    .attr("width", 80);


                label_d_bg
                    .attr("x", xScale(m) - 40);

                label.enter().append("text")
                    .attr("text-anchor", function(d) {
                        return d.anchor
                    })
                    .attr("y", h * 0.75 + 4)
                    .attr("class", "CI-range");

                label
                    .attr("x", function(d, i) {
                        var x = i == 0 ? d.pos - 5:d.pos + 5;
                        return x;
                    })
                    .text(function(d) {
                        return d3.round(xScale.invert(d.pos), 2)
                    });






                line
                    .attr("x1", function(d) {
                        return xScale(d[0])
                    })
                    .attr("x2", function(d) {
                        return xScale(d[1])
                    })
                    .attr("y1", h * 0.75)
                    .attr("y2", h * 0.75)





                //"d = " + d3.format(".2f")(m)

                circle.enter().append("circle")
                    .attr("cy", h * 0.75)
                    .attr("r", 18)
                    .attr("class", "CI-circle");

                circle
                    .attr("cx", xScale(m));


                label_d.enter().append("text")
                    .attr("text-anchor", "middle")
                    .attr("class", "lab_d");


                label_d
                    .attr("x", labx)
                    .attr("y", h * 0.75 + 4)
                    .text(+d3.format(".2f")(m));


                label_verdict.enter().append("text")
                    .attr("text-anchor", "middle")
                    .attr("class", "verdict");


                label_verdict
                    .attr("x", labx)
                    .attr("y", h * 0.75 - 25)
                    .text(verdict);


                // equivalence


                // non-inferior
                if (lwr > -delta) {
                    that.lab_heights("ni", "full");
                    that.margin_toggle(".margin.ni", true)
                    verdict = "non-inferior"
                    d3.select("#span_verdict").html(verdict)
                } else {
                    that.lab_heights("ni", 30);
                    that.margin_toggle(".margin.ni", false)
                }
                // inferior
                if (upr < 0) {
                    that.lab_heights("inf", "full");
                    that.margin_toggle(".margin.inf", true)
                    verdict = "inferior";
                    d3.select("#span_verdict").html(verdict)
                } else {
                    that.lab_heights("inf", 30);
                    that.margin_toggle(".margin.inf", false)
                }
                // superior
                if (lwr > 0) {
                    that.lab_heights("su", "full");
                    that.margin_toggle(".margin.su", true)
                    verdict = "superior"
                    d3.select("#span_verdict").html(verdict)
                } else {
                    that.lab_heights("su", 30);
                    that.margin_toggle(".margin.su", false)
                }
                if (lwr > -delta && upr < delta) {

                    that.lab_heights("eq", "full");
                    that.margin_toggle(".margin.eq", true)
                    verdict = "equivalent"
                    d3.select("#span_verdict").html(verdict)
                } else {
                    that.lab_heights("eq", 30);
                    that.margin_toggle(".margin.eq", false)

                }
                if (!(lwr > -delta) & !(upr < 0) & !(lwr > 0) & !(lwr > -delta && upr < delta))
                    verdict = "inconclusive";
                d3.select("#span_verdict").html(verdict)

            }


        }


        that.margin = function() {

            var rect_ni = svg.select(".margin.ni").selectAll("rect").data([delta]),
                rect_eq = svg.select(".margin.eq").selectAll("rect").data([delta]),
                rect_inf = svg.select(".margin.inf").selectAll("rect").data([delta]),
                rect_su = svg.select(".margin.su").selectAll("rect").data([delta]),
                lab_delta = svg.select(".margin.delta_lab").selectAll("text").data([{
                    "pos": -delta,
                    "lab": "-Δ"
                }, {
                    "pos": delta,
                    "lab": "Δ"
                }])
            label_su = svg.select(".margin.labs.su").selectAll("text").data([delta]),
                label_eq = svg.select(".margin.labs.eq").selectAll("text").data([delta]),
                label_inf = svg.select(".margin.labs.inf").selectAll("text").data([delta]),
                label_ni = svg.select(".margin.labs.ni").selectAll("text").data([delta]),
                line_lwr = svg.select(".margin.line").selectAll("line").data([
                    [-delta],
                    [delta]
                ]);






            rect_ni.enter().append("rect")
                .attr("class", "ni")
                .attr("y", lab_heights.ni.y)
                .attr("height", lab_heights.ni.h);


            rect_ni.transition()
                .attr("y", lab_heights.ni.y)
                .attr("height", lab_heights.ni.h)
                .attr("x", function(d) {
                    return xScale(-d)
                })
                .attr("width", function(d) {
                    return width - xScale(-d)
                });


            rect_eq.enter().append("rect")
                .attr("class", "eq")
                .attr("y", lab_heights.eq.y)
                .attr("height", lab_heights.eq.h);

            rect_eq.transition()
                .attr("y", lab_heights.eq.y)
                .attr("height", lab_heights.eq.h)
                .attr("x", function(d) {
                    return xScale(-d)
                })
                .attr("width", function(d) {
                    return xScale(d) - xScale(-d)
                });


            rect_su.enter().append("rect")
                .attr("class", "su")
                .attr("y", lab_heights.su.y)
                .attr("height", lab_heights.su.h);

            rect_su.transition()
                .attr("y", lab_heights.su.y)
                .attr("height", lab_heights.su.h)
                .attr("x", xScale(0))
                .attr("width", width - xScale(0));

            rect_inf.enter().append("rect")
                .attr("class", "inf")
                .attr("y", lab_heights.inf.y)
                .attr("height", lab_heights.inf.h);

            rect_inf.transition()
                .attr("y", lab_heights.inf.y)
                .attr("height", lab_heights.inf.h)
                .attr("x", 0)
                .attr("width", xScale(0));

            line_lwr.enter().append("line")
                .attr("class", "ni")
                .attr("id", "test33");

            line_lwr.transition()
                .attr("x1", function(d) {
                    return xScale(d)
                })
                .attr("x2", function(d) {
                    return xScale(d)
                })
                .attr("y1", h)
                .attr("y2", 0)

            // labels
            label_eq.enter().append("text")
                .attr("class", "eq")
                .attr("x", xScale(0))
                .attr("y", lab_heights.eq.y + 20)
                .attr("text-anchor", "middle")
                .text("Equivalence");

            label_eq.transition()
                .attr("x", xScale(0))

            label_inf.enter().append("text")
                .attr("class", "inf")
                .attr("x", xScale(0) - 10)
                .attr("y", lab_heights.inf.y + 20)
                .attr("text-anchor", "end")
                .text("← Inferior");

            label_inf.transition()
                .attr("x", xScale(0) - 10)

            label_su.enter().append("text")
                .attr("class", "su")
                .attr("x", xScale(0) + 10)
                .attr("y", lab_heights.su.y + 20)
                .attr("text-anchor", "start")
                .text("Superior →");

            label_su.transition()
                .attr("x", xScale(0) + 10)

            label_ni.enter().append("text")
                .attr("class", "ni")
                .attr("x", function(d) {
                    return xScale(-d) + 10
                })
                .attr("y", lab_heights.ni.y + 20)
                .attr("text-anchor", "start")
                .text("Non-inferior →");


            label_ni.transition()
                .attr("x", function(d) {
                    return xScale(-d) + 10
                })


            lab_delta.enter().append("text")
                .attr("class", "lab-delta")
                .attr("text-anchor", "middle")
                .attr("y", h + 20)
                .text(function(d) {
                    return d.lab
                });


            lab_delta.transition()
                .attr("x", function(d) {
                    return xScale(d.pos)
                });

        }
        that.margin_toggle = function(_el, _mod) {
            _select = d3.select(_el);

            if (!_select.classed("active") == _mod) {

                _select.classed("active", _mod);
                d3.select(_el + ".labs").classed("active", _mod);
                d3.select(".CI-group").classed("active", _mod);
                that.margin();
            }
            if (d3.selectAll(".active")[0].length > 0) {
                d3.select(".CI-group").classed("active", true);
            } else {
                d3.select(".CI-group").classed("active", false);
            }
        }

        that.slide = function(_x) {
            if (type == "likelihood" && _x == "m") {
                m = sliders.m.slider("getValue")
                var tmp = d3.format(".2f")(m);
                d3.select("#span_d").html(tmp);
            } else if (type == "likelihood" && _x == "delta") {
                delta = sliders.margin.slider("getValue")
                d3.select("#span_margin").html(delta);
            } else if (type == "likelihood" && _x == "n") {
                n = sliders.n.slider("getValue")
                if (n == 101) n = 1000;
                if (n == 102) n = 10000;
                d3.select("#span_n").html(n);
                s = Math.sqrt(1 / n + 1 / n);
            }
            that.render();
        }
        that.render = function() {

            var top_text = svg.select(".top_favors").selectAll("text").data([{
                "lab": "← Favors old treatment",
                "anchor": "end",
                "x": -10
            }, {
                "lab": "Favors new treatment →",
                "anchor": "start",
                "x": 10
            }]);



            top_text.enter().append("text")
                .attr("text-anchor", function(d) {
                    return d.anchor
                })
                .attr("y", -10)
                .text(function(d) {
                    return d.lab
                })

            top_text.transition().attr("x", function(d) {
                return xScale(0) + d.x
            });


            // var text_w = d3.selectAll(".top_favors text")[0],
            //     top_favors = svg.select(".top_favors").selectAll("line").data([{
            //         "x1": 0,
            //         "x2": (xScale(0) - text_w[0].getBBox().width - 15)
            //     }, {
            //         "x1": xScale(0) + text_w[1].getBBox().width + 15,
            //         "x2": width
            //     }]);

            // top_favors.enter().append("line")
            //     .attr("y1", -16)
            //     .attr("y2", -16);


            // top_favors.transition()
            //     .attr("x1", function(d) {
            //         return d.x1
            //     })
            //     .attr("x2", function(d) {
            //         return d.x2
            //     })


            //     _data[name] = genData(init.m, s);

            //  // var dist = svg.select(".dist-group."+type).selectAll("." + name).data([_data[name].data]);
            //  var dist = svg.select(".dist-group."+type).selectAll("." + name).data([_data[name].data]);

            //  dist.enter().append("path") 
            //  .attr("d", line)
            //  .attr("class", name);

            //  svg.select(".dist-group."+type).transition()
            //  .ease("linear")
            //  .duration(duration)
            //  .attr("transform", "translate(" + (xScale(m)-xScale(init.m)) + "," + 0 + ")");


            //  dist.transition().duration(duration)
            //    .attr("d", line);

            //  label = svg.select(".dist-group").selectAll(".dist-label."+type).data([m]);

            //  label.enter().append("text")
            //    .attr("x", xScale(m))
            //    .attr("y", yScale(y_max)-15)
            //    .attr("text-anchor", "middle")
            //    .attr("class","dist-label "+type)
            //    .append("tspan")
            //    .text(type)
            //    .append("tspan")
            //    .attr("class","legend")
            //    .text(" •");

            //  label.transition().duration(duration)
            //   .attr("x", xScale(m));

            //  if(type != "likelihood") {
            //   var lik = jStat.normal.pdf(0, m, s);     
            //   var likdot = svg.select(".dist-group.circle").selectAll(".lik."+type).data([lik]);

            //   likdot.enter().append("circle")
            //     .attr("cx", xScale(0))
            //     .attr("cy", yScale)
            //     .attr("r", 5)
            //     .attr("class", "lik "+type);

            //   likdot.transition().duration(duration)
            //     .attr("cy", yScale)
            //     .attr("cx",  xScale(0));

            // }


        }

        return that;
    };




    function exports(_selection) {
        _selection.each(function() {


            w = width - margin.left - margin.right,
                h = height - margin.top - margin.bottom;
            // Axes min and max
            x_max = 1.5,
                x_min = -1.5



            // Create scales
            xScale = d3.scale.linear().domain([x_min, x_max]).range([0, w]);
            yScale = d3.scale.linear().domain([0, y_max]).range([h, 0]);

            svg = d3.select(this)
                .selectAll("svg")
                .data([_data]);

            container = svg.enter().append("svg")
                .append("g").classed("container-group", true);
            container.append("g").classed("dist-group prior", true);
            container.append("g").classed("dist-group margin ni", true);
            container.append("g").classed("dist-group margin su", true);
            container.append("g").classed("dist-group margin inf", true);
            container.append("g").classed("dist-group margin eq", true);
            container.append("g").classed("dist-group margin line", true);

            container.append("g").classed("dist-group likelihood", true);
            container.append("g").classed("dist-group circle", true);
            container.append("g").classed("dist-group margin delta_lab", true);

            container.append("g").classed("x-axis-group axis", true);
            container.append("g").classed("y-axis-group axis", true);
            container.append("g").classed("top_favors", true);
            container.append("g").classed("CI-group", true);
            container.append("g").classed("dist-group margin su labs", true);
            container.append("g").classed("dist-group margin eq labs", true);
            container.append("g").classed("dist-group margin ni labs", true);
            container.append("g").classed("dist-group margin inf labs", true);

            container.append("text").classed("xlab", true);



            svg.transition()
                .duration(duration)
                .attr({
                    width: width,
                    height: height
                });

            svg.select(".container-group")
                .attr({
                    transform: "translate(" + margin.left + "," + margin.top + ")"
                });

            //Define X axis
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .tickValues([-1.5, -1, -0.5, 0.5, 1, 1.5])
                .tickSize(-h);

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .ticks(5)
                .tickSize(w)
                .orient("right");

            svg.select(".x-axis-group.axis")
                .attr({
                    transform: "translate(0," + (h) + ")"
                })
                .transition()
                .duration(duration)

            .call(xAxis)


            function customAxis() {
                svg.select(".y-axis-group.axis").selectAll("text")
                    .attr("x", 4)
                    .attr("dy", -4);
            }

            // svg.select(".y-axis-group.axis")
            // .transition()
            // .duration(duration)
            // //.attr({transform: "translate(0," + 0 + ")"})
            // .call(yAxis)
            // .selectAll("text") // cancel transition on customized attributes
            // .tween("attr.x", null)
            // .tween("attr.dy", null)
            // .call(customAxis)

            svg.select(".xlab")
                .attr("x", xScale(0))
                .attr("y", h + 25)
                .attr("class", "xlab")
                .attr("text-anchor", "middle")
                .text("Effect (d)")







            exports.dist2.CI95();
            //exports.dist2.CI90()

            exports.dist2.margin(0.2);

            var drag = d3.behavior.drag()
                .origin(function(d) {
                    return d;
                })
                .on("dragstart", draging)
                .on("drag", draging)
                //.on("dragend", dragended);

            svg.call(drag);
            exports.dist2.render();

        });


    }

    exports.width = function(_x) {
        if (!arguments.length) return width;
        width = parseInt(_x);

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


    var draging = function() {

        var x = xScale.invert(d3.mouse(this)[0]);
        exports.dist2.mean(x)
        exports.dist2.CI95();
        lineChart_eq.render();
        lineChart_su.render();
        lineChart_ni.render();
        sliders.m.slider("setValue", x);
        var tmp = d3.format(".2f")(x);
        d3.select("#span_d").html(tmp);

    }


    exports.dist2 = Dist("dist2", "likelihood", 0.5, Math.sqrt(1 / n + 1 / n))
    exports.dist2.CI90 = exports.dist2.CI(0.9);
    exports.dist2.CI95 = exports.dist2.CI(0.95);

    return exports;
}









// Line plots

// non-inferiority & superiority power

function ni_power(n) {

    var alpha = 0.025,
        n;
    var power = jStat.normal.cdf((m + delta) / Math.sqrt(2 / n) - jStat.normal.inv(1 - alpha, 0, 1), 0, 1);

    return power * 100;
}

function su_power(n) {

    var alpha = 0.025,
        n;
    var power = jStat.normal.cdf((m) / Math.sqrt(2 / n) - jStat.normal.inv(1 - alpha, 0, 1), 0, 1);

    return power * 100;
}

function eq_power(n) {
    var alpha = 0.025,
        n, power;
    power = jStat.normal.cdf(Math.sqrt(Math.pow(m - delta, 2) / (2 / n)) - jStat.normal.inv(1 - alpha, 0, 1), 0, 1) + jStat.normal.cdf(Math.sqrt(Math.pow(m + delta, 2) / (2 / n)) - jStat.normal.inv(1 - alpha, 0, 1), 0, 1) - 1

    power = Math.abs(m) > delta ? 0 : power;
    power = power < 0 ? 0 : power;
    return power * 100;
}




function MakeLineChart() {
    // plot dimensions
    var margin = {
            top: 15,
            right: 30,
            bottom: 30,
            left: 20
        },
        width,
        aspect,
        height,
        m1 = 0,
        s1 = 1,
        m2 = 0.5,
        s2 = 1,
        duration = 600;


    if ($(window).width() < 450) {
        margin.right = 10;
        margin.left = 15;
    }


    // private
    var svg, xScale, yScale, w, h, container, dist1, dist2, y_max, x_max,
        x, gen_data;

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

    function exports(_selection) {
        _selection.each(function() {

            width = parseInt(d3.select(this).style('width'), 10) - parseInt(d3.select(this).style("padding-right"), 10) * 2,
                height = $(window).width() > 450 ? width * 0.6 : width * 0.8;
                console.log("h" + height + "w" + width)

            var w = width - margin.left - margin.right,
                h = height - margin.top - margin.bottom;
            // Axes min and max


            // Create scales
            xScale = d3.scale.linear().domain([0, 1000]).range([0, w]);
            yScale = d3.scale.linear().domain([0, 100]).range([h, 0]);

            svg = d3.select(this)
                .selectAll("svg")
                .data([_data]);

            container = svg.enter().append("svg")
                .append("g").classed("container-group", true);
            // container.append("g").classed("dist-group prior", true);
            // container.append("g").classed("dist-group margin ni", true);
            // container.append("g").classed("dist-group margin su", true);
            // container.append("g").classed("dist-group margin inf", true);
            // container.append("g").classed("dist-group margin eq", true);
            // container.append("g").classed("dist-group margin line", true);
            // container.append("g").classed("dist-group likelihood", true);
            // container.append("g").classed("dist-group circle", true);

            container.append("g").classed("x-axis-group axis", true);
            container.append("g").classed("y-axis-group axis", true);
            // container.append("g").classed("top_favors", true);
            // container.append("g").classed("CI-group", true);
            container.append("text").classed("xlab", true);



            svg.transition()
                .duration(duration)
                .attr({
                    width: width,
                    height: height
                });

            svg.select(".container-group")
                .attr({
                    transform: "translate(" + margin.left + "," + margin.top + ")"
                });

            //Define X axis
            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(5)
                .tickSize(-h);

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .ticks(5)
                .tickSize(-w)
                .orient("left");

            svg.select(".x-axis-group.axis")
                .attr({
                    transform: "translate(0," + (h) + ")"
                })
                .transition()
                .duration(30)
                .call(xAxis)


            function customAxis() {
                svg.select(".y-axis-group.axis").selectAll("text")
                    .attr("x", -5)
                    .attr("dy", 0);
            }

            svg.select(".y-axis-group.axis")
                .transition()
                .duration(duration)
                .call(yAxis)
                .selectAll("text") // cancel transition on customized attributes
                .tween("attr.x", null)
                .tween("attr.dy", null)
                .call(customAxis)
                //


            // svg.select(".container-group")
            //  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");   








            // line = d3.svg.line()
            //       .x(function(d) { 
            //        return xScale(d[0])

            //       })
            //       .y(function(d) { 
            //         return yScale(d[1]);
            //       })

            _data = gen_data();




            container.append("svg:line")
                .attr("id", "qq-lineZ")



            svg.select("#qq-lineZ").transition()
                .attr("x1", xScale(0))
                .attr("y1", yScale(80))
                .attr("x2", xScale(1000))
                .attr("y2", yScale(80));






            container.append("svg:path")
                .attr("id", "qq-line");

            svg.select("#qq-line").transition()
                .attr("d", line(_data))

            container.append("svg:line")
                .attr("id", "qq-line_n")
                .attr("y", 5);

            container.append("svg:line")
                .attr("id", "qq-power-tool")
                .attr("y1", yScale(0))
                .attr("y2", yScale(100))
                .attr("x1", xScale(600))
                .attr("x2", xScale(600));

            svg.select("#qq-line_n").transition()
                .attr("cx", xScale(n))
                .attr("cy", yScale(power(n)));


            svg.select("#qq-power-tool").transition()
            	.attr("opacity", 0)
                .attr("y1", yScale(0))
                .attr("y2", yScale(100))
                .attr("x1", xScale(600))
                .attr("x2", xScale(600));


            svg.select(".xlab")
                .attr("x", w / 2)
                .attr("y", h + 25)
                .attr("class", "xlab")
                .attr("text-anchor", "middle")
                .text("n per group")


            var div = d3.select("body").selectAll(".power-tooltip").data([m]);

            div.enter().append("div")
                .attr("class", "power-tooltip")
                .style("opacity", 0)
                .style("top",0);




            container.append("svg:rect")
                .attr("id", "power-rect-tp")
                .attr("x", 0)
                .attr("y", 0)
                
               console.log(w)
            svg.select("#power-rect-tp")
            	.attr("height", h)
                .attr("width", w);

                  container.select("#power-rect-tp").on("touchstart", function() {
              //d3.event.preventDefault()
              container.select("#power-rect-tp").on("mousemove", null).on("mouseover", null);;
            });
            container.select("#power-rect-tp").on("mouseover", function() {
            	 

                div.transition()
                    .duration(200)
                    .style("opacity", .9)

                div
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");

                svg.select("#qq-power-tool").transition()
                    .style("opacity", 1)
            })
            container.select("#power-rect-tp").on("mousemove", function() {
                var x = d3.mouse(this)[0],
                    text_x;

                // if(x < w/2) {
                //        	 		  				 text_x = x + 10; 
                //        	 		  			} else {
                //        	 		  				 text_x = x - 60;
                //        	 		  			}
                svg.select("#qq-power-tool")
                    .attr("x1", x)
                    .attr("x2", x);
                var pow = d3.round(power(xScale.invert(x)), 1);

                div.html("Power = " + pow + "%<br>" + "n = " + d3.round(xScale.invert(x), 0) +
                        "<br> α = 0.025" + "<br> d = " + d3.round(m, 2) + "<br>Δ = " + delta)
                    .style("left", (d3.event.pageX) + 10 + "px")
                    .style("top", (d3.event.pageY - 70) + "px");

            })

            container.select("#power-rect-tp").on("mouseout", function() {
                svg.select("#qq-power-tool").transition()
                    .style("opacity", 0);
                div.transition()
                    .style("opacity", 0);
            })
          
              
        });


    }
    exports.render = function(df) {
        _data = gen_data();

        svg.select("#qq-line").transition().duration(0)
            .attr("d", line(_data));

        svg.select("#qq-line_n").transition().duration(0)
            .attr("cx", xScale(n))
            .attr("cy", yScale(power(n)));
    }

    exports.width = function(_x) {
        if (!arguments.length) return width;
        width = parseInt(_x);

        // x-values = data resolution
        var incr = 1000 / width;
        x = [];
        for (var i = 0; i <= 1000; i += incr) {
            x.push(i);
        }

        return this;
    };
    exports.height = function(_x) {
        if (!arguments.length) return height;
        height = parseInt(_x);
        return this;
    };
    var power;
    exports.data_generator = function(_power) {
        if (!arguments.length) return gen_data;
        power = _power;
        gen_data = function() {
            var d = [];
            var incr = 1000 / width;
            for (var i = 0; i < 1000; i += incr) {

                var tmp = [i, _power(i)];

                d.push(tmp);
            }
            return d;
        };
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


    return exports;
}





// ********************
// * Append charts
//  ******************

// Main
var donut = {};

function setsize() {
    rpsy.w = parseInt(d3.select('#viz').style('width'), 10);
    if (rpsy.w < 400) {
        // small screens
        rpsy.aspect = 0.85;

    } else {
        rpsy.aspect = 0.3;

    }
}
setsize();
chart = MakeChart().aspect(rpsy.aspect).width(rpsy.w);
container = d3.select('#viz')
    .call(chart);

lineChart_su = MakeLineChart().width(rpsy.w).data_generator(su_power);
container2 = d3.select('#linePlot_su')
    .call(lineChart_su);



lineChart_ni = MakeLineChart().width(rpsy.w).data_generator(ni_power);
container3 = d3.select('#linePlot_ni')
    .call(lineChart_ni);


lineChart_eq = MakeLineChart().width(rpsy.w).data_generator(eq_power);
container4 = d3.select('#linePlot_eq')
    .call(lineChart_eq);


// **********
// * RESIZE *
// **********
function resize() {
    setsize();

    // var h =parseInt(d3.select('#viz').style('height'), 10);
    chart.width(rpsy.w).duration(200);



    container.call(chart);
    container2.call(lineChart_su);
    container3.call(lineChart_ni);
    container4.call(lineChart_eq);
    chart.dist2.render();
    chart.duration(100);
}

// resize  after resize-events event complete
function debounce(fn, wait) {
    var timeout;

    return function() {
        var context = this, // preserve context
            args = arguments, // preserve arguments
            later = function() { // define a function that:
                timeout = null; // * nulls the timeout (GC)
                fn.apply(context, args); // * calls the original fn
            };

        // (re)set the timer which delays the function call
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

$(window).resize(debounce(resize, 500));


// ************
// * Sliders **
// ************

var sliders = {};

sliders.m = $("#slider-m").slider({
        min: -1.5,
        max: 1.5,
        value: chart.dist2.mean(),
        step: 0.01,
        ticks: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5],
        ticks_labels: ['-1.5', '-1', '0.5', '0', '0.5', "1", "1.5"],
        tooltip: "hide"
    }) // mean prior
    .on("change", function() {
        chart.dist2.slide("m");

        lineChart_su.render();
        lineChart_ni.render();
        lineChart_eq.render();
        chart.dist2.CI95();

    })
    .on("slideStop", function() {
        setTimeout(function() {
            container.call(chart)
        }, 1000)
    });
sliders.margin = $("#slider-margin").slider({
        min: 0.05,
        max: 1,
        value: 0.3,
        step: 0.01,
        ticks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
        ticks_positions: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
        ticks_labels: ["0", "0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7", "0.8", "0.9", "1"],
        ticks_snap_bounds: 0,
        tooltip: "hide"
    }) // sd prior
    .on("change", function(x) {
        chart.dist2.slide("delta");
        lineChart_ni.render();
        lineChart_eq.render();
        chart.dist2.CI95();
        chart.dist2.margin();
        //chart.dist2.CI90();


    })
    .on("slideStop", function() {
        setTimeout(function() {
            container.call(chart)
        }, 1000)
    });
sliders.n = $("#slider-n").slider({
        min: 1,
        max: 101,
        value: 10,
        step: 1,
        ticks: [1, 10, 20, 30, 40, 50, 75, 100, 101],
        ticks_positions: [1, 10, 20, 30, 40, 50, 75, 96, 100],
        ticks_labels: ["1", "10", "20", "30", "40", "50", "75", "100", "1k"],
        ticks_snap_bounds: 0,
        tooltip: "hide"
    }) // sample n
    .on("change", function() {
        chart.dist2.slide("n");
        chart.dist2.CI95();
        chart.dist2.margin();
        lineChart_eq.render();
        lineChart_su.render();
        lineChart_ni.render();
        //chart.dist2.CI90();

    })
    .on("slideStop", function() {
        setTimeout(function() {
            container.call(chart)
        }, 1000)
    });



    // // hack
    // d3.selectAll(".slider-tick-label:last-of-type").style("width","70px")
    //   .style("text-align", "right")