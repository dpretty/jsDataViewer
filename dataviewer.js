// TODO: check licenses of d3, d3.chart to see what needs to be included here.

// Note: follow conventions for margins: http://bl.ocks.org/mbostock/3019563
d3.chart("dvBaseChart", {
    initialize: function() {
	
	var chart = this;
	var background = this.base.append("g")
	    .classed("graph-background", true);
	
	chart.main = chart.base.append("g")
	    .attr("class", "chart-main");
	
	chart.brush = d3.svg.brush();
	
	// default
	chart.margin = {top: 10, right: 10, bottom: 10, left: 10};
	
	// set defaults 
	chart._width = 100;
	chart._height = 100;

	// recursive min, max for n dimensional arrays
	chart.rmin = function(d) {
	    if (!d.hasOwnProperty("length")) {
		return d;
	    } else {
		var tmp = [];
		for (var i=0; i<d.length; i++) {
		    tmp.push(chart.rmin(d[i]))
		}
		return d3.min(tmp);
	    }
	};

	chart.rmax = function(d) {
	    if (!d.hasOwnProperty("length")) {
		return d;
	    } else {
		var tmp = [];
		for (var i=0; i<d.length; i++) {
		    tmp.push(chart.rmax(d[i]))
		}
		return d3.max(tmp);
	    }
	};
	
	this.source = function(source_data) {
	    if (!arguments.length) {
		this.source_data;
	    }
	    this.source_data = source_data;
	};

	this.load_data = function() {
	    chart.data = [];
	    for (var i=0; i < chart.source_data.length; i++) {
		chart.data.push(chart.source_data[i].url_parser(
		    chart.source_data[i].url, chart.source_data[i].modifiers));
	    }
	};

	this.render = function() {
	    chart.draw(chart.data);
	};
	
	this.set_margin =  function(newMargin) {
	    var full_width = chart._width + chart.margin.left + chart.margin.right;
	    var full_height = chart._height + chart.margin.bottom + chart.margin.top;
	    
	    chart.margin = newMargin;
	    chart.base.select("g.chart-main")
		.attr("transform", "translate(" + chart.margin.left + "," + chart.margin.top + ")");
	    
	    chart._width = full_width - chart.margin.left - chart.margin.right;
	    chart._height = full_height - chart.margin.top - chart.margin.bottom;
	};
	
	this.set_margin({top: 10, right: 10, bottom: 10, left: 10});
	
	this.layer("background", background, {
	    dataBind: function(data) {
		return this.selectAll("rect.background").data([data]);
	    },
	    insert: function() {
		return this.insert("rect")
		    .attr("class", "background")
		    .attr("x", 0)
		    .attr("y", 0)
		    .attr("width", chart._width+chart.margin.left+chart.margin.right)
		    .attr("height", chart._height+chart.margin.top+chart.margin.bottom)
	    }
	    
	});
    },
	
    width: function(newWidth) {
	// for external calls, we care about the total width (incl margins)
	// internally we use the margin convention http://bl.ocks.org/mbostock/3019563
	// to avoid too much confusion, we use _width internally rather than have 
	// different values from width and width()
	if (!arguments.length) {
		return this._width + this.margin.left + this.margin.right; 
	}
	
	    this._width = newWidth - this.margin.left - this.margin.right;
	
	// the background uses the full width (including margins).
	this.base.select("g rect.background")
	    .attr("width", newWidth);
	
	return this;	
    },
    height: function(newHeight) {
	// see notes for width method
	if (!arguments.length) {
	    return this._height + this.margin.top + this.margin.bottom;
	}
	
	this._height = newHeight - this.margin.top - this.margin.bottom;
	
	// the background uses the full width (including margins).
	this.base.select("g rect.background")
	    .attr("y", newHeight)
	    .attr("height", newHeight);
	
	return this;	
	}
    
});
    
