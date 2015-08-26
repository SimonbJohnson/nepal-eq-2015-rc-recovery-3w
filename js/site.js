//configuration object

var config = {
    title:"Nepal Earthquake Red Cross Recovery Dashboard",
    description:"Red Cross recovery activity in response to Nepal Earthquakes 2015.  Select a district for more detailed information. At district level you can filter the activities by clicking the graphs and map.  On any screen the help button to the right can be clicked with instructions on how to use that screen.",
    data:"data/data.json",
    whoFieldName:"#org+pns",
    whatFieldName:"#sector",
    whereFieldName:"#adm4+code",
    statusFieldName:"#indicator+priority",
    districtlevelFieldName:"#indicator+confirmedvdc",
    geo:"data/nepal_adm3.json",
    joinAttribute:"HLCIT_CODE",
    nameAttribute:"VDC_NAME",
    color:"#B71C1C",
    colors:["#DDDDDD","#FFCDD2","#E57373","#F44336","#D32F2F","#B71C1C"],
    colors2:["#FFCDD2","#E57373","#F44336","#D32F2F","#B71C1C"]
};


function initDash(config,geom){

    $('#title').html(config.title);
    $('#description').html(config.description);
    loadDatatable();
    map = L.map('rc-3W-where',{});

    /*L.tileLayer('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.tileLayer('https://c.tiles.mapbox.com/v3/examples.map-szwdot65/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);*/

    var baselayer = new L.StamenTileLayer("toner");

    map.addLayer(baselayer);

    var info = L.control();

    info.onAdd = function (map) {
        div = L.DomUtil.create('div', 'hdx-3w-info');
            return div;
        };


    info.addTo(map);
    
    $('.hdx-3w-info').html('Click a district to see district level data');
    
    map.scrollWheelZoom.disable();
    zoomToGeom(geom);

}

function onEachFeature(feature, layer) {
    layer.on('click', function (e){
        toplayer=false;
        if(e.target.feature.properties.map=='Yes'){
            $('#modal').modal('show'); 
            //suspect e.target.feature.properties.DISTRICT will not work on multi-polygons
            $('#district_name').html(e.target.feature.properties.DISTRICT);
            //var url = 'http://beta.proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/export%3Fformat%3Dcsv%26id%3D1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA%26gid%3D0&strip-headers=on&format=html&filter01=cut&cut-include-tags01=%23adm3%2Bcode%2C%23adm4%2Bcode%2C%23org%2Bimplementing%2C%23activity%2Bdescription%2C%23status%2C%23reached%2Buse%2C%23indicator&cut-exclude-tags01=&filter02=select&force=1&select-query02-01=adm3%2Bcode%3D'+e.target.feature.properties.HLCIT_CODE
            var url = 'http://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1c6QITgxyF0qNs3Kk_7g_04kOwZ9w2stc09pWTupuBm8/edit%23gid%3D0&strip-headers=on&format=html&filter01=cut&cut-include-tags01=%23indicator%2Bpriority%2C%23sector%2C%23adm3%2Bcode%2C%23indicator%2Bconfirmedvdc%2C%23adm4%2Bcode%2C%23org%2Bpns&cut-exclude-tags01=&filter02=select&select-query02-01=%23adm3%2Bcode%3D'+e.target.feature.properties.HLCIT_CODE;
            var dataCall = $.ajax({ 
                type: 'GET', 
                url: url, 
                dataType: 'json',
                error:function(e,exception){
                    console.log(exception);
                }
            });
            overlay.setStyle(function(f){
                if(f.properties.map=='Yes'){
                    if(f.properties.priority=='A'){
                        var color = '#FFCDD2';
                    } else {
                        var color = '#FFCDD2';
                    }                    
                } else {
                    if(f.properties.priority=='A'){
                        var color = '#555555';
                    } else {
                        var color = '#555555';
                    }                                      
                }

                return {
                fillColor: color,
                color: "#7F1416",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.2};
            });


            //load geometry

            var geomCall = $.ajax({ 
                type: 'GET', 
                url: 'data/'+e.target.feature.properties.DISTRICT+'.json', 
                dataType: 'json',
            });

            $.when(dataCall, geomCall).then(function(dataArgs, geomArgs){
                /*$('#leftcolumn').removeClass('col-sm-12');
                $('#leftcolumn').addClass('col-sm-8');
                $('#rightcolumn').removeClass('col-sm-0');
                $('#rightcolumn').addClass('col-sm-4');*/
                $('#overviewtable').hide();
                map.invalidateSize();
                $('#info_row').show();
                var data = hxlProxyToJSON(dataArgs[0])
                data.forEach(function(d){
                    if(d['#adm4+code']=='') {
                        d["#indicator+parent"] = 'No';
                    } else {
                        d["#indicator+parent"] = 'Yes';
                    }
                })
                var geom = topojson.feature(geomArgs[0],geomArgs[0].objects[e.target.feature.properties.DISTRICT]);
                $('#modal').modal('hide');
                generate3WComponent(config,data,geom,map)
            });
        }                    
    });

    layer.on('mouseover', function(e){
        if(e.target.feature.properties.map=='Yes'){
            $('.hdx-3w-info').html('Click to view '+e.target.feature.properties.DISTRICT);
            $('.adm'+e.target.feature.properties['HLCIT_CODE'].replace(/ /g,'_')).addClass('highlight');
        } else {
            $('.hdx-3w-info').html('No activity in '+e.target.feature.properties.DISTRICT);
        }
    })

    layer.on('mouseout', function(e){
        $('.hdx-3w-info').html('Click a district to see district level data');
        $('.adm'+e.target.feature.properties['HLCIT_CODE'].replace(/ /g,'_')).removeClass('highlight');
    })
}

function generate3WComponent(config,data,geom,map){

    dc.chartRegistry.clear();
    $('#rc-3W-who').html('<p>Who | Current filter: <span class="filter"></span></span></p>');
    $('#rc-3W-what').html('<p>What | Current filter: <span class="filter"></span></span></p>');
    $('#rc-3W-status').html('<p>Status | Current filter: <span class="filter"></span></span></p>');
    $('#rc-3W-districtlevel').html('<p>VDCs working in given | Current filter: <span class="filter"></span></span></p>');
    $('.hdx-3w-info').remove();

    if(dcGeoLayer!=''){
        map.removeLayer(dcGeoLayer);
    }

    lookUpVDCCodeToName = genLookupVDCCodeToName(geom,config);

    var whoChart = dc.rowChart('#rc-3W-who');
    var whatChart = dc.rowChart('#rc-3W-what');
    //var statusChart = dc.rowChart('#rc-3W-status');
    var districtlevelChart = dc.pieChart('#rc-3W-districtlevel');
    var whereChart = dc.leafletChoroplethChart('#rc-3W-where');

    var cf = crossfilter(data);

    var whoDimension = cf.dimension(function(d){ return d[config.whoFieldName]; });
    var whatDimension = cf.dimension(function(d){ return d[config.whatFieldName]; });
    //var statusDimension = cf.dimension(function(d){ return d[config.statusFieldName]; });
    var districtlevelDimension = cf.dimension(function(d){ return d[config.districtlevelFieldName];});

    var whereDimension = cf.dimension(function(d){ return d[config.whereFieldName]; });

    var whoGroup = whoDimension.group();
    var whatGroup = whatDimension.group();
    //var statusGroup = statusDimension.group();
    var districtlevelGroup = districtlevelDimension.group();
    /*var whereGroup = whereDimension.group().reduce(
        function (p, d) {
            console.log(d);
            if( d.org in p.orgs)
                p.orgs[d[config.whoFieldName]]++;
            else p.orgs[d[config.whoFieldName]] = 1;
            return p;
        },
        function (p, d) {
            p.orgs[d[config.whoFieldName]]--;
            if(p.orgs[d[config.whoFieldName]] === 0)
                delete p.orgs[d[config.whoFieldName]];
            return p;
        },
        function () {
            return {orgs: {}};
        });*/

    whereGroup = whereDimension.group();

    var all = cf.groupAll();

    whoChart.width($('#rc-3W-who').width()).height(250)
            .dimension(whoDimension)
            .group(whoGroup)
            .elasticX(true)
            .ordering(function(d){ return -d.value;})
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })            
            .xAxis().ticks(5);

    whatChart.width($('#rc-3W-what').width()).height(250)
            .dimension(whatDimension)
            .group(whatGroup)
            .elasticX(true)
            .ordering(function(d){ return -d.value;})
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })
            .xAxis().ticks(5);    
    
    /*statusChart.width($('#rc-3W-status').width()).height(250)
            .dimension(statusDimension)
            .group(statusGroup)
            .elasticX(true)
            .ordering(function(d){ return -d.value;})
            .colors([config.color])
            .colorAccessor(function(d, i){return 0;})
            .label(function(d){
                return d.key +' ('+d.value+')';
            })            
            .xAxis().ticks(5);*/

    districtlevelChart.width($('#rc-3W-districtlevel').width()).height(250)
            .dimension(districtlevelDimension)
            .group(districtlevelGroup)
            .colors(config.colors2)
            .colorDomain([0, 4])
            .colorAccessor(function(d, i){return i*4;});           

    dc.dataCount('#count-info')
            .dimension(cf)
            .group(all)
            .on('renderlet',function(c){
                if(c.dimension().size() > c.group().value()){
                    $('#clearfilters').show();
                } else {
                    $('#clearfilters').hide();
                }
            });

    whereChart.width($('#rc-3W-where').width()).height(300)
            .dimension(whereDimension)
            .group(whereGroup)
            .center([0,0])
            .zoom(0)    
            .geojson(geom)
            /*.valueAccessor(function(v){
                var size = 0, key;
                for (key in v.orgs) {
                    if (v.orgs.hasOwnProperty(key)) size++;
                }
                return size;
            })*/
            .colors(config.colors)
            .colorDomain([0, 5])
            .colorAccessor(function (d) {
                var c=0;
                if(d>3){
                    c=5;
                } else if (d>2) {
                    c=4;
                } else if (d>1) {
                    c=3;
                } else if (d>0) {
                    c=2;
                }
                return c;
            })           
            .featureKeyAccessor(function(feature){
                return feature.properties[config.joinAttribute];
            }).popup(function(feature){
                return feature.properties[config.nameAttribute] +' - Activities';
            })
            .renderPopup(true)
            .featureOptions({
                'fillColor': 'black',
                'color': 'black',
                'opacity':1,
                'fillOpacity': 0,
                'weight': 1
            })
            .createLeaflet(function(){
                return map;
            })
            .on("renderlet",(function(e){
                var html = "";
                e.filters().forEach(function(l){
                    html += lookUpVDCCodeToName[l]+", ";
                });
                $('#mapfilter').html(html);
            }));             

    dc.renderAll();
    
    zoomToGeom(geom);

    dcGeoLayer = whereChart.geojsonLayer();  

    
    var g = d3.selectAll('#rc-3W-who').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-who').width()/2)
        .attr('y', 248)
        .text('Activities');

    var g = d3.selectAll('#rc-3W-what').select('svg').append('g');
    
    g.append('text')
        .attr('class', 'x-axis-label')
        .attr('text-anchor', 'middle')
        .attr('x', $('#rc-3W-what').width()/2)
        .attr('y', 248)
        .text('Activities');      

}

function zoomToGeom(geom){
    var bounds = d3.geo.bounds(geom);
    map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
}
    
function genLookupVDCCodeToName(geojson,config){
    var lookup = {};
    geojson.features.forEach(function(e){
        lookup[e.properties[config.joinAttribute]] = String(e.properties[config.nameAttribute]);
    });
    return lookup;
}

function hxlProxyToJSON(input){
    var input = stripIfNull(input);
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            keys = e;
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function stripIfNull(input){
    if(input[0][0]==null){
        input.shift();
        return input;
    }
    return input;
}

function loadDatatable(){
    var activityurl = 'http://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/1c6QITgxyF0qNs3Kk_7g_04kOwZ9w2stc09pWTupuBm8/edit%23gid%3D0&strip-headers=on&format=html&filter01=count&count-tags01=sector%2Cadm3%2Bcode&count-aggregate-tag01=%23sector&filter02=&filter03=&filter04=&filter05=&filter06=&filter07=';
    var damageurl ='http://beta.proxy.hxlstandard.org/data.json?filter_count=7&strip-headers=on&url=https%3A//docs.google.com/spreadsheets/d/1Z4YWDKWnrSJPcyFEyHawRck0SrXg6R0hBriH7gBZuqA/pub%3Fgid%3D975313202%26single%3Dtrue%26output%3Dcsv&format=html';

    var activityCall = $.ajax({ 
            type: 'GET', 
            url: activityurl, 
            dataType: 'json',
            error:function(e,exception){
                console.log(exception);
            }
        });

        //load geometry

        var damageCall = $.ajax({ 
            type: 'GET', 
            url: damageurl, 
            dataType: 'json',
        });

    $.when(damageCall, activityCall).then(function(damageArgs, activityArgs){
        var damage = hxlProxyToJSON(damageArgs[0]);
        var activitycf = crossfilter(hxlProxyToJSON(activityArgs[0]));
        var activityDimension = activitycf.dimension(function(d){return d['#sector'];});
        var geoDimension = activitycf.dimension(function(d){ return d['#adm3+code']});
        var activityGroup = activityDimension.group().reduceSum(function(d){return d['#meta+count'];});
        var geoGroup =geoDimension.group();
        var table = '<p>The table shows number of VDCs activities are happening in. If two RC societies are working in the same VDC with the same activity it is counted twice.</p><table><tr><th></th><th class="number damage">Damage</th><th class="number damage">Priority</th>';

        var geoList = [];

        geoGroup.top(Infinity).forEach(function(d){
            if(d.value>0){
                geoList.push(d.key)
            }
        });

        var activitylist = [];
        activityGroup.top(Infinity).forEach(function(d){
            if(d.value>0){
                activitylist.push(d.key)
                table+='<th class="number">'+d.key+'</th>';
            }
        });
        table +='</tr>';
        
        var i = geom.features.length;
        while (i--) {
            var code = geom.features[i].properties['HLCIT_CODE'];
            var found = false;
            geoList.forEach(function(g){
                if(g==code){
                    found = true;
                }
            })
            if(found==false){
                geom.features[i].properties.map='No'
            } else {
                geom.features[i].properties.map='Yes'
            }            
        }
    
        
        geom.features.forEach(function(f){ 
        
            damage.forEach(function(d){
                if(d['#adm3+code']==f.properties['HLCIT_CODE']){
                    f.properties.priority = d['#indicator+priority'];
                }
            })

            if(f.properties.map=='Yes'){
                table+='<tr class="datarow adm' + f.properties['HLCIT_CODE'].replace(/ /g,'_') + '"><td>'+f.properties.DISTRICT+'</td>';
                var damagevalue = 0;
                damage.forEach(function(d){
                    if(d['#adm3+code']==f.properties['HLCIT_CODE']){
                        damagevalue = d['#affected+households'];
                        priorityvalue = d['#indicator+priority'];
                        f.properties.priority = d['#indicator+priority'];
                    }
                })
                table+='<td class="number damage">'+damagevalue+'</td>';
                table+='<td class="number damage">'+priorityvalue+'</td>';

                geoDimension.filter(f.properties['HLCIT_CODE']);
                activitylist.forEach(function(k){
                    var value = 0;
                    activityGroup.top(Infinity).forEach(function(d){
                        if(d.key==k){
                            value =d.value;
                        }
                    });
                    table +='<td class="number">'+value+'</td>';
                });
                table+='</tr>';
            }
        });
        table +='</table>';
        $('#overviewtable').html(table);

        overlay = L.geoJson(geom,{
            style: function(f){
                if(f.properties.map=='Yes'){
                    if(f.properties.priority=='A'){
                        var color = '#B71C1C';
                    } else {
                        var color = '#FFCDD2';
                    }                    
                } else {
                    if(f.properties.priority=='A'){
                        var color = '#555555';
                    } else {
                        var color = '#eeeeee';
                    }                                      
                }

                return {
                fillColor: color,
                color: "#7F1416",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.5};
            },
            onEachFeature: onEachFeature
        }).addTo(map);         
    });
}
//load 3W data
var map;
var lookUpVDCCodeToName;
var data;
var dcGeoLayer = '';
var geom = topojson.feature(nepal_adm3,nepal_adm3.objects.nepal_adm3);
var overlay;
var toplayer=true;
geom.features.forEach(function(e){
    e.properties[config.joinAttribute] = String(e.properties[config.joinAttribute]); 
});
$('#info_row').hide();
$('#intro').click(function(){
    var intro = introJs();
    if(toplayer==true){
        intro.setOptions({
            steps: [
              {
                element: '#overviewtable',
                intro: "This table gives an overview of the activities happening in a district."
              },
              {
                element: '#rc-3W-where',
                intro: "District in red can be clicked for more information.",
              },
            ]
        });
    } else {
        intro.setOptions({
            steps: [
              {
                element: '#rc-3W-where',
                intro: "The map shows the VDCs being worked in.  Be aware that some activities are stated at district level and are therefore no shown on the map.  A VDC can be selected to see what activities are happening there."
              },
                            {
                element: '#charts',
                intro: "All of the charts are interactive.  Clicking a section of the chart filters for that label.  The other charts and the map will be redrawn showing data for just that selection. The current filters applied to a chart are shown above it.",
              },
              {
                element: '#rc-3W-what',
                intro: "This graphs show what activites are happening in the district. If a VDC is selected it show what activities are happening in the VDC. A bar can be clicked such as Shelter and the other graphs change to show who is doing the shelter activity and the map will change to show where the shelter activity is happening.",
              },
              {
                element: '#rc-3W-districtlevel',
                intro: "Some RC Societies have not declared which VDCs within a district they are working in. Therefore they are not shown on the map.  Clicking 'No' on this piechart selects these activities.",
              },
              {
                element: '#rc-3W-who',
                intro: "This chart shows the RC societies working in the district.  A society can be select to just see their work.",
              },
              {
                element: '#info_row',
                intro: "This area contains a reset button.  Pressing it resets the dashboard.  If you filter the map or a chart a button will appear here the clears all the filters.  The record count shows how many records are current being shown out of the total possible for the district.",
              },              
            ]
        });
    }        
    intro.start();
});
initDash(config,geom);