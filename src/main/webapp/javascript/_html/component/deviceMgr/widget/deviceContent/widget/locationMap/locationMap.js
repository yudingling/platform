
define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/event",
    "root/map/CKMap",
    "esri/layers/GraphicsLayer",
    "esri/symbols/PictureMarkerSymbol",
    'esri/symbols/SimpleMarkerSymbol',
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/TextSymbol",
    "esri/symbols/Font",
    "esri/symbols/CartographicLineSymbol",
    "esri/geometry/Polyline",
    'dojo/_base/Color',
    'esri/graphic',
    'esri/geometry/Point',
    "esri/toolbars/edit",
    "dojo/text!./template/locationMap.html",
    "tool/css!./css/locationMap.css"
], function(
        base,
        declare,
        lang,
        topic,
        event,
        CKMap,
        GraphicsLayer,
        PictureMarkerSymbol,
        SimpleMarkerSymbol,
        SimpleLineSymbol,
        TextSymbol,
        Font,
        CartographicLineSymbol,
        Polyline,
        Color,
        Graphic,
        Point,
        Edit,
        template){
    
    return declare("component.deviceMgr.widget.dc.locMap", [CKMap], {
        baseClass: "component_deviceMgr_widget_dc_locMap",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initGLayer();
        },
        
        startup: function () {
            this.inherited(arguments);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            if(this.mouseTimeout){
                clearTimeout(this.mouseTimeout);
            }
        },
        
        loc: function(lgtd, lttd, zoomLevel){
            //parent's method don't need the callLater to wrapper.
            this.locate(lgtd, lttd, false, zoomLevel);
            
            this.callLater(function(){
                this._refreshPosGraphic(lgtd, lttd)
            });
        },
        
        refresh: function(clientId){
            this.callLater(function(){
                if(this.clientId && this.clientId == clientId){
                    return;
                }
                
                this.routeLayer.clear();
                this.gLayer.clear();
                this.tmLayer.clear();
                
                this.tmGas = {};
                this.clientId = clientId;

                if(this.clientId){
                    base.ajax({
                        url: base.getServerNM() + 'platformApi/own/client/normal/clientLocation',
                        data: {clientId: this.clientId}
                    }).success(lang.hitch(this, function(ret){
                        var locList = ret.data;

                        var xmin = 360, ymin = 360, xmax = -1, ymax = -1;
                        var points = [];
                        
                        for(var i=0; i<locList.length; i++){
                            points.push(new Point(locList[i].loc_LGTD, locList[i].loc_LTTD));

                            this.gLayer.add(this._createPointGraphic(locList[i]));
                            this.gLayer.add(this._createOrderGraphic(i+1, locList[i]));

                            this.tmGas[locList[i].loc_ID] = this._createTMGraphic(locList[i]);

                            var tmp = parseFloat(locList[i].loc_LGTD)
                            if(xmin > tmp){
                                xmin = tmp;
                            }
                            if(xmax < tmp){
                                xmax = tmp;
                            }

                            tmp = parseFloat(locList[i].loc_LTTD)
                            if(ymin > tmp){
                                ymin = tmp;
                            }
                            if(ymax < tmp){
                                ymax = tmp;
                            }
                        }

                        if(locList.length > 1){
                            this.extent(xmin-0.2, ymin-0.2, xmax+0.2, ymax+0.2);
                            
                            this.routeLayer.add(this._createRouteGraphic(points));
                        }
                    }));
                }
            });
        },
        
        mapTypeChanged: function(){
            this.inherited(arguments);
            
            this.callLater(function(){
                this._setTimeGraColorOnTypeChanged();
            });
        },
        
        _setTimeGraColorOnTypeChanged: function(){
            if(this.tmGas){
                for(var key in this.tmGas){
                    var obj = this.tmGas[key];

                    obj.symbol.setColor(this._getTmGraColor());
                }
                
                this.tmLayer.redraw();
            }
        },
        
        _getTmGraColor: function(hover){
            if(this.mapType == 'road'){
                return new Color('#317cf9');
            }else{
                return new Color('#fff');
            }
        },
        
        _initGLayer: function(){
            this.routeLayer = new GraphicsLayer();
            this.gLayer = new GraphicsLayer();
            this.tmLayer = new GraphicsLayer();
            
            this.map.addLayer(this.routeLayer);
            this.map.addLayer(this.gLayer);
            this.map.addLayer(this.tmLayer);
            
            this.gLayer.on("mouse-over", lang.hitch(this, function(evt){
                this.map.setMapCursor("pointer");
                
                var locId = evt.graphic.attributes.loc_ID;
                
                if(this.mouseTimeout){
                    clearTimeout(this.mouseTimeout);
                }
                
                if(!this.currentLocId || this.currentLocId != locId){
                    this.tmLayer.clear();
                    this.tmLayer.add(this.tmGas[locId]);
                    
                    this.currentLocId = locId;
                }
            }));
            
            this.gLayer.on("mouse-out", lang.hitch(this, function(evt){
                this.map.setMapCursor("default");
                
                var locId = evt.graphic.attributes.loc_ID;
                
                this.mouseTimeout = setTimeout(lang.hitch(this, function(){
                    this.tmLayer.clear();
                    this.currentLocId = null;
                }), 1500);
            }));
            
            this.editToolbar.on('graphic-move-stop', lang.hitch(this, function(evt){
                if(evt.graphic.attributes.id == 'posGra'){
                    topic.publish('component/deviceMgr/widget/dc/widget/locMap/move', {lgtd: evt.graphic.geometry.x.toFixed(5), lttd: evt.graphic.geometry.y.toFixed(5)});
                }
            }));
        },
        
        _createPointGraphic: function(item){
            var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE, 
                    18, 
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,255]), 1),
                    new Color('#4ca293'));

            return new Graphic(new Point(item.loc_LGTD, item.loc_LTTD), symbol, item);
        },
	
        _createOrderGraphic: function(index, item){
            var font = new Font("12px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER);
            var textSymbol = new TextSymbol(index, font, new Color('#fff'));
            textSymbol.setOffset(0, -3);

            return new Graphic(new Point(item.loc_LGTD, item.loc_LTTD), textSymbol, item);
        },
        
        _createTMGraphic: function(item){
            var font = new Font("12px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLD);
            var textSymbol = new TextSymbol((new Date(item.crt_TS)).format('yyyy-MM-dd HH:mm'), font, this._getTmGraColor());
            textSymbol.setOffset(0, -20);

            return new Graphic(new Point(item.loc_LGTD, item.loc_LTTD), textSymbol, item);
        },
        
        _createRouteGraphic: function(points){
            var tmpSymbol = new CartographicLineSymbol(
                CartographicLineSymbol.STYLE_SOLID,
                new Color('#4ca293'),
                3,
                CartographicLineSymbol.CAP_ROUND,
                CartographicLineSymbol.JOIN_ROUND
            );
            
            var polyline = new Polyline(this.spatialReference);
            polyline.addPath(points);
            
            return new Graphic(polyline, tmpSymbol);
        },
        
        _refreshPosGraphic: function(lgtd, lttd){
            if(this.posGra){
                this.map.graphics.remove(this.posGra);
            }
            
            if(!this.graSymbol){
                this.graSymbol = new PictureMarkerSymbol(
                	base.getServerNM() + "javascript/_html/common/linkimg/loc.png",
                    22,
                    40
                );
                this.graSymbol.setOffset(0, 20);
            }
            
            this.posGra = new Graphic(new Point(lgtd, lttd), this.graSymbol, {id: 'posGra'});
            
            this.editToolbar.activate(Edit.MOVE, this.posGra, {
                allowAddVertices: false,
                allowDeleteVertices: false,
                uniformScaling: false
            });
            
            this.map.graphics.add(this.posGra);
        }
    });
});