d3.chart("dvBaseChart").extend("dvTimeSeriesChart", {
    initialize: function () {
	var chart = this;
	
	this.set_margin({top: 50, right: 50, bottom: 50, left: 50});
	
	this.xScale = d3.scale.linear()
	    .range([0, chart._width]);
	
	this.yScale = d3.scale.linear()
	    .range([chart._height, 0]);
	
	this.xAxis = d3.svg.axis()
	    .scale(this.xScale)
	    .orient("bottom");
	
	this.yAxis = d3.svg.axis()
	    .scale(this.yScale)
	    .orient("left");
	
	
	// this limits us to 10 signals. it gives us 2 colours per signal, one for outline, one for the fill (if required).
	this.colors = d3.scale.category20().range();
	
	this.layer("xAxis", chart.main.append("g"), {
	    dataBind: function(data) {
		// TODO: chart.data should be [data1, data2, etc...] so we can overplot
		chart.data = data;
		return this.selectAll("g.x.axis").data([data]);
	    },
	    insert: function() {
		return this.insert("g")
		    .attr("class", "x axis")
	    	    .attr("transform", function (d) {return "translate(" + 0 + "," + chart._height + ")";});
		
	    },
	    events: {
		"merge": function() {
		    chart.xScale
			.range([0, chart._width])
			.domain([d3.min(chart.data, function(v) {return chart.rmin(v.dimension); }),
				 d3.max(chart.data, function(v) {return chart.rmax(v.dimension); })]);
		    return this.call(chart.xAxis);
		},
		"enter": function() {
		    chart.xScale
			.range([0, chart._width])
			.domain([d3.min(chart.data, function(v) {return chart.rmin(v.dimension); }),
				 d3.max(chart.data, function(v) {return chart.rmax(v.dimension); })]);
		    return this.call(chart.xAxis);		
		},
		"exit": function() {return this.remove()}
	    }
	});
	
	this.layer("yAxis", chart.main.append("g"), {
	    dataBind: function(data) {
		// TODO: shouldn't need to attach data for each layer?
		chart.data = data;
		
		return this.selectAll("g.y.axis").data([data]);
	    },
	    insert: function() {
		return this.append("g")
		    .attr("class", "y axis")
	    	    .attr("transform", function (d) {return "translate(" + 0 + "," + 0 + ")";});
		},
	    events: {
		"merge": function() {
		    // we find min and max and add 5% to above and below.
		    var minval = d3.min(chart.data, function(v) {return chart.rmin(v.value); });
		    var maxval = d3.max(chart.data, function(v) {return chart.rmax(v.value); });
		    var delta = 0.05*(maxval - minval);
		    chart.yScale
			.range([chart._height, 0])
			.domain([minval-delta, maxval+delta]);
		    
		    return this.call(chart.yAxis);
		},
		"enter": function() {
		    // we find min and max and add 5% to above and below.
		    var minval = d3.min(chart.data, function(v) {return chart.rmin(v.value); });
		    var maxval = d3.max(chart.data, function(v) {return chart.rmax(v.value); });
		    var delta = 0.05*(maxval - minval);
		    chart.yScale
			.range([chart._height, 0])
			.domain([minval-delta, maxval+delta]);
		    return this.call(chart.yAxis);
		},
		"exit": function() {return this.remove()}
	    }
	});
	
	var line = d3.svg.line()
	    .x(function(d) { return chart.xScale(d[0]); })
	    .y(function(d) { return chart.yScale(d[1]); });
	
	
	var format_data = function(data) {
	    // have a 1d array of data objects for channels from all signals...
	    var output_data = [];
	    var color_index = 0;
	    for (var i=0; i<data.length;i++) {
		// format_datum returns list for separate channels of a signal
		var signal_data = format_datum(data[i]);
		for (var j=0; j<signal_data.length; j++){
		    var channel_data = signal_data[j];
		    channel_data.color_index = color_index;
		    output_data.push(channel_data);
		    ++color_index;
		}
	    }
	    return output_data;
	};

	// read in the data values provided and give back list of [x,y] for each data series
	// the lists have a boolean property 'closeLine', if true, the line will be closed
	// the lists have a boolean property 'fillLine', if true, the line will be filled..
	var format_datum = function(data) {
	    var output_data = [];
	    // minmax pairs use up 2 channels but are combined here as a single line
	    var n_minmax_pairs = 0;
	    if (typeof data.metadata.minmax_pairs !== 'undefined') {
		n_minmax_pairs = data.metadata.minmax_pairs.length;
	    }
	    var non_minmax_indices = d3.range(data.value.length);
	    // first, get the minmax pairs
	    if (n_minmax_pairs > 0) {
		for (var i=0; i<n_minmax_pairs; i++) {
		    non_minmax_indices.splice(non_minmax_indices.indexOf(data.metadata.minmax_pairs[i][0]), 1);
		    non_minmax_indices.splice(non_minmax_indices.indexOf(data.metadata.minmax_pairs[i][1]), 1);
		    
		    var tmp_output_data = [];
		    for (var j=0; j<data.value[data.metadata.minmax_pairs[i][0]].length; j++) {
			tmp_output_data.push([data.dimension[0][j], data.value[data.metadata.minmax_pairs[i][0]][j]]);
		    }
		    
		    for (var j=data.value[data.metadata.minmax_pairs[i][1]].length-1; j>=0; j--) {
			tmp_output_data.push([data.dimension[0][j], data.value[data.metadata.minmax_pairs[i][1]][j]]);
		    }
		    tmp_output_data['closeLine'] = true;
		    tmp_output_data['fillLine'] = true;
		    output_data.push(tmp_output_data);
		    
		}
	    }
	    
	    for (var i=0; i<non_minmax_indices.length; i++) {
		var ch_i = non_minmax_indices[i];
		var tmp_output_data = [];
		for (var j=0; j<data.value[ch_i].length; j++) {
		    tmp_output_data.push([data.dimension[0][j], data.value[ch_i][j]]);
		}
		tmp_output_data['closeLine'] = false;
		tmp_output_data['fillLine'] = false;
		output_data.push(tmp_output_data);
	    }
	    
	    return output_data;
	    
	};
	
	this.layer("data", chart.main.append("g"), {
	    dataBind: function(data) {
		chart.data = data;
		return this.selectAll("path.signal").data(format_data(chart.data));
	    },
	    insert: function() {
		return this.append("path");
	    },
	    events: {
		"merge": function() {
		    return this
			.attr("class", "signal")
			.style("stroke", function(d, i) { return chart.colors[2*d.color_index]; })
			.style("fill", function(d, i) {return (d.fillLine ? chart.colors[2*d.color_index+1] : "none"); })
			.style("fill-opacity", 0.5)
			.attr("d", function(d,i) {return line(d) + (d.closeLine ? "Z" : "");});
		},
		
		"enter": function() {
		    return this
			.attr("class", "signal")
			.style("stroke", function(d, i) { return chart.colors[2*d.color_index]; })
			.style("fill", function(d, i) {return (d.fillLine ? chart.colors[2*d.color_index+1] : "none"); })
			.style("fill-opacity", 0.5)
			.attr("d", function(d,i) {return line(d) + (d.closeLine ? "Z" : "");});
		},
		"exit": function() {return this.remove()}
	    }
	});
	
	var load_selection = function() {
	    for (var i=0; i<chart.source_data.length; i++) {
		chart.source_data[i].modifiers["min"] = chart.brush.extent()[0];
		chart.source_data[i].modifiers["max"] = chart.brush.extent()[1];
	    }

	    chart.load_data();
	    chart.render();
	};
	
	this.layer("interactive", chart.main, {
	    dataBind: function(data) {
		chart.data = data;
		return this.selectAll("g.brush").data([chart.data]);
	    },
	    insert: function() {
		chart.brush.clear();
		return this.append("g")
		    .attr("class", "brush");
	    },
	    events: {
		"merge": function() {
		    chart.brush = d3.svg.brush().x(chart.xScale).on("brushend", load_selection);
		    return this
			.call(chart.brush)
			.selectAll("rect")
			.attr("y", 0)
			.attr("height", chart._height);
		}
	    }
	    
	});
    }
});


