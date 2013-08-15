jsDataViewer
============

A worksheet for viewing multiple timeseries signals, based on d3.js and d3.chart.

Example
-------
See live demo at http://bl.ocks.org/dpretty/raw/6231102/

(this is essentially the simple.html example in this repository: https://github.com/dpretty/jsDataViewer/blob/master/examples/simple.html).




Basic usage
-----------

```javascript
var worksheet = dataviewer.create("div#dataviewer");
worksheet.data(data);
worksheet.draw();
```

``data`` is a list of plots: ``[plot_1, plot_2, ..., plot_n]``

``plot_n`` is an object such as 

```javascript
{'plot_coords':[0,5,5,10], // [x0, y0, x1, y1]
'modifiers':{}, // currently: min, max, width
'data':[
       {url: "http://example.com/1" url_parser:url_parser_function},
       {url: "http://example.com/2", url_parser:url_parser_function}
        ]
},
```

The URL parser function takes two arguments: the URL and the modifiers object and returns a data object with the following structure
```javascript
{
    dimension: [dim1, dim2, ...], // e.g. dim1 = [1,2,3,4, ...]
    dimension_dtype: "float", // not used yet by jsdataviewer
    dimension_units: "sec", // not used yet by jsdataviewer
    metadata: {},
    name: "signal_name", 
    value: [channel_1,channel_2], // e.g. channel_1 = [1,2,3,4,...]
    value_dtype: "float", // not used yet by jsdataviewer
    value_units: "volts", // not used yet by jsdataviewer
  };

```


modifiers
---------

Currently available modifiers are

* ``min`` -- the minimum value of dimension (x-axis)
* ``max`` -- the aximum value of dimension (x-axis)
* ``width`` -- the width of the plot window in pixels (i.e. used by h1ds to subsample on the server-side)

metadata
--------

Currently, the only metadata parsed by dataviewer.js is ``minmax_pairs`` which lists the channel indicies which should be interpreted as minimum and maximum values of the same signal (the space between these channels will be filled).
e.g.
``metadata = {minmax_pairs:[[0,1], [2,3]]}``

