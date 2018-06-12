
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "esri/map",
    "esri/symbols/PictureMarkerSymbol",
    "esri/SpatialReference",
    "esri/graphic",
    "esri/geometry/Point",
    "esri/toolbars/edit",
    'esri/geometry/Extent',
    "./GaoDeLayer",
    "root/jquery-popmenu/jquery.popmenu.min",
    "tool/css!esri/css/esri.css",
    "tool/css!./CKMap.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Map,
        PictureMarkerSymbol,
        SpatialReference,
        Graphic,
        Point,
        Edit,
        Extent,
        GaoDeLayer){
	
	return declare('CKMap', [_Widget], {
        /**
         * args: {center: [111.11, 34.45], zoom: 6, toolboxPos: 0}
         * toolboxPos:  0 lefttop (default),  1 rightBottom
         */
        constructor: function (args) {
            declare.safeMixin(this, $.extend({toolboxPos: 0}, args));
            
            this.map = null;
            this.spatialReference = null;
            this.editToolbar = null;
            this.mapType = 'road';
            this.deferedList = [];
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initMap();
            
            var toolParent = this._createToolParent();
            this._initZoom(toolParent);
            this._initMapType(toolParent);
        },
        
        startup: function () {
            this.inherited(arguments);
            
            //most using scenarios are create the map dynamic on component creating, in that case, the size of map container is unexpected,
            //  so we need to resize after the map being shown
            $(this.domNode).css('opacity', '0').css('transition', 'opacity 0.18s');
            this.resize();
            
            //map.autoResize option doesn't work, resize manually
            this.resizeBind = lang.hitch(this, function(){
                this.resize();
            });
            $(window).resize(this.resizeBind);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            if(this.symbolTmOut){
                clearTimeout(this.symbolTmOut);
            }
            
            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
            
            if(this.map){
                this.map.destroy();
            }
        },
        
        callLater: function(func){
            if(this.map.loaded){
                return lang.hitch(this, func)();
            }else{
                var defer = $.Deferred();
                defer.done(lang.hitch(this, func));
                
                this.deferedList.push(defer);
            }
        },
        
        clear: function(){
            this.callLater(function(){
                if(this.blurGra){
                    this.map.graphics.clear(this.blurGra);
                    this.blurGra = null;
                }
                
                if(this.symbolTmOut){
                    clearTimeout(this.symbolTmOut);
                    this.symbolTmOut = null;
                }
            });
        },
		
		locate: function(lgtd, lttd, blur, zoomLevel){
            this.callLater(function(){
                if(zoomLevel){
                    this.map.centerAndZoom([lgtd, lttd], zoomLevel);
                }else{
                    this.map.centerAt([lgtd, lttd]);
                }
                
                this.clear();
                
                if(blur){
                    if(!this.blurSymbol){
                        this.blurSymbol = new PictureMarkerSymbol(
                        	base.getServerNM() + "javascript/map/img/red_flow.gif",
                            20,
                            20
                        );
                    }
                    
                    this.blurGra = new Graphic(new Point(lgtd, lttd), this.blurSymbol);
                    
                    this.map.graphics.add(this.blurGra);
                    this.symbolTmOut = setTimeout(lang.hitch(this, function(){
                        if(this.blurGra){
                            this.map.graphics.remove(this.blurGra);
                            this.blurGra = null;
                        }
                    }), 1000);
                }
            });
		},
        
        extent: function(xmin, ymin, xmax, ymax){
            this.callLater(function(){
                var extend = new Extent(xmin, ymin, xmax, ymax, this.spatialReference);
                
                this.map.setExtent(extend);
            });
        },
        
        resize: function(){
            this.callLater(function(){
                this.map.resize();
                this.map.reposition();
                
                if(parseFloat($(this.domNode).css('opacity')) < 1){
                    this.defer(lang.hitch(this, function(){
                        topic.publish('root/map/shown');
                        
                        $(this.domNode).css('opacity', '1');
                    }), 350);
                }
            });
        },
        
        mapTypeChanged: function(){
        },
        
        /* mercator coordinate to lonlat coordinate */
        mercatorToLonlat: function(mercator){
            var x = mercator.x/20037508.34*180;
            var y = mercator.y/20037508.34*180;
            y = 180/Math.PI*(2*Math.atan(Math.exp(y*Math.PI/180))-Math.PI/2);
            
            return {x: x, y: y};
        },
        
        lonlatToMercator: function(lonlat){
            var x = lonlat.x *20037508.34/180;
            var y = Math.log(Math.tan((90+lonlat.y)*Math.PI/360))/(Math.PI/180);
            y = y *20037508.34/180;
            return {x: x, y: y}
        },
        
        _initMap: function(){
			this.map = new Map($(this.domNode)[0], {
	            center: this.center,
	            zoom: this.zoom,
	            logo:false,
                slider: false
	        });
            
//            1、arcgis map
//            var tiled = new ArcGISTiledMapServiceLayer("http://10.52.1.61:6080/arcgis/rest/services/guizhou/MapServer");
//            this.map.addLayer(tiled);
            
//            2、天地图
//            this.map.addLayer(new TianDiTuLayer());
//            var labelmap = new TianDiTuLayer();
//            labelmap.type = "tianditumapi";
//            this.map.addLayer(labelmap);
            
//            3、高德地图
            this.baselayer = new GaoDeLayer();//默认加载矢量 new gaodeLayer({layertype:"road"});也可以
            //var baselayer = new GaoDeLayer({layertype: "st"});//加载卫星图
            //var baselayer = new GaoDeLayer({layertype: "label"});//加载标注图
            this.map.addLayer(this.baselayer);
            
            //init the SpatialReference for descendant
            this.spatialReference = new SpatialReference({
                wkid: 4326
            });
            
            //init the editToolbar for descendant
            this.editToolbar = new Edit(this.map);
            
            this.map.on('load', lang.hitch(this, function(){
                //fire the actions which called before the map was loaded
                for(var i=0;i<this.deferedList.length;i++){
                    this.deferedList[i].resolve();
                }
            }));
        },
        
        _createToolParent: function(){
            var tool = $('<div class="mapTool">').addClass('pos' + this.toolboxPos);
            
            $(this.domNode).append(tool);
            return tool;
        },
        
        _initZoom: function(parent){
            var domZoomBox = $('<div class="mapZoombox"><i class="fa fa-plus"></i><div></div><i class="fa fa-minus"></i></div>');
            
            domZoomBox.find('i.fa-plus').click(lang.hitch(this, function(){
                var zoom = this.map.getZoom() + 1;
                if(zoom <= this.map.getMaxZoom() && zoom <= 18){
                    this.map.setZoom(zoom);
                }
            }));
            
            domZoomBox.find('i.fa-minus').click(lang.hitch(this, function(){
                var zoom = this.map.getZoom() - 1;
                if(zoom >= 3){
                    this.map.setZoom(zoom);
                }
            }));
            
            parent.append(domZoomBox);
        },
        
        _initMapType: function(parent){
            //default type is vector map
            this.mapType = 'road';
            
            var domMapType = $('<div class="mapType">'
                + '<span class="pop_ctrl" style="display: block"><i class="fa fa-map"></i></span>'
                + '<ul>'
                +     '<li>'
                +       '<a href="javascript:void(0);" data="road"><div></div><div>矢量</div></a>'
                +     '</li>'
                +     '<li>'
                +       '<a href="javascript:void(0);" data="st"><div></div><div>遥感</div></a>'
                +     '</li>'
                + '</ul>'
            + '</div>');

            domMapType.find('a').click(lang.hitch(this, function(e){
                var curType = $(e.currentTarget).attr('data');
                
                if(this.mapType != curType){
                    this.map.removeLayer(this.baselayer);
                    if(this.labelLayer){
                        this.map.removeLayer(this.labelLayer);
                    }
                    
                    this.mapType = curType;
                    
                    if(this.mapType == 'road'){
                        this.baselayer = new GaoDeLayer();
                        this.map.addLayer(this.baselayer);
                            
                    }else if(this.mapType == 'st'){
                        this.baselayer = new GaoDeLayer({layertype: "st"});
                        this.labelLayer = new GaoDeLayer({layertype: "label"});
                        
                        this.map.addLayer(this.baselayer);
                        this.map.addLayer(this.labelLayer);
                    }
                    
                    this.mapTypeChanged();
                }
                
                domMapType.find('ul').hide();
            }));
            
            domMapType.popmenu({
              'controller': true,       //设定是否使用控制按钮，设置为false，菜单将一直显示
              'width': '160px',         //菜单总宽度
              'background': '#fff',  //菜单背景色
              'focusColor': '#1abc9c',  //菜单按钮hover时颜色
              'borderRadius': '3px',   //边角弧度，设置为0，为直角
              'top': this.toolboxPos == 0? '28' : '80',              //上移距离，向上移动多少就设置为多少
              'left': this.toolboxPos == 0? '1' : '164',              //左移距离，设置同上
              'iconSize': '80px'       //菜单按钮大小，目前是正方形设计（宽高相同）
            });
            
            parent.append(domMapType);
        }
        
    });
});