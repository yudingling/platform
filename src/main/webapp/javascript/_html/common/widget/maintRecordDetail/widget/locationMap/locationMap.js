
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
    
    return declare("common.widget.maintRecordDetail.locMap", [CKMap], {
        baseClass: "common_widget_maintRecordDetail_locMap",
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
        },
        
        refresh: function(clients){
            this.callLater(function(){
                this.gLayer.clear();
                
                var xmin = 360, ymin = 360, xmax = -1, ymax = -1;
                var points = [];
                
                this.clientsMap = {};

                for(var i=0; i<clients.length; i++){
                    var curLoc = clients[i];
                    
                    if(!base.isNull(curLoc.c_LGTD) && !base.isNull(curLoc.c_LTTD)){
                        points.push(new Point(curLoc.c_LGTD, curLoc.c_LTTD));
                    
                        var obj = {
                            point: this._createPointGraphic(curLoc),
                            desc: this._createTxtGraphic(curLoc)
                        };

                        this.clientsMap[curLoc.c_ID] = obj;

                        this.gLayer.add(obj.point);
                        this.gLayer.add(obj.desc);

                        var tmp = parseFloat(curLoc.c_LGTD)
                        if(xmin > tmp){
                            xmin = tmp;
                        }
                        if(xmax < tmp){
                            xmax = tmp;
                        }

                        tmp = parseFloat(curLoc.c_LTTD)
                        if(ymin > tmp){
                            ymin = tmp;
                        }
                        if(ymax < tmp){
                            ymax = tmp;
                        }
                    }
                }
                
                if(points.length > 1){
                    this.extent(xmin-0.2, ymin-0.2, xmax+0.2, ymax+0.2);

                }else if(points.length == 1){
                    this.locate(points[0].x, points[0].y, false, 8);
                }
            });
        },
        
        mapTypeChanged: function(){
            this.inherited(arguments);
            
            this.callLater(function(){
                this._setColorOnTypeChanged();
            });
        },
        
        _setColorOnTypeChanged: function(){
            if(this.clientsMap){
                for(var key in this.clientsMap){
                    var obj = this.clientsMap[key];

                    obj.desc.symbol.setColor(this._getDescColor());
                    if(obj.point.symbol.outline){
                        obj.point.symbol.outline.setColor(this._getPointBorderColor());
                    }
                }

                this.gLayer.redraw();
            }
        },
        
        _getDescColor: function(hover){
            if(this.mapType == 'road'){
                return new Color(hover? '#317cf9' : '#3d3834');
            }else{
                return new Color(hover? '#fff' : '#f7f3f3');
            }
        },
        
        _getPointBorderColor: function(){
            if(this.mapType == 'road'){
                return new Color('#cfddf1');
            }else{
                return new Color('#f7f3f3');
            }
        },
        
        _initGLayer: function(){
            this.gLayer = new GraphicsLayer();
            this.map.addLayer(this.gLayer);
            
            this.gLayer.on("mouse-over", lang.hitch(this, function(evt){
                this.map.setMapCursor("pointer");
                
                var obj = this.clientsMap[evt.graphic.attributes.c_ID];
                if(obj){
                    obj.desc.symbol.setColor(this._getDescColor(true));
                    this.gLayer.redraw();
                }
            }));
            
            this.gLayer.on("mouse-out", lang.hitch(this, function(evt){
                this.map.setMapCursor("default");
                
                var obj = this.clientsMap[evt.graphic.attributes.c_ID];
                if(obj){
                    obj.desc.symbol.setColor(this._getDescColor());
                    this.gLayer.redraw();
                }
            }));
        },
        
        _createPointGraphic: function(item){
            var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE, 
                    20, 
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, this._getPointBorderColor(), 2),
                    new Color('#db4437'));
            

            return new Graphic(new Point(item.c_LGTD, item.c_LTTD), symbol, item);
        },
        
        _createTxtGraphic: function(item){
            var font = new Font("12px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER);
            var textSymbol = new TextSymbol(item.c_NM, font, this._getDescColor());
            textSymbol.setHorizontalAlignment('left');
            textSymbol.setVerticalAlignment('middle');
            textSymbol.setOffset(13, 0);

            return new Graphic(new Point(item.c_LGTD, item.c_LTTD), textSymbol, item);
        }
    });
});