////////////////////////////////////////////////////////////////////////
// Dataviewer
////////////////////////////////////////////////////////////////////////

dataviewer = function() {
    var golden_ratio = 1.61803398875;
    var dv = {
	margin: {top: 10, right: 10, bottom: 10, left: 10},
	_width: 100,
	_height: 100,
	n_columns: 10,
	n_rows: 10,
    };


    
    
    dv.create = function(node) {
	dv.basenode = d3.select(node);
	dv.width(parseInt(dv.basenode.style("width")));
	dv.height(parseInt(d3.min([dv.width()/golden_ratio, dv.basenode.style("height")])));
	dv.base = dv.basenode
	    .append("svg")
	    .attr("width", function(d) {return dv.width(); })
	    .attr("height", function(d) {return dv.height(); })
	    .append("g")
	    .attr("transform", function(d) {return "translate(" + dv.margin.left + "," + dv.margin.top + ")"});

	// generate scales to map background grid to pixels.
	dv.xScale = d3.scale.linear()
	    .domain([0, dv.n_columns])
	    .range([0, dv._width]);
	dv.yScale = d3.scale.linear()
	    .domain([0, dv.n_rows])
	    .range([dv._height, 0]);

	dv.column_width = dv._width/dv.n_columns;
	dv.row_height = dv._height/dv.n_rows;
	
	dv.background_grid = dv.base.append("g").attr("class", "pagelet-grid");
	for (var j=0; j <= dv.n_columns; j++) {
	    dv.background_grid
		.append("line")
		.attr("x1", function() {return Math.round(j*dv.column_width)})
		.attr("x2", function() {return Math.round(j*dv.column_width)})
		.attr("y1", 0)
		.attr("y2", dv._height);
	}
	for (var j=0; j <= dv.n_rows; j++) {
	    dv.background_grid
		.append("line")
		.attr("x1", 0)
		.attr("x2", dv._width)
		.attr("y1", function() {return Math.round(j*dv.row_height)})
		.attr("y2", function() {return Math.round(j*dv.row_height)});
	}
	return dv;
    };

    dv.data = function(data) {
	// data = [plot_1, plot_2, plot_3, ..., plot_n]
	// plot_n = {plot_coords:[x0, y0, x1, y1],
	//           data = [series_1,series_2,..., series_n],
        //            }
	// series_n = {url: source_url,
	//             modifiers: {dim_limits=[[dim0_min, dim0_max], [dim1_min, dim1_max],...], (other modifiers)},
	//             url_parser: function which returns object defined below}
	// url_parser: function(url, modifiers)
	//             
	//             returns {
	//	        dimension: [dim1, dim2, ...],
	//	        dimension_dtype: str,
	//	        dimension_units: str,
	//	        metadata: {key1:val1, key2:val2, ...},
	//	        name: str,
	//	        value: [ch1, ch2, ...],
	//	        value_dype: str,
	//	        value_units: str,
	//	       }
	
	// url_parser: dim_limits, plot_width
	dv.data = dv.updateCoords(data);
    };

    dv.draw = function() {
	for (var i=0; i < dv.data.length; i++) {
	    var chart = dv.base.append("g")
		.attr("class", "chart")
		.attr("transform", "translate(" + dv.data[i].px_coords[0] + "," + dv.data[i].px_coords[3] + ")")
		.chart("dvTimeSeriesChart");
	    chart.width(dv.data[i].px_coords[2] - dv.data[i].px_coords[0]);
	    chart.height(dv.data[i].px_coords[1] - dv.data[i].px_coords[3]);
	    
	    chart.source(dv.data[i].data);
	    chart.load_data();
	    chart.render();
	}
	
    };

    dv.updateCoords = function(data) {
	for (var j=0; j < data.length; j++) {
	    data[j].px_coords = [dv.xScale(data[j].plot_coords[0]), 
				 dv.yScale(data[j].plot_coords[1]),
				 dv.xScale(data[j].plot_coords[2]), 
				 dv.yScale(data[j].plot_coords[3])];
	    
	    for (var k=0; k<data[j].data.length; k++) {
		if (!data[j].data[k].hasOwnProperty("modifiers")) {
		    data[j].data[k].modifiers = {};
		}
		data[j].data[k].modifiers["width"] = parseInt(dv.xScale(data[j].plot_coords[2]) - dv.xScale(data[j].plot_coords[0]));
	    }
	}
	return data;
    };

    dv.width = function(newWidth) {	
	if (!arguments.length) {
	    return dv._width + dv.margin.left + dv.margin.right; 
	}

	dv._width = newWidth - dv.margin.left - dv.margin.right;
    };

    dv.height = function(newHeight) {	
	if (!arguments.length) {
	    return dv._height + dv.margin.top + dv.margin.bottom; 
	}

	dv._height = newHeight - dv.margin.top - dv.margin.bottom;
    };


    return dv;
}();

