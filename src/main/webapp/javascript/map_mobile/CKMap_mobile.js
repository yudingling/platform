
define(["tool/base",
        "dojo/_base/declare", 
        "tool/_BaseWidget",
        "dojo/_base/lang", 
        "dojo/topic",
        "root/jquery-popmenu/jquery.popmenu.min",
        "root/map_mobile/leaflet",
        'tool/css!./leaflet.css',
        'tool/css!./CKMap_mobile.css'], 
        function(base, declare, _Widget, lang, topic){
    
	return declare('CKMapMobile', [_Widget], {
		/**
         * args: {center: [111.11, 34.45], zoom: 6, toolboxPos: 0}
         * toolboxPos:  0 lefttop (default),  1 rightBottom
         */
        constructor: function (args) {
            declare.safeMixin(this, $.extend({toolboxPos: 0}, args));
            
            this.deferedList = [];
            this.map = null;
            this.mapType = 'road';
        },
        
        postCreate: function () {
            this.inherited(arguments);
        },
        
        startup: function () {
            this.inherited(arguments);
            
            require(['root/map_mobile/leaflet.ChineseTmsProviders'], lang.hitch(this, function(){
               this.init();
            }));
        },
        
        destroy: function(){
            if(this.symbolTmOut){
                clearTimeout(this.symbolTmOut);
            }
            
            if(this.map){
                this.map.remove();
            }
            
        	this.inherited(arguments);
        },
        
        init: function(){
            this._initMap();
                
            var toolParent = this._createToolParent();
            this._initZoom(toolParent);
            this._initMapType(toolParent);
        },
        
        callLater: function(func){
            if(this.loaded){
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
                    this.map.removeLayer(this.blurGra);
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
                    this.map.setView([lttd, lgtd], zoomLevel);
                }else{
                    this.map.setView([lttd, lgtd]);
                }
                
                this.clear();
                
                if(blur){
                    var myIcon = L.icon({
                        iconUrl: base.getServerNM() + 'javascript/map_mobile/images/red_flow.gif',
                        iconSize: [30, 30]
                    });
                    this.blurGra = L.marker([lttd, lgtd], {icon: myIcon});
                    
                    this.map.addLayer(this.blurGra);
                    this.symbolTmOut = setTimeout(lang.hitch(this, function(){
                        if(this.blurGra){
                            this.map.removeLayer(this.blurGra);
                            this.blurGra = null;
                        }
                    }), 1000);
                }
            });
		},
        
        extent: function(xmin, ymin, xmax, ymax){
            this.callLater(function(){
                this.map.fitBounds([
                    [ymin, xmin],
                    [ymax, xmax]
                ]);
            });
        },
        
        mapTypeChanged: function(){
        },
        
        _initMap: function(){
            this.baselayer = L.tileLayer.chinaProvider('GaoDe.Normal.Map');
            
            this.map = L.map(this.domNode, {
                center: [this.center[1], this.center[0]],   //index 0: lttd, index 1: lgtd
                zoom: this.zoom,
                zoomControl: false,
                attributionControl: false
            });
            
            this.map.addLayer(this.baselayer);
            
            this.loaded = true;
            
            //fire the actions which called before the map was loaded
            for(var i=0;i<this.deferedList.length;i++){
                this.deferedList[i].resolve();
            }
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
                        this.baselayer = L.tileLayer.chinaProvider('GaoDe.Normal.Map');
                        this.map.addLayer(this.baselayer);
                            
                    }else if(this.mapType == 'st'){
                        this.baselayer = L.tileLayer.chinaProvider('GaoDe.Satellite.Map');
                        this.labelLayer = L.tileLayer.chinaProvider('GaoDe.Satellite.Annotion');
                        
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