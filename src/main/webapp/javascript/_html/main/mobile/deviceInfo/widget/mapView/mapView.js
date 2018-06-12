define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/event",
    "root/map_mobile/CKMap_mobile",
    "dojo/text!./template/mapView.html",
    "tool/css!./css/mapView.css"
], function (base,
            declare,
            lang,
            topic,
            event,
            CKMap,
            template) {

    return declare("main.mobile.deviceInfo.mapView", [CKMap], {
        baseClass: "main_mobile_deviceInfo_mapView",
        templateString: template,

        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.searchTxt = '';
            this.clientsMap = {};

            this._initEvents();
        },

        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },

        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                this.callLater(function(){
                    this._setData();
                });
                
            }), 500);
        },
        
        clear: function(){
            this.inherited(arguments);
            
            this.callLater(function(){
                this._removePreLocate();
            
                if(this.gLayer){
                    this.gLayer.clearLayers();
                }
                
                this.clientsMap = {};
            });
        },

        destroy: function () {
            this.inherited(arguments);
        },
        
        init: function(){
            this.inherited(arguments);
            
            this._initGLayer();
        },
        
        mapTypeChanged: function(){
            this.inherited(arguments);
        },
        
        search: function(searchTxt){
        	this.searchTxt = searchTxt;
            
            this.callLater(function(){
                this._setData();
            });
        },
     
        _initDom: function () {
        },
        
        _initGLayer: function(){
            this.gLayer = L.featureGroup([]).addTo(this.map);
            
            this.gLayer.on("click", lang.hitch(this, function(evt){
                this._locate(evt.layer.options.orgData, true);
            }));
        },
        
        _locate: function(client, ignoreCenter){
            if(this.preLocate && this.preLocate.c_ID == client.c_ID){
                topic.publish("main/mobile/deviceInfo/widget/detailInfo", client.c_ID);
                return;
            }
            
            this.callLater(function(){
                this._removePreLocate();
                
                var obj = this.clientsMap[client.c_ID];
                if(obj){
                    if(!ignoreCenter){
                        this.map.setView([client.c_LTTD, client.c_LGTD]);
                    }

                    this.gLayer.removeLayer(obj.point);

                    obj.locate = this._createLocateGraphic(client);
                    this.gLayer.addLayer(obj.locate);

                    this.preLocate = client;
                }
            });
        },
        
        _removePreLocate: function(){
            if(this.preLocate){
                var obj = this.clientsMap[this.preLocate.c_ID];
                if(obj){
                    this.gLayer.removeLayer(obj.locate);

                    obj.point = this._createPointGraphic(this.preLocate);
                    this.gLayer.addLayer(obj.point);
                }
                
                this.preLocate = null;
            }
        },
        
        _createPointGraphic: function(item, forLocate){
            var myIcon = L.icon({
                iconUrl: base.getServerNM() + 'javascript/_html/main/mobile/deviceInfo/widget/mapView/img/sta.png',
                iconSize: [20, 20]
            });
            return L.marker([item.c_LTTD, item.c_LGTD], {interactive: true, icon: myIcon, orgData: item});
        },
        
        _createLocateGraphic: function(item){
            var myIcon = L.icon({
                iconUrl: base.getServerNM() + 'javascript/_html/common/linkimg/loc.png',
                iconSize: [22, 40],
                iconAnchor: [12, 40]
            });
            
            var loc = L.marker([item.c_LTTD, item.c_LGTD], {interactive: true, icon: myIcon, orgData: item});
            this._bindDesc(item, loc);
            
            return loc;
        },
        
        _bindDesc: function(item, gPoint){
            gPoint.unbindTooltip();
            
            gPoint.bindTooltip(item.c_NM, {
                offset: [-1, 0],
                permanent: true,
                direction: 'bottom',
                interactive: false
            });
        },
        
        _showClients: function(clients){
            var xmin = 360, ymin = 360, xmax = -1, ymax = -1;
            
            for(var i=0; i<clients.length; i++){
                var current = clients[i];
                
                this._addClient(current);
                
                var tmp = parseFloat(current.c_LGTD)
                if(xmin > tmp){
                    xmin = tmp;
                }
                if(xmax < tmp){
                    xmax = tmp;
                }

                tmp = parseFloat(current.c_LTTD)
                if(ymin > tmp){
                    ymin = tmp;
                }
                if(ymax < tmp){
                    ymax = tmp;
                }
            }
            
            if(clients.length > 0){
                this.extent(xmin-1, ymin-2, xmax+1, ymax+2);
            }
        },
        
        _addClient: function(cli, isDiscovery){
            if(!this.clientsMap[cli.c_ID]){
                var gPoint = this._createPointGraphic(cli);
                
                this.gLayer.addLayer(gPoint);

                this.clientsMap[cli.c_ID] = {point: gPoint, locate: null, orgData: cli};
            }
        },
        
        _setData: function(){
            this.clear();
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/client/normal/mobile/myClients',
                data: {
                    search: this.searchTxt
                }
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                var dataList = [];
                
                for(var i=0; i<data.length; i++){
                    var item = data[i];
                    if(!base.isNull(item.c_LGTD) && !base.isNull(item.c_LTTD)){
                        dataList.push(item);
                    }
                }
                
                this._showClients(dataList);
            }));
        },
        
        _initEvents: function () {         
        }
    });
});
