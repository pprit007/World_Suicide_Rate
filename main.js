var selected_year,
    selected_country,
    format = d3.format(','),
    svg_map,
    sucide_range = [1, 1000, 2000, 3000, 4000, 7000, 10000, 20000, 30000];
var barDataByCountry = {};

// Set tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .offset([-10, -10])
    .html(function (d) {
      console.log(d);
        return `<strong>Country: </strong><span class='details'>${d.properties.name}<br></span>
                <strong>Total: </strong><span class='details'>${format(d.sucide.total)}</span>
                <strong>Female: </strong><span class='details'>${format(d.sucide.female_suicides_no)}</span>
                <strong>Male: </strong><span class='details'>${format(d.sucide.male_suicides_no)}</span>`;
    });

var margin = {top: 0, right: 0, bottom: 0, left: 0},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var color = d3.scaleThreshold()
    .domain(sucide_range)
    .range(colorbrewer.Blues[9]);

var projection = d3.geoMercator()
    .scale(130)
    .translate([width / 2, height / 1.5]);

var path = d3.geoPath().projection(projection);


function ready(error, data, sucides) {
    //console.log(sucides);
    var sucideByCountry = {};
    barDataByCountry = {};
    /*
    barDataByCountry = {
        'india': [
            {
                'age_range':'1-45',
                'male':19,
                'female':83
            },
            {
                'age_range':'46-90',
                'male':67,
                'female':93
            }
        ]
    };
    */

    sucides.forEach(function (sucide) {
        if (!sucideByCountry.hasOwnProperty(sucide.country)) {
            sucideByCountry[sucide.country] = {
                'male_suicides_no': 0,
                'female_suicides_no': 0,
                'total': 0
            }
        }

        if (!barDataByCountry.hasOwnProperty(sucide.country)) {
            barDataByCountry[sucide.country] = [];
        }


        if (sucide.year + '' === selected_year + '') {
            if (sucide.sex.toUpperCase() === 'MALE') {
                sucideByCountry[sucide.country]['male_suicides_no'] += Number(sucide.suicides_no);
            }
            if (sucide.sex.toUpperCase() === 'FEMALE') {
                sucideByCountry[sucide.country]['female_suicides_no'] += Number(sucide.suicides_no);
            }
            sucideByCountry[sucide.country]['total'] = sucideByCountry[sucide.country]['male_suicides_no'] + sucideByCountry[sucide.country]['female_suicides_no'];


            // bar data
            isThere = false;

            //console.log(sucide);
            barDataByCountry[sucide.country].forEach(function(node, i) {
                if (node.age_range === sucide.age) {
                    isThere = true;


                    if (sucide.sex.toUpperCase() === 'FEMALE') {
                        barDataByCountry[sucide.country][i].female = sucide.suicides_no;
                    }

                    if (sucide.sex.toUpperCase() === 'MALE') {
                        barDataByCountry[sucide.country][i].male = sucide.suicides_no
                    }
                }
            });

            if (!isThere) {
                let temp = {};

                temp.age_range = sucide.age;

                if (sucide.sex.toUpperCase() === 'FEMALE') {
                    temp.female = sucide.suicides_no
                }

                if (sucide.sex.toUpperCase() === 'MALE') {
                    temp.male = sucide.suicides_no
                }

                barDataByCountry[sucide.country].push(temp);
            } else {

            }
        }
    });
    //console.log(sucideByCountry);
    console.log(barDataByCountry);

    data.features.forEach(function (d) {
        if (sucideByCountry[d.properties.name] !== undefined)
            d.sucide = sucideByCountry[d.properties.name];
        else
            d.sucide = {male_suicides_no: 0, female_suicides_no: 0, total: 0}
    });
    //console.log(data.features);

    svg_map.append('g')
        .attr('class', 'countries')
        .selectAll('path')
        .data(data.features)
        .enter().append('path')
        .attr('d', path)
        .style('fill', function (d) {
            return color(d.sucide.total);
        })
        .style('stroke', 'black')
        .style('stroke-width', 3)
        .style('opacity', 1)
        // tooltips
        .style('stroke', 'black')
        .style('stroke-width', 0.3)
        .on('mouseover', function (d) {
            selected_country = d.properties.name;
            tip.show(d);
            draw_bar();
            d3.select(this)
                .style('opacity', 1)
                .style('stroke', 'black')
                .style('stroke-width', 3);
        })
        .on('mouseout', function (d) {
            tip.hide(d);
            remove_bar();
            d3.select(this)
                .style('opacity', 1)
                .style('stroke', 'black')
                .style('stroke-width', 0.3);
        });

    svg_map.append('path')
        .datum(topojson.mesh(data.features, function (a, b) {
            return a.id !== b.id;
        }))
        .attr('class', 'names')
        .attr('d', path);
}

