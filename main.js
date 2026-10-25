var width = 800,
      height = 800,
      start = 0,
      end = 2,
      numSpirals = 3,
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
      N = 365 * 3,
      barWidth = Math.max(1, (spiralLength / N) * 0.9);
    
    // Tabla que relaciona el ángulo de la espiral con su longitud
    var cumulativeLengths = [0];

    for (var i = 1; i < points.length; i++) {
      var p0 = points[i - 1];
      var p1 = points[i];

      var x0 = radius(p0) * Math.sin(theta(p0));
      var y0 = -radius(p0) * Math.cos(theta(p0));
      var x1 = radius(p1) * Math.sin(theta(p1));
      var y1 = -radius(p1) * Math.cos(theta(p1));

      var distance = Math.hypot(x1 - x0, y1 - y0);

      cumulativeLengths.push(cumulativeLengths[i - 1] + distance);
    }

    function lengthForDay(pos) {
      // 365 días corresponden exactamente a una vuelta
      var sample = (pos / (365 * 3)) * (points.length - 1);
      var i = Math.min(Math.floor(sample), points.length - 2);
      var fraction = sample - i;

      var length = cumulativeLengths[i] * (1 - fraction)
                + cumulativeLengths[i + 1] * fraction;

      return length / cumulativeLengths[cumulativeLengths.length - 1]
          * spiralLength;
    }

    // cargamos datos
    d3.csv("data/tasf-thgu-2023-2025.csv", function(error, rows) {
      if (error) throw error;
      // parseamos
      var parseDate = d3.timeParse("%Y-%m-%d");

      function isLeapDay(date) {
        return date.getMonth() === 1 && date.getDate() === 29;
      }

      function dayOfYearNoLeap(date) {
        var startOfYear = new Date(date.getFullYear(), 0, 1);
        var dayIndex = d3.timeDay.count(startOfYear, date); // 0-based

        // En 2024, restamos 1 a todo lo que venga después del 29 de febrero
        if (date.getFullYear() === 2024 && date > new Date(2024, 1, 29)) {
          dayIndex -= 1;
        }

        return dayIndex;
      }


      // recorremos en bucle
      var someData = rows.map(function(d) {
        var values = d3.range(1, 25)
          .map(function(h) { return d["h" + ("0" + h).slice(-2)]; })
          .filter(function(v) { return v !== "" && v != null && !isNaN(+v); })
          .map(Number);

        var date = parseDate(d.data.slice(0, 10));
        if (!date) return null;

        var year = date.getFullYear();
        if (year < 2023 || year > 2025) return null;

        // Excluimos solo el 29 de febrero de 2024 para mantener la alineación anual
        if (isLeapDay(date)) return null;

        var yearOffset = (year - 2023) * 365;
        var dayIndex = dayOfYearNoLeap(date);

        return {
          date: date,
          year: year,
          value: values.length ? d3.mean(values) : null,
          hours: values.length,
          group: date.getMonth(),
          pos: yearOffset + dayIndex
        };
      }).filter(function(d) {
        return d !== null;
      }).sort(function(a, b) {
        return a.date - b.date;
      });



    var totalDays = 365 * 3;

    // var posScale = d3.scaleLinear()
    //   .domain([0, totalDays - 1])
    //   .range([0, spiralLength]);
    
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
        
        // var linePer = posScale(d.pos),
        var linePer = lengthForDay(d.pos),
          posOnLine = path.node().getPointAtLength(linePer),
          angleOnLine = path.node().getPointAtLength(Math.max(0, linePer - barWidth));
      
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