var width = 500,
      height = 500,
      start = 0,
      end = 2.25,
      numSpirals = 3
      margin = {top:50,bottom:50,left:50,right:50};

    var theta = function(r) {
      return numSpirals * Math.PI * r;
    };

    // used to assign nodes color by group
    //var color = d3.scaleOrdinal(d3.schemeCategory10);
    var color = function(month) {
      // Colores base: invierno, primavera, verano y otoño
      var seasons = [
        "#7BBBE8", // Invierno: azul gélido
        "#65C978", // Primavera: verde fresco
        "#DF5145", // Verano: rojo cálido
        "#E5A13D"  // Otoño: naranja de hojas
      ];

      var season = Math.floor(((month + 1) % 12) / 3);

      // Diferencia sutil de luminosidad entre meses
      var c = d3.hsl(seasons[season]);
      c.l += month % 2 === 0 ? 0.060 : -0.060;

      return c.toString();
    };

    var r = d3.min([width, height]) / 2 - 40;

    var radius = d3.scaleLinear()
      .domain([start, end])
      .range([40, r]);

    var svg = d3.select("#chart").append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.left + margin.right)
      .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    var points = d3.range(start, end + 0.001, (end - start) / 1000);

    var spiral = d3.radialLine()
      .curve(d3.curveCardinal)
      .angle(theta)
      .radius(radius);

    var path = svg.append("path")
      .datum(points)
      .attr("id", "spiral")
      .attr("d", spiral)
      .style("fill", "none")
      .style("stroke", "steelblue");

    var spiralLength = path.node().getTotalLength(),
        N = 365,
        barWidth = (spiralLength / N) - 1;
    
    // cargamos datos
    d3.csv("data/tasf-thgu.csv", function(error, rows) {
      if (error) throw error;
      // parseamos
      var parseDate = d3.timeParse("%Y-%m-%d");
      // recorremos en bucle
      var someData = rows.map(function(d) {
        // calculamos dato
        var values = d3.range(1, 25)
          .map(function(h) { return d["h" + ("0" + h).slice(-2)]; })
          .filter(function(v) { return v !== "" && v != null && !isNaN(+v); })
          .map(Number);

        var date = parseDate(d.data.slice(0, 10));
        // devolvemos dato
        return {
          date: date,
          value: values.length ? d3.mean(values) : null,
          hours: values.length,
          group: date.getMonth()
        };
      }).sort(function(a, b) { return a.date - b.date; });



    var timeScale = d3.scaleTime()
      .domain(d3.extent(someData, function(d){
        return d.date;
      }))
      .range([0, spiralLength]);
    
    // yScale for the bar height
    var yScale = d3.scaleLinear()
      .domain([0, d3.max(someData, function(d){
        return d.value;
      })])
      .range([0, (r / numSpirals) - 30]);

    svg.selectAll("rect")
      .data(someData)
      .enter()
      .append("rect")
      .attr("x", function(d,i){
        
        var linePer = timeScale(d.date),
            posOnLine = path.node().getPointAtLength(linePer),
            angleOnLine = path.node().getPointAtLength(linePer - barWidth);
      
        d.linePer = linePer; // % distance are on the spiral
        d.x = posOnLine.x; // x postion on the spiral
        d.y = posOnLine.y; // y position on the spiral
        
        d.a = (Math.atan2(angleOnLine.y, angleOnLine.x) * 180 / Math.PI) - 90; //angle at the spiral position

        return d.x;
      })
      .attr("y", function(d){
        return d.y;
      })
      .attr("width", function(d){
        return barWidth;
      })
      .attr("height", function(d){
        return d.value === null ? 2 : yScale(d.value);
      })
      .style("fill", function(d){
        return d.value === null ? "#999999" : color(d.group);
      })
      .style("stroke", "none")
      .attr("transform", function(d){
        return "rotate(" + d.a + "," + d.x  + "," + d.y + ")"; // rotate the bar
      });
    
    // add date labels
    var tF = d3.timeFormat("%b %Y"),
        firstInMonth = {};

    svg.selectAll("text")
      .data(someData)
      .enter()
      .append("text")
      .attr("dy", 10)
      .style("text-anchor", "start")
      .style("font", "10px arial")
      .append("textPath")
      // only add for the first of each month
      .filter(function(d){
        var sd = tF(d.date);
        if (!firstInMonth[sd]){
          firstInMonth[sd] = 1;
          return true;
        }
        return false;
      })
      .text(function(d){
        return tF(d.date);
      })
      // place text along spiral
      .attr("xlink:href", "#spiral")
      .style("fill", "grey")
      .attr("startOffset", function(d){
        return ((d.linePer / spiralLength) * 100) + "%";
      })


    var tooltip = d3.select("#chart")
    .append('div')
    .attr('class', 'tooltip');

    tooltip.append('div')
    .attr('class', 'date');
    tooltip.append('div')
    .attr('class', 'value');

    svg.selectAll("rect")
    .on('mouseover', function(d) {

        tooltip.select('.date').html("Date: <b>" + d.date.toDateString() + "</b>");
        tooltip.select('.value').html(
          d.value === null
            ? "Sin mediciones"
            : "NO₂: <b>" + d.value.toFixed(2) + " µg/m³</b> (" + d.hours + "/24 horas)"
        );

        d3.select(this)
        .style("fill","#FFFFFF")
        .style("stroke","#000000")
        .style("stroke-width","2px");

        tooltip.style('display', 'block');
        tooltip.style('opacity',2);

    })
    .on('mousemove', function(d) {
        tooltip.style('top', (d3.event.layerY + 10) + 'px')
        .style('left', (d3.event.layerX - 25) + 'px');
    })
    .on('mouseout', function(d) {
        d3.selectAll("rect")
        .style("fill", function(d){
          return d.value === null ? "#999999" : color(d.group);
        })
        .style("stroke", "none")

        tooltip.style('display', 'none');
        tooltip.style('opacity',0);
    });
});