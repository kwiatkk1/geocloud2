/*global $:false */
/*global Ext:false */
/*global Heron:false */
/*global MapCentia:false */
/*global OpenLayers:false */
/*global ol:false */
/*global GeoExt:false */
/*global document:false */
/*global array_unique:false */
/*global window:false */
Ext.namespace("MapCentia");
Ext.namespace("Heron.options");
Ext.namespace("Heron.options.map");
Ext.namespace("Heron.options.wfs");
Ext.namespace("Heron.options.center");
Ext.namespace("Heron.options.zoom");
Ext.namespace("Heron.options.extentrestrict");
Ext.namespace("Heron.options.zoomrestrict");
Ext.namespace("Heron.options.resolutions");
Ext.namespace("Heron.options.layertree");
Ext.namespace("Heron.options.map.resolutions");
var metaData, metaDataKeys = [], metaDataKeysTitle = [], searchWin, placeMarkers, placePopup;

MapCentia.setup = function () {
    "use strict";
    Heron.globals.metaReady = false;
    Heron.globals.serviceUrl = '/cgi/heron.cgi';
    Ext.BLANK_IMAGE_URL = '/js/ext/resources/images/default/s.gif';
    Heron.options.resolutions = [156543.033928, 78271.516964, 39135.758482, 19567.879241, 9783.9396205,
        4891.96981025, 2445.98490513, 1222.99245256, 611.496226281, 305.748113141, 152.87405657,
        76.4370282852, 38.2185141426, 19.1092570713, 9.55462853565, 4.77731426782, 2.38865713391,
        1.19432856696, 0.597164283478, 0.298582141739, 0.149291];
    MapCentia.gc2 = new geocloud.map({});
    var uri = window.location.pathname.split("/"),
        db = uri[3],
        schema = uri[4],
        url = '/wms/' + db + '/tilecache/',
        wfsUrl = '/wfs/' + db + '/' + schema;

    $.ajax({
        url: '/api/v1/setting/' + db,
        dataType: 'jsonp',
        jsonp: 'jsonp_callback',
        success: function (response) {
            if (typeof response.data.extents === "object") {
                if (typeof response.data.center[schema] === "object") {
                    Heron.options.zoom = response.data.zoom[schema];
                    Heron.options.center = response.data.center[schema];
                }
            }
            Heron.options.map.settings = {
                projection: 'EPSG:900913',
                displayProjection: new OpenLayers.Projection("EPSG:4326"),
                units: 'm',
                maxExtent: '-20037508.34, -20037508.34, 20037508.34, 20037508.34',
                center: Heron.options.center,
                maxResolution: 'auto',
                xy_precision: 5,
                zoom: Heron.options.zoom + 1, // Why?
                theme: null,
                permalinks: {
                    /** The prefix to be used for parameters, e.g. map_x, default is 'map' */
                    paramPrefix: 'map',
                    /** Encodes values of permalink parameters ? default false*/
                    encodeType: false,
                    /** Use Layer names i.s.o. OpenLayers-generated Layer Id's in Permalinks */
                    prettyLayerNames: true
                }
            };
            var altId, lName, baseLayers = [], bl, i;
            MapCentia.gc2.bingApiKey = window.bingApiKey;
            MapCentia.gc2.digitalGlobeKey = window.digitalGlobeKey;
            for (i = 0; i < window.setBaseLayers.length; i = i + 1) {
                altId = undefined;
                lName = undefined;
                if (typeof window.setBaseLayers[i].restrictTo === "undefined" || window.setBaseLayers[i].restrictTo.indexOf(window.location.pathname.split("/")[4]) > -1) {
                    // Local base layer
                    if (typeof window.setBaseLayers[i].db !== "undefined") {
                        altId = window.setBaseLayers[i].id + window.setBaseLayers[i].name;
                        lName = window.setBaseLayers[i].name;
                    }
                    bl = MapCentia.gc2.addBaseLayer(window.setBaseLayers[i].id, window.setBaseLayers[i].db, altId, lName);
                    baseLayers.push({
                        nodeType: "gx_layer",
                        layer: window.setBaseLayers[i].id,
                        text: window.setBaseLayers[i].name
                    });
                }
            }
            $.ajax({
                url: "/api/v1/meta/" + db + "/" + schema,
                contentType: "application/json; charset=utf-8",
                scriptCharset: "utf-8",
                dataType: 'jsonp',
                jsonp: 'jsonp_callback',
                success: function (response) {
                    var groups = [], children = [], text, name, group, type, arr, lArr = [], bArr = [], isBaseLayer, layer, geomField;
                    Heron.options.map.layers = [];
                    metaData = response;
                    for (var x = 0; x < metaData.data.length; x++) {
                        metaDataKeys[metaData.data[x].f_table_name] = metaData.data[x];
                        if (!metaData.data[x].f_table_title) {
                            metaData.data[x].f_table_title = metaData.data[x].f_table_name;
                        }
                        metaDataKeysTitle[metaData.data[x].f_table_title] = metaData.data[x];
                    }
                    $.each(response.data, function (i, v) {
                        text = (v.f_table_title === null || v.f_table_title === "") ? v.f_table_name : v.f_table_title;
                        name = v.f_table_schema + "." + v.f_table_name;
                        group = v.layergroup;
                        type = v.type;
                        geomField = v.f_geometry_column;
                        isBaseLayer = v.baselayer;

                        for (i = 0; i < response.data.length; i = i + 1) {
                            groups[i] = response.data[i].layergroup;
                        }
                        if (isBaseLayer) {
                            layer = [
                                "OpenLayers.Layer.TMS",
                                name,
                                url,
                                {
                                    layername: name,
                                    type: 'png',
                                    resolutions: Heron.options.resolutions,
                                    isBaseLayer: isBaseLayer,
                                    title: (!v.bitmapsource) ? text : " ",
                                    visibility: false,
                                    transitionEffect: 'resize'

                                }
                            ];
                        } else {
                            layer = [
                                "OpenLayers.Layer.WMS",
                                name,
                                url + schema,
                                {
                                    layers: name,
                                    format: 'image/png',
                                    transparent: true
                                },
                                {
                                    resolutions: Heron.options.resolutions,
                                    isBaseLayer: isBaseLayer,
                                    title: (!v.bitmapsource) ? text : " ",
                                    singleTile: false,
                                    visibility: false,
                                    transitionEffect: 'resize',
                                    featureInfoFormat: isBaseLayer ? null : 'application/vnd.ogc.gml',
                                    metadata: {
                                        wfs: {
                                            protocol: new OpenLayers.Protocol.WFS({
                                                version: "1.0.0",
                                                url: '/wfs/' + db + '/' + schema + '/3857?',
                                                srsName: "EPSG:3857",
                                                featureType: v.f_table_name,
                                                featureNS: "http://twitter/" + db
                                            })
                                        }
                                    },
                                    db: db,
                                    geomField: geomField

                                }
                            ];
                        }
                        if (!isBaseLayer) {
                            lArr.push({text: text, name: name, group: group, type: type});
                            Heron.options.map.layers.push(layer);
                        } else {
                            bArr.push(layer);
                            baseLayers.push({
                                nodeType: "gx_layer",
                                layer: name,
                                text: text,
                                legend: false
                            });
                        }

                        Heron.options.map.layers.push(
                            new OpenLayers.Layer.Vector(name + "_v", {
                                strategies: [new OpenLayers.Strategy.BBOX()],
                                visibility: false,
                                title: (!v.bitmapsource) ? text : " ",
                                protocol: new OpenLayers.Protocol.WFS({
                                    version: "1.0.0",
                                    url: '/wfs/' + db + '/' + schema + '/3857?',
                                    srsName: "EPSG:3857",
                                    featureType: v.f_table_name,
                                    featureNS: "http://twitter/" + db
                                })
                            })
                        );
                    });
                    Heron.options.map.layers = MapCentia.gc2.getBaseLayers(true).concat(bArr).concat(Heron.options.map.layers);

                    // Define a blank base layer and add it
                    var blank = new OpenLayers.Layer.Image(
                        "None",
                        Ext.BLANK_IMAGE_URL,
                        OpenLayers.Bounds.fromString(Heron.options.map.settings.maxExtent),
                        new OpenLayers.Size(10, 10),
                        {
                            resolutions: Heron.options.resolutions,
                            isBaseLayer: true,
                            visibility: false,
                            displayInLayerSwitcher: false,
                            transitionEffect: 'resize'
                        }
                    );
                    Heron.options.map.layers.push(blank);

                    arr = array_unique(groups);
                    $.each(arr, function (u, m) {
                        var g;
                        g = {
                            text: m,
                            nodeType: 'hr_cascader',
                            children: []
                        };
                        $.each(lArr, function (i, v) {
                            if (m === v.group) {
                                /*if (v.type !== "RASTER") {
                                 g.children.push(
                                 {
                                 nodeType: "gx_layer",
                                 layer: v.name + "_v",
                                 text: v.text + " (WFS)",
                                 legend: false
                                 }
                                 );
                                 }*/
                                g.children.push(
                                    {
                                        nodeType: "gx_layer",
                                        layer: v.name,
                                        text: v.text,
                                        //text: v.text + " (WMS)",
                                        legend: false
                                    }
                                );

                            }
                        });
                        g.children.reverse();
                        children.push(g);
                    });
                    children.reverse();
                    baseLayers.push({
                        nodeType: "gx_layer",
                        layer: "None",
                        text: "None",
                        legend: false
                    });
                    Heron.options.layertree.tree = [{
                        text: 'BaseLayers',
                        expanded: false,
                        children: baseLayers
                    }].concat(children);
                    Heron.globals.metaReady = true;
                }
            });
        }
    }); // Ajax call end
};
MapCentia.init = function () {
    "use strict";
    OpenLayers.ProxyHost = "/cgi/proxy.cgi?url=";
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
    //OpenLayers.DOTS_PER_INCH = 25.4 / 0.28;


    Heron.options.bookmarks = [];
    Heron.options.exportFormats = ['CSV', 'GMLv2', 'Shapefile',
        {
            name: 'Esri Shapefile (WGS84)',
            formatter: 'OpenLayersFormatter',
            format: 'OpenLayers.Format.GeoJSON',
            targetFormat: 'ESRI Shapefile',
            targetSrs: 'EPSG:4326',
            fileExt: '.zip',
            mimeType: 'application/zip'
        },
        'GeoJSON', 'WellKnownText'];

    Heron.options.wfs.downloadFormats = [
        {
            name: 'CSV',
            outputFormat: 'csv',
            fileExt: '.csv'
        },
        {
            name: 'GML (version 2.1.2)',
            outputFormat: 'text/xml; subtype=gml/2.1.2',
            fileExt: '.gml'
        },
        {
            name: 'ESRI Shapefile (zipped)',
            outputFormat: 'SHAPE-ZIP',
            fileExt: '.zip'
        },
        {
            name: 'GeoJSON',
            outputFormat: 'json',
            fileExt: '.json'
        }
    ];
    Heron.options.searchPanelConfig = {
        xtype: 'hr_multisearchcenterpanel',
        height: 600,
        hropts: [

            {
                searchPanel: {
                    xtype: 'hr_searchbydrawpanel',
                    name: __('Search by Drawing'),
                    header: false
                },
                resultPanel: {
                    xtype: 'hr_featuregridpanel',
                    id: 'hr-featuregridpanel',
                    header: false,
                    autoConfig: true,
                    autoConfigMaxSniff: 100,
                    exportFormats: window.gc2Options.showDownloadOtionsInHeron ? Heron.options.exportFormats : [],
                    gridCellRenderers: Heron.options.gridCellRenderers,
                    hropts: {
                        zoomOnRowDoubleClick: true,
                        zoomOnFeatureSelect: false,
                        zoomLevelPointSelect: 8,
                        zoomToDataExtent: false
                    }
                }
            },
            {
                searchPanel: {
                    xtype: 'hr_searchbyfeaturepanel',
                    name: __('Search by Feature Selection'),
                    description: 'Select feature-geometries from one layer and use these to perform a spatial search in another layer.',
                    header: false,
                    border: false,
                    bodyStyle: 'padding: 6px',
                    style: {
                        fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
                        fontSize: '12px'
                    }
                },
                resultPanel: {
                    xtype: 'hr_featuregridpanel',
                    id: 'hr-featuregridpanel',
                    header: false,
                    border: false,
                    autoConfig: true,
                    exportFormats: window.gc2Options.showDownloadOtionsInHeron ? Heron.options.exportFormats : [],
                    gridCellRenderers: Heron.options.gridCellRenderers,
                    hropts: {
                        zoomOnRowDoubleClick: true,
                        zoomOnFeatureSelect: false,
                        zoomLevelPointSelect: 8,
                        zoomToDataExtent: false
                    }
                }
            },
            {
                searchPanel: {
                    xtype: 'hr_gxpquerypanel',
                    name: __('Build your own searches'),
                    description: 'This search uses both search within Map extent and/or your own attribute criteria',
                    header: false,
                    border: false,
                    caseInsensitiveMatch: true,
                    autoWildCardAttach: true
                },
                resultPanel: {
                    xtype: 'hr_featuregridpanel',
                    id: 'hr-featuregridpanel',
                    header: false,
                    border: false,
                    autoConfig: true,
                    exportFormats: window.gc2Options.showDownloadOtionsInHeron ? ['XLS', 'GMLv2', 'GeoJSON', 'WellKnownText', 'Shapefile'] : [],
                    gridCellRenderers: Heron.options.gridCellRenderers,
                    hropts: {
                        zoomOnRowDoubleClick: true,
                        zoomOnFeatureSelect: false,
                        zoomLevelPointSelect: 8,
                        zoomToDataExtent: true
                    }
                }
            }
        ]
    };
    Heron.options.map.toolbar = [
        {type: "scale", options: {width: 110}},
        {
            type: "featureinfo",
            options: {
                popupWindow: {
                    width: 360,
                    height: 200,
                    featureInfoPanel: {
                        showTopToolbar: true,
                        displayPanels: ['Table'],
                        // Should column-names be capitalized? Default true.
                        columnCapitalize: true,
                        hideColumns: ['objectid', 'gid'],
                        exportFormats: window.gc2Options.showDownloadOtionsInHeron ? Heron.options.exportFormats : [],
                        maxFeatures: 10,
                        discardStylesForDups: true
                    }
                }
            }
        },
        {type: "-"},
        {type: "pan"},
        {type: "zoomin"},
        {type: "zoomout"},
        {type: "zoomvisible"},
        {
            type: "coordinatesearch", options: {
            onSearchCompleteZoom: 8,
            showProjection: false,
            hropts: [{
                projEpsg: 'EPSG:4326',
                fieldLabelX: 'Lon',
                fieldLabelY: 'Lat',
                fieldEmptyTextX: 'Enter Lon-coordinate...',
                fieldEmptyTextY: 'Enter Lat-coordinate...'
            }]
        }
        },
        {type: "-"},
        {type: "zoomprevious"},
        {type: "zoomnext"},
        {type: "-"},
    /** Use "geodesic: true" for non-linear/Mercator projections like Google, Bing etc */
        {type: "measurelength", options: {geodesic: true}},
        {type: "measurearea", options: {geodesic: true}},
        {type: "-"},
        {type: "addbookmark"},
        {
            type: "oleditor",
            options: {
                pressed: false,
                // Options for OLEditor
                olEditorOptions: {
                    activeControls: ['UploadFeature', 'DownloadFeature', 'Separator', 'Navigation', 'SnappingSettings', /*'CADTools',*/ 'Separator', 'DeleteAllFeatures', 'DeleteFeature', 'DragFeature', 'SelectFeature', 'Separator', 'DrawHole', 'ModifyFeature', 'Separator'],
                    featureTypes: ['text', 'regular', 'polygon', 'path', 'point'],
                    language: 'en',
                    DownloadFeature: {
                        url: Heron.globals.serviceUrl,
                        formats: [
                            {
                                name: 'Well-Known-Text (WKT)',
                                fileExt: '.wkt',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.WKT'
                            },
                            {
                                name: 'Geographic Markup Language - v2 (GML2)',
                                fileExt: '.gml',
                                mimeType: 'text/xml',
                                formatter: new OpenLayers.Format.GML.v2({
                                    featureType: 'oledit',
                                    featureNS: 'http://geops.de'
                                })
                            },
                            {
                                name: 'GeoJSON',
                                fileExt: '.json',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.GeoJSON'
                            },
                            {
                                name: 'GPS Exchange Format (GPX)',
                                fileExt: '.gpx',
                                mimeType: 'text/xml',
                                formatter: 'OpenLayers.Format.GPX',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            },
                            {
                                name: 'Keyhole Markup Language (KML)',
                                fileExt: '.kml',
                                mimeType: 'text/xml',
                                formatter: 'OpenLayers.Format.KML',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            },
                            {
                                name: 'ESRI Shapefile (zipped, Google projection)',
                                fileExt: '.zip',
                                mimeType: 'application/zip',
                                formatter: 'OpenLayers.Format.GeoJSON',
                                targetFormat: 'ESRI Shapefile',
                                fileProjection: new OpenLayers.Projection('EPSG:900913')
                            },
                            {
                                name: 'ESRI Shapefile (zipped, WGS84)',
                                fileExt: '.zip',
                                mimeType: 'application/zip',
                                formatter: 'OpenLayers.Format.GeoJSON',
                                targetFormat: 'ESRI Shapefile',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            }
                            //{name: 'OGC GeoPackage (Google projection)', fileExt: '.gpkg', mimeType: 'application/binary', formatter: 'OpenLayers.Format.GeoJSON', targetFormat: 'GPKG', fileProjection: new OpenLayers.Projection('EPSG:     ')},
                            //{name: 'OGC GeoPackage (WGS84)', fileExt: '.gpkg', mimeType: 'application/binary', formatter: 'OpenLayers.Format.GeoJSON', targetFormat: 'GPKG', fileProjection: new OpenLayers.Projection('EPSG:4326')}

                        ],
                        fileProjection: new OpenLayers.Projection('EPSG:4326')
                    },
                    UploadFeature: {
                        url: Heron.globals.serviceUrl,
                        formats: [
                            {
                                name: 'Well-Known-Text (WKT)',
                                fileExt: '.wkt',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.WKT'
                            },
                            {
                                name: 'Geographic Markup Language - v2 (GML2)',
                                fileExt: '.gml',
                                mimeType: 'text/xml',
                                formatter: 'OpenLayers.Format.GML'
                            },
                            {
                                name: 'GeoJSON',
                                fileExt: '.json',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.GeoJSON'
                            },
                            {
                                name: 'GPS Exchange Format (GPX)',
                                fileExt: '.gpx',
                                mimeType: 'text/xml',
                                formatter: 'OpenLayers.Format.GPX',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            },
                            {
                                name: 'Keyhole Markup Language (KML)',
                                fileExt: '.kml',
                                mimeType: 'text/xml',
                                formatter: 'OpenLayers.Format.KML',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            },
                            {
                                name: 'CSV (with X,Y in WGS84)',
                                fileExt: '.csv',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.GeoJSON',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            },
                            {
                                name: 'ESRI Shapefile (zipped, Google projection)',
                                fileExt: '.zip',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.GeoJSON',
                                fileProjection: new OpenLayers.Projection('EPSG:900913')
                            },
                            {
                                name: 'ESRI Shapefile (zipped, WGS84)',
                                fileExt: '.zip',
                                mimeType: 'text/plain',
                                formatter: 'OpenLayers.Format.GeoJSON',
                                fileProjection: new OpenLayers.Projection('EPSG:4326')
                            }
                            //{name: 'OGC GeoPackage (Google projection)', fileExt: '.gpkg', mimeType: 'text/plain', formatter: 'OpenLayers.Format.GeoJSON', fileProjection: new OpenLayers.Projection('EPSG:900913')},
                            //{name: 'OGC GeoPackage (1 layer, WGS84)', fileExt: '.gpkg', mimeType: 'text/plain', formatter: 'OpenLayers.Format.GeoJSON', fileProjection: new OpenLayers.Projection('EPSG:4326')}

                        ],
                        fileProjection: new OpenLayers.Projection('EPSG:4326')
                    }
                }
            }
        },
        {type: "-"},
        {
            type: "searchcenter",
            // Options for SearchPanel window
            options: {
                show: false,

                searchWindow: {
                    title: __('Multiple Searches'),
                    x: 100,
                    y: undefined,
                    width: 360,
                    height: 440,
                    items: [
                        Heron.options.searchPanelConfig
                    ]
                }
            }
        },
        {
            type: "any",
            options: {
                text: '',
                tooltip: 'Search with Google Places',
                iconCls: 'icon-map-magnify',
                id: "googleSearch",
                handler: function (objRef) {
                    if (!searchWin) {
                        searchWin = new Ext.Window({
                            title: "Find",
                            layout: 'fit',
                            width: 300,
                            height: 70,
                            plain: true,
                            closeAction: 'hide',
                            html: '<div style="padding: 5px" id="searchContent"><input style="width: 270px" type="text" id="gAddress" name="gAddress" value="" /></div>',
                            x: 300,
                            y: 70
                        });
                    }
                    if (typeof(objRef) === "object") {
                        searchWin.show(objRef);
                    } else {
                        searchWin.show();
                    }//end if object reference was passed
                    var input = document.getElementById('gAddress');
                    var options = {
                        //bounds: defaultBounds
                        //types: ['establishment']
                    };
                    var autocomplete = new google.maps.places.Autocomplete(input, options);
                    //console.log(autocomplete.getBounds());
                    google.maps.event.addListener(autocomplete, 'place_changed', function () {
                        var place = autocomplete.getPlace();
                        var transformPoint = function (lat, lon, s, d) {
                            var p = [];
                            if (typeof Proj4js === "object") {
                                var source = new Proj4js.Proj(s);    //source coordinates will be in Longitude/Latitude
                                var dest = new Proj4js.Proj(d);
                                p = new Proj4js.Point(lat, lon);
                                Proj4js.transform(source, dest, p);
                            }
                            else {
                                p.x = null;
                                p.y = null;
                            }
                            return p;
                        };
                        var p = transformPoint(place.geometry.location.lng(), place.geometry.location.lat(), "EPSG:4326", "EPSG:900913");
                        var point = new OpenLayers.LonLat(p.x, p.y);
                        MapCentia.gc2.map.setCenter(point, 17);
                        try {
                            placeMarkers.destroy();
                        } catch (e) {
                        }

                        try {
                            placePopup.destroy();
                        } catch (e) {
                        }

                        placeMarkers = new OpenLayers.Layer.Markers("Markers");
                        MapCentia.gc2.map.addLayer(placeMarkers);
                        placeMarkers.addMarker(new OpenLayers.Marker(point));
                        placePopup = new OpenLayers.Popup.FramedCloud("place", point, null, "<div id='placeResult' style='z-index:1000;width:200px;height:50px;overflow:auto'>" + place.formatted_address + "</div>", null, true);
                        MapCentia.gc2.map.addPopup(placePopup);
                    });

                }
            }
        },
        {type: "-"},
        {
            type: "printdialog", options: {
            url: window.gc2Options.geoserverHost + '/geoserver/pdf',
            windowWidth: 360
            // , showTitle: true
            // , mapTitle: 'My Header - Print Dialog'
            // , mapTitleYAML: "mapTitle"		// MapFish - field name in config.yaml - default is: 'mapTitle'
            // , showComment: true
            // , mapComment: 'My Comment - Print Dialog'
            // , mapCommentYAML: "mapComment"	// MapFish - field name in config.yaml - default is: 'mapComment'
            // , showFooter: true
            , mapFooter: 'My Footer - Print Dialog'
            // , mapFooterYAML: "mapFooter"	    // MapFish - field name in config.yaml - default is: 'mapFooter'
            // , printAttribution: true         // Flag for printing the attribution
            // , mapAttribution: null           // Attribution text or null = visible layer attributions
            // , mapAttributionYAML: "mapAttribution" // MapFish - field name in config.yaml - default is: 'mapAttribution'
            , showOutputFormats: true
            // , showRotation: true
            // , showLegend: true
            // , showLegendChecked: true
            // , mapLimitScales: false
            , mapPreviewAutoHeight: true // Adapt height of preview map automatically, if false mapPreviewHeight is used.
            // , mapPreviewHeight: 400
        }
        }
    ];

    Heron.layout = {
        xtype: 'panel',
        id: 'hr-container-main',
        layout: 'border',
        border: false,

        /** Any classes in "items" and nested items are automatically instantiated (via "xtype") and added by ExtJS. */
        items: [
            {
                xtype: 'panel',
                id: 'hr-menu-left-container',
                layout: 'accordion',
                region: "west",
                width: 240,
                collapsible: true,
                split: true,
                border: false,
                items: [
                    {
                        xtype: 'hr_layertreepanel',
                        border: true,
                        layerIcons: 'bylayertype',
                        contextMenu: [
                            {
                                xtype: 'hr_layernodemenulayerinfo'
                            },
                            {
                                xtype: 'hr_layernodemenuzoomextent'
                            },
                            {
                                xtype: 'hr_layernodemenustyle'
                            },
                            {
                                xtype: 'hr_layernodemenuopacityslider'
                            }
                        ],
                        hropts: Heron.options.layertree
                    },
                    {
                        xtype: 'hr_bookmarkspanel',
                        id: 'hr-bookmarks',
                        border: true,
                        /** The map contexts to show links for in the BookmarksPanel. */
                        hropts: Heron.options.bookmarks
                    }
                ]
            },
            {
                xtype: 'panel',
                id: 'hr-map-and-info-container',
                layout: 'border',
                region: 'center',
                width: '100%',
                collapsible: false,
                split: true,
                border: false,
                items: [
                    {
                        xtype: 'hr_mappanel',
                        id: 'hr-map',
                        region: 'center',
                        collapsible: false,
                        border: false,
                        hropts: Heron.options.map
                    }
                ]
            },
            {
                xtype: 'panel',
                id: 'hr-menu-right-container',
                layout: 'accordion',
                region: "east",
                width: 240,
                collapsible: true,
                split: true,
                border: false,
                items: [
                    {
                        xtype: 'hr_layerlegendpanel',
                        id: 'hr-layerlegend-panel',
                        border: true,
                        defaults: {
                            useScaleParameter: true,
                            baseParams: {
                                FORMAT: 'image/png'
                            }
                        },
                        hropts: {
                            // Preload Legends on initial startup
                            // Will fire WMS GetLegendGraphic's for WMS Legends
                            // Otherwise Legends will be loaded only when Layer
                            // becomes visible. Default: false
                            prefetchLegends: false
                        }
                    }
                ]
            }
        ]
    };
};
MapCentia.setup();
(function pollForLayers() {
    "use strict";
    if (Heron.globals.metaReady) {
        MapCentia.init();
        Heron.App.create();
        Heron.App.show();
        MapCentia.gc2.map = Heron.App.map;
        Heron.App.map.addControl(new OpenLayers.Control.ScaleLine());
    } else {
        setTimeout(pollForLayers, 300);
    }
}());