function draw_map() {
    selected_year = $('#slider').val();
    $('#slider_value').html(selected_year);

    if (svg_map !== undefined) {
        $('#map > svg').remove()
    }

    svg_map = d3.select('#map')
        .append('svg')
            .attr('width', width)
            .attr('height', height)
        .append('g')
        .   attr('class', 'map');
    svg_map.call(tip);
    queue()
        .defer(d3.json, "https://raw.githubusercontent.com/pprit007/pprit007.github.io/master/world_countries.json")
        .defer(d3.csv, "https://raw.githubusercontent.com/pprit007/pprit007.github.io/master/master.csv")
        .await(ready);
}



$(document).ready(draw_map);
$(document).on('input', '#slider', draw_map);


//legend starts here
var svg_legend = d3.select('#legend');

// Color legend.
var colorScale = d3.scaleThreshold()
    .domain(sucide_range)
    .range(colorbrewer.Blues[9]);

var colorLegend = d3.legendColor()
    .labelFormat(d3.format('.0f'))
    .scale(colorScale)
    .shapePadding(5)
    .shapeWidth(50)
    .shapeHeight(20)
    .labelOffset(12);

svg_legend.append('g')
    .attr('transform', 'translate(352, 60)')
    .call(colorLegend);
//legend endss here


//X axis age range and y axis Sucide counts
function draw_bar() {
    var models =  barDataByCountry[selected_country];



    console.log(selected_year, selected_country);

    models = models.map(i => {
        i.age_range = i.age_range;
        return i;
    });

    var container = d3.select('#bar'),
        width = 450,
        height = 300,
        margin = {top: 30, right: 20, bottom: 30, left: 50},
        barPadding = .2,
        axisTicks = {qty: 5, outerSize: 0, dateFormat: '%m-%d'};

    var svg = container
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    var xScale0 = d3.scaleBand().range([0, width - margin.left - margin.right]).padding(barPadding);
    var xScale1 = d3.scaleBand();
    var yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

    var xAxis = d3.axisBottom(xScale0).tickSizeOuter(axisTicks.outerSize);
    var yAxis = d3.axisLeft(yScale).ticks(axisTicks.qty).tickSizeOuter(axisTicks.outerSize);

    xScale0.domain(models.map(d => d.age_range));
    xScale1.domain(['male', 'female']).range([0, xScale0.bandwidth()]);
    yScale.domain([0, d3.max(models, d => parseInt(d.male) > parseInt(d.female) ? parseInt(d.male) : parseInt(d.female))]);

    var age_range = svg.selectAll('.age_range')
        .data(models)
        .enter().append('g')
        .attr('class', 'age_range')
        .attr('transform', d => `translate(${xScale0(d.age_range)},0)`);

    /* Add male bars */
    age_range.selectAll('.bar.male')
        .data(d => [d])
        .enter()
        .append('rect')
        .attr('class', 'bar male')
        .style('fill','#2196F3')
        .attr('x', d => xScale1('male'))
        .attr('y', d => yScale(d.male))
        .attr('width', xScale1.bandwidth())
        .attr('height', d => {
            return height - margin.top - margin.bottom - yScale(d.male)
        });

    /* Add female bars */
    age_range.selectAll('.bar.female')
        .data(d => [d])
        .enter()
        .append('rect')
        .attr('class', 'bar female')
        .style('fill','#64B5F6')
        .attr('x', d => xScale1('female'))
        .attr('y', d => yScale(d.female))
        .attr('width', xScale1.bandwidth())
        .attr('height', d => {
            return height - margin.top - margin.bottom - yScale(d.female)
        });

    // Add the X Axis
    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
        .call(xAxis);

    // Add the Y Axis
    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);
}

function remove_bar() {
    $('#bar > svg').remove();
}

function rp(p) {
    console.log(p);
    return p;
}
