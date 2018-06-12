
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
    "esri/geometry/ScreenPoint",
    "esri/symbols/CartographicLineSymbol",
    "esri/geometry/Polyline",
    'dojo/_base/Color',
    'esri/graphic',
    'esri/geometry/Point',
    "root/customScrollbar/CustomScrollBar",
    'component/dataMonitor/widget/clientPrevCard/clientPrevCard',
    "dojo/text!./template/monitorMap.html",
    "tool/css!./css/monitorMap.css"
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
        ScreenPoint,
        CartographicLineSymbol,
        Polyline,
        Color,
        Graphic,
        Point,
        CustomScrollBar,
        ClientPrevCard,
        template){
    
    return declare("component.dataMonitor.widget.monitorMap", [CKMap], {
        baseClass: "component_dataMonitor_widget_monitorMap",
        templateString: template,
        
        constructor: function (args) {
        	this.prevCardDataMap = {};
            this.clientsMap = {};
            this.clientsMapOrg = {};
            this.metaPluginObj = {};
            
            this.discoveryMap = {};
        	
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initGLayer();
            this._initDom();
            
            //expired in 1 minute
            this.prevCardMapExpired = setInterval(lang.hitch(this, function(){
                for(var key in this.prevCardDataMap){
                    var obj = this.prevCardDataMap[key];
                    if(obj){
                        var cur = (new Date()).getTime();
                        if(cur - obj.addTM > 60000){
                            delete this.prevCardDataMap[key];
                        }
                    }
                }
                
            }), 60000);
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.metaList .slcContainer, .discovery>div:first-child'), 'x');
                
            }), 500);
        },
        
        destroy: function(){
            this._clearInfowWinTimeOut();
            this._clearDiscoveryChangeTimeOut();
            
            clearInterval(this.prevCardMapExpired);
            
            this._clearDiscovery();
            
            this.inherited(arguments);
        },
        
        clear: function(){
            this.inherited(arguments);
            
            this.callLater(function(){
                this._removePosition();
                this._removePreLocate();
            
                if(this.gLayer){
                    this.gLayer.clear();
                }
                
                this._hideMetaList();
                
                this._hideInfoWindow();

                this.clientsMap = {};
                this.clientsMapOrg = {};
                
                this.prevCardDataMap = {};
                
                this._removePreDiscoveryLocate();
            });
        },
        
        mapTypeChanged: function(){
            this.inherited(arguments);
            
            this.callLater(function(){
                this._setClientsOnMapTypeChanged();
            });
        },
        
        locate: function(client, ignoreCenter){
            if(this.preLocate && this.preLocate.c_ID == client.c_ID){
                return;
            }
            
            this.callLater(function(){
                this._removePreLocate();
                
                var obj = this.clientsMap[client.c_ID];
                if(obj){
                    if(!ignoreCenter){
                        this.map.centerAt([client.c_LGTD, client.c_LTTD]);
                    }

                    this.gLayer.remove(obj.point);

                    obj.point = this._createPointGraphic(client, true);
                    this.gLayer.add(obj.point);

                    obj.locate = new Graphic(new Point(client.c_LGTD, client.c_LTTD), this._createGraSymbol(), client);
                    this.gLayer.add(obj.locate);

                    this.preLocate = client;
                }
            });
        },
        
        getBoundary: function(extent){
            if(!extent){
                extent = this.map.extent;
            }
            
            var min = this.mercatorToLonlat({x: extent.xmin, y:extent.ymin});
            var max = this.mercatorToLonlat({x: extent.xmax, y:extent.ymax});

            return {
                xmin: min.x, 
                ymin: min.y, 
                xmax: max.x, 
                ymax: max.y
            };
        },
        
        _removePreLocate: function(){
            if(this.preLocate){
                var obj = this.clientsMap[this.preLocate.c_ID];
                if(obj){
                    this.gLayer.remove(obj.point);
                    this.gLayer.remove(obj.locate);

                    obj.point = this._createPointGraphic(this.preLocate);
                    this.gLayer.add(obj.point);
                }
                
                this.preLocate = null;
            }
        },
        
        _showMetaList: function(client){
            var metaList = $(this.domNode).find('.metaList');
            metaList.css('transition-duration', '0.5s').css('transition-timing-function', 'inherit');
            metaList.one('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                metaList.off('webkitTransitionEnd transitionend');
                this._refreshScrollBar(metaList.find('.slcContainer'));
            }));
            
            $(this.domNode).addClass('metaListShow');
            this._refreshMetaList(client);
        },
        
        _hideMetaList: function(animate){
            var metaList = $(this.domNode).find('.metaList');
            metaList.css('transition-duration', animate? '0.5s' : '0s').css('transition-timing-function', 'inherit');
            $(this.domNode).removeClass('metaListShow');
            
            if(animate){
                metaList.one('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                    metaList.off('webkitTransitionEnd transitionend');
                    this._clearMetaList();
                }));
                
            }else{
                this._clearMetaList();
            }
        },
        
        _clearMetaList: function(){
            for(var meta_ID in this.metaPluginObj){
                var pluginObj = this.metaPluginObj[meta_ID];
                
                var parentDiv = $(pluginObj.domNode).parent();
            
                pluginObj.destroyRecursive();
                parentDiv.remove();
            }
            this.metaPluginObj = {};
            
            //clear metalist object
            this.preMetaList = null;
        },
        
        _refreshMetaList: function(client){
            if(this.preMetaList && client.c_ID == this.preMetaList.c_ID){
                return;
            }
            
            this._clearMetaList();
            this.preMetaList = client;
            
            if(this.preMetaList.metaInfo){
                this._createSysMetaPlugins(client, this.preMetaList.metaInfo);
            }else{
                this._ajaxPreViewInfo(client, lang.hitch(this, function(preViewData){
                    this._createSysMetaPlugins(client, preViewData.metaInfo);
                }));
            }
        },
        
        _createSysMetaPlugins: function(client, metas){
            var parentDom = $(this.domNode).find('.metaList .slcContainer .slcContainerFuck');
            
            for(var i=0; i<metas.length; i++){
                this._newMetaPlugin(parentDom, client.c_ID, client.c_NM, metas[i]);
            }
            
            this._refreshScrollBar($(this.domNode).find('.metaList .slcContainer'));
        },
        
        _newMetaPlugin: function(parentDom, clientId, clientNm, metadata){
            if(metadata.sysmeta_ID){
                this._getSysMetaPlugin(metadata.sysmeta_ID, lang.hitch(this, function(plugin){
                    if(plugin){
                        var args = $.extend(
                            {}, 
                            base.evalJson(plugin.p_PARAM), 
                            {stm: (new Date()).add('d', -5).format("yyyy-MM-dd HH:mm:ss"), etm: (new Date()).format("yyyy-MM-dd HH:mm:ss")}, 
                            {minWidth: '410px', minHeight:'initial', size: 'small', showEditor: false},
                            {clientId: clientId, clientNm: clientNm, metaId: metadata.meta_ID, metaCId: metadata.meta_CID, metaNm: metadata.meta_NM, metaUnit: metadata.meta_UNIT});

                        base.newDojo(plugin.p_PATH, '', args).success(lang.hitch(this, function(obj){
                            var slc = $('<div>').addClass('metaPluginSlc');
                            parentDom.append(slc);

                            slc.append($(obj.domNode));
                            obj.startup();

                            this.metaPluginObj[metadata.meta_ID] = obj;
                        }));
                    }
                }));
            }
        },
        
        _getSysMetaPlugin: function(sysMetaId, callBack){
            if(this.sysMetaPluginMap){
                if(callBack){
                    callBack(this.sysMetaPluginMap[sysMetaId]);
                }
                
            }else{
                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/own/client/normal/sysMetaPlugins'
                }).success(lang.hitch(this, function(ret){
                    this.sysMetaPluginMap = ret.data;
                    if(callBack){
                        callBack(this.sysMetaPluginMap[sysMetaId]);
                    }
                }));
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('.discoveryBtn').click(lang.hitch(this, function(){
                var discovery = $(this.domNode).find('.discovery').css('transition-duration', '0.5s').css('transition-timing-function', 'inherit');
                
                if(!$(this.domNode).hasClass('discoveryShow')){
                    this._mapDiscovery(this.map.extent);
                    
                    discovery.one('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                        discovery.off('webkitTransitionEnd transitionend');
                        this._refreshScrollBar(discovery.children('div:first-child'));
                    }));
                    
                }else{
                    this._removePreDiscoveryLocate();
                }
                
                $(this.domNode).toggleClass('discoveryShow');
            }));
            
            $(this.domNode).find('.metaList .closeMeta').click(lang.hitch(this, function(){
                this._hideMetaList(true);
            }));
            
            $(this.domNode).find('.metaList .expandMeta').click(lang.hitch(this, function(){
                topic.publish('component/dataMonitor/metaShowExpand', this.preMetaList);
            }));
        },
        
        _removePosition: function(){
            if(this.posGra){
                this.map.graphics.remove(this.posGra);
                this.posGra = null;
            }
        },
        
        _position: function(client){
            this._removePosition();
            
            if(this.preLocate && this.preLocate.c_ID == client.c_ID){
                return;
            }
            
            this.posGra = new Graphic(new Point(client.c_LGTD, client.c_LTTD), this._createGraSymbol(), client);
            
            this.map.graphics.add(this.posGra);
        },
        
        _createGraSymbol: function(){
            var symbol = new PictureMarkerSymbol(
            	base.getServerNM() + "javascript/_html/common/linkimg/loc.png",
                22,
                40
            );
            symbol.setOffset(0, 20);
            return symbol;
        },
        
        _removeClient: function(client, isDiscovery){
            if(isDiscovery && this.clientsMapOrg[client.c_ID]){
                return;
            }
            
            var obj = this.clientsMap[client.c_ID];
            if(obj){
                this.gLayer.remove(obj.point);
                this.gLayer.remove(obj.desc);
                this.gLayer.remove(obj.locate);
                
                delete this.clientsMap[client.c_ID];
            }
            
            if(this.preLocate && this.preLocate.c_ID == client.c_ID){
                this.preLocate = null;
            }
            
            if(this.posGra && this.posGra.attributes.c_ID == client.c_ID){
                this._removePosition();
            }
            
            if(this.preMetaList && this.preMetaList.c_ID == client.c_ID){
                this._hideMetaList();
            }
            
            if(this.currentInfoWin && this.currentInfoWin.c_ID == client.c_ID){
                this._hideInfoWindow();
            }
            
            delete this.prevCardDataMap[client.c_ID];
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
                var gDesc = this._createDescGraphic(cli);
                this.gLayer.add(gPoint);
                this.gLayer.add(gDesc);

                this.clientsMap[cli.c_ID] = {point: gPoint, desc: gDesc, locate: null};
                
                if(!isDiscovery){
                    this.clientsMapOrg[cli.c_ID] = {point: gPoint, desc: gDesc, locate: null};
                }
            }
        },
        
        _createPointGraphic: function(item, forLocate){
            var symbol = null;
            if(forLocate){
                var symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE, 
                    7, 
                    null,
                    new Color('#db4437'));
            }else{
                symbol = new SimpleMarkerSymbol(
                    SimpleMarkerSymbol.STYLE_CIRCLE, 
                    20, 
                    new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, this._getPointBorderColor(), 2),
                    new Color('#db4437'));
            }

            return new Graphic(new Point(item.c_LGTD, item.c_LTTD), symbol, item);
        },
        
        _createDescGraphic: function(item){
            var font = new Font("12px", Font.STYLE_NORMAL, Font.VARIANT_NORMAL, Font.WEIGHT_BOLDER);
            var textSymbol = new TextSymbol(item.c_NM, font, this._getDescColor());
            textSymbol.setHorizontalAlignment('left');
            textSymbol.setVerticalAlignment('middle');
            textSymbol.setOffset(13, 0);

            return new Graphic(new Point(item.c_LGTD, item.c_LTTD), textSymbol, item);
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
        
        _setClientsOnMapTypeChanged: function(){
            for(var key in this.clientsMap){
                var obj = this.clientsMap[key];

                obj.desc.symbol.setColor(this._getDescColor());
                if(obj.point.symbol.outline){
                    obj.point.symbol.outline.setColor(this._getPointBorderColor());
                }
            }

            this.gLayer.redraw();
        },
        
        _initGLayer: function(){
            this.connectLineLayer = new GraphicsLayer();
            this.map.addLayer(this.connectLineLayer);
            
            this.gLayer = new GraphicsLayer();
            this.map.addLayer(this.gLayer);
            
            this.gLayer.on("mouse-over", lang.hitch(this, function(evt){
                this._clearInfowWinTimeOut();
                
                this.map.setMapCursor("pointer");
                
                var cli = evt.graphic.attributes;
                
                var obj = this.clientsMap[cli.c_ID];
                if(obj){
                    obj.desc.symbol.setColor(this._getDescColor(true));
                    this.gLayer.redraw();
                }
                
                this._openInfoWindow(cli);
            }));
            
            this.gLayer.on("mouse-out", lang.hitch(this, function(evt){
                this.map.setMapCursor("default");
                
                var cID = evt.graphic.attributes.c_ID;
                
                var obj = this.clientsMap[cID];
                if(obj){
                    obj.desc.symbol.setColor(this._getDescColor());
                    this.gLayer.redraw();
                }
                
                if(!this.map.infoWindow.isShowing){
                    this.currentInfoWin = null;
                }else{
                    this._setInfoWinTimeOut();
                }
            }));
            
            this.gLayer.on("click", lang.hitch(this, function(evt){
                var cID = evt.graphic.attributes.c_ID;
            }));
            
            this.map.on('extent-change', lang.hitch(this, function(evt){
                this._boundaryChanged(evt.extent, true);
                
                if($(this.domNode).hasClass('discoveryShow')){
                    this._clearDiscoveryChangeTimeOut();
                    
                    this._setDiscoveryChangeTimeOut(evt.extent);
                }
            }));
        },
        
        _setDiscoveryChangeTimeOut: function(extent){
            this.discoveryChangedTO = setTimeout(lang.hitch(this, function(){
                this._mapDiscovery(extent);
            }), 800);
        },
        
        _clearDiscoveryChangeTimeOut: function(){
            if(this.discoveryChangedTO){
                clearTimeout(this.discoveryChangedTO);
                this.discoveryChangedTO = null;
            }
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clearDiscovery: function(newCount){
            var node = $(this.domNode).find('.discovery .discoveryContainer');
            
            var children = node.children();
            children.tooltip('destroy');
            
            if(base.isNull(newCount) || newCount == 0){
                node.html(null);
            }else if(children.length > newCount){
                for(var i=newCount; i<children.length; i++){
                    $(children[i]).remove();
                }
            }
            
            this._removePreDiscoveryLocate();
        },
        
        _mapDiscovery: function(extent){
            var parent = $(this.domNode).find('.discovery .discoveryContainer');
            var fixOpacityObj = $(this.domNode).find('.discovery>div:last-child');
            if(parent.children().length == 0){
                fixOpacityObj.css('opacity', 0.3);
            }
            
            var min = this.mercatorToLonlat({x: extent.xmin, y:extent.ymin});
            var max = this.mercatorToLonlat({x: extent.xmax, y:extent.ymax});
            base.ajax({
                url: base.getServerNM() + "platformApi/own/client/normal/discovery",
                type: 'GET',
                data: {
                    startIndex: 0, 
                    length: 20,
                    xmin: min.x, 
                    ymin: min.y, 
                    xmax: max.x, 
                    ymax: max.y
                }
            }).success(lang.hitch(this, function(ret){
                var dataList = ret.data;
                var ids = [];
                
                this._clearDiscovery(dataList.length);
                
                for(var i=0; i<dataList.length; i++){
                    ids.push(dataList[i].c_ID);
                    this._createDiscoveryItem(i, parent, dataList[i]);
                }

                this._loadMapDiscoveryDetail(ids, parent);

                this._refreshScrollBar($(this.domNode).find('.discovery>div:first-child'), lang.hitch(this, function(){
                    //after refresh width, if the width is less than 3/4 of the container, we set its opacity to make it easy on eyes 
                    if(parent.width() <= parent.parent().width()*3/4){
                        fixOpacityObj.css('opacity', 0.3);
                    }else{
                        fixOpacityObj.css('opacity', 1);
                    }
                }));
                
            })).fail(lang.hitch(this, function(ret){
                this._clearDiscovery(0);
                fixOpacityObj.css('opacity', 0.3);
            }));
        },
        
        _loadMapDiscoveryDetail: function(ids, parent){
            if(ids.length > 0){
                var cachedList = [], ajaxIds = [];
                
                for(var i=0; i<ids.length; i++){
                    var cached = this.discoveryMap[ids[i]];
                    if(cached){
                        cachedList.push(cached);
                    }else{
                        ajaxIds.push(ids[i]);
                    }
                }
                
                if(ajaxIds.length > 0){
                    base.ajax({
                        url: base.getServerNM() + "platformApi/own/client/normal/discovery/detail",
                        type: 'GET',
                        data: {clientIds: JSON.stringify(ids)}
                    }).success(lang.hitch(this, function(ret){
                        this._loadDetailDefer(parent, ret.data, true);
                        this._loadDetailDefer(parent, cachedList, false);

                    }));
                    
                }else{
                    this._loadDetailDefer(parent, cachedList, false);
                }
            }
        },
        
        _updateDiscoveryOnStar: function(client){
            var node = $(this.domNode).find('.discovery .discoveryContainer>a[data="'+ client.c_ID +'"]>div');
            if(node.length > 0){
                var spanStarCount = node.find('span.starCount');
                var count = parseInt(spanStarCount.html());

                var cache = this.discoveryMap[client.c_ID];

                if(client.star){
                    count = count + 1;
                    node.find('i.fa.fa-star-o').removeClass('fa-star-o').addClass('fa-star');
                    spanStarCount.html(count);

                    if(cache){
                        cache.starByCurrent = true;
                        cache.starCount = count;
                    }

                }else{
                    count = count - 1;
                    node.find('i.fa.fa-star').removeClass('fa-star').addClass('fa-star-o');
                    spanStarCount.html(count);

                    if(cache){
                        cache.starByCurrent = false;
                        cache.starCount = count;
                    }
                }
            }
        },
        
        _loadDetailDefer: function(parent, data, isSetCache){
            for(var i=0; i<data.length; i++){
                var node = parent.find('a[data="'+ data[i].cid +'"]>div');
                if(node.length > 0){
                    this._createDiscoveryDetail(node, data[i]);

                    if(isSetCache){
                        this.discoveryMap[data[i].cid] = data[i];
                    }
                }
            }
        },
        
        _createDiscoveryItem: function(i, parent, data){
            var item = parent.children(':nth-child('+ (i+1) +')');
            
            if(item.length > 0){
                item.attr('data', data.c_ID);
                
            }else{
                item = $('<a href="javascript:void(0);" data="'+ data.c_ID +'"><span></span><div></div></a>');
                parent.append(item);
            }
            
            item.unbind().hover(lang.hitch(this, function(){
                if(!base.isNull(data.c_LGTD) && !base.isNull(data.c_LTTD)){
                    //this._position(data);
                    this._showConnectLine(item, data);
                }
            }), lang.hitch(this, function(){
                //this._removePosition();
                this.connectLineLayer.clear();
                
            })).click(lang.hitch(this, function(e){
                if(this.preDiscoveryLocateCli && this.preDiscoveryLocateCli.c_ID == data.c_ID){
                    return;
                }
                
                if(!base.isNull(data.c_LGTD) && !base.isNull(data.c_LTTD)){
                    this._removePreDiscoveryLocate();
                    
                    this.preDiscoveryLocateCli = data;
                    this._addClient(this.preDiscoveryLocateCli, true);
                    $(e.currentTarget).addClass('active');
                    
                    this.locate(data, true);
                    
                    if($(this.domNode).hasClass('metaListShow')){
                        this._hideMetaList(true);
                    }
                    topic.publish('component/dataMonitor/widget/monitorMap/discoveryLocated');
                }
            }));
            
            //notice that 'unbind' is used above, init 'tooltip' after that action
            var cNM = base.subDescription(data.c_NM, 20);
            if(cNM.length < data.c_NM.length){
                item.children('span').text(cNM);
                item.tooltip({
                    animation: false,
                    container: 'body',
                    placement: 'auto top',
                    trigger: 'hover',
                    title: lang.hitch(this, function(e){
                        return data.c_NM;
                    })
                });
                
            }else{
                item.children('span').text(data.c_NM);
            }
        },
        
        _getConnectLineColor: function(){
            if(this.mapType == 'road'){
                return new Color('#6b6b6b');
            }else{
                return new Color('#fff');
            }
        },
        
        _showConnectLine: function(item, data){
            this.connectLineLayer.clear();
            
            var offset = item.offset();
            var pos1 = {
                x: parseInt(offset.left + (item.outerWidth() / 2)),
                y: offset.top - $(this.domNode).offset().top - parseInt(item.parent().css('padding-top'))
            };
            var screenPoint1 = new ScreenPoint(pos1.x, pos1.y);
            
            var mercator = this.map.toMap(screenPoint1);
            var lonlat = this.mercatorToLonlat(mercator);
            
            var point1 = new Point(lonlat.x, lonlat.y);
            var point2 = new Point(data.c_LGTD, data.c_LTTD);
            
            //line graphic
            var tmpSymbol = new CartographicLineSymbol(
                CartographicLineSymbol.STYLE_SOLID,
                this._getConnectLineColor(),
                1,
                CartographicLineSymbol.CAP_ROUND,
                CartographicLineSymbol.JOIN_ROUND
            );
            
            var polyline = new Polyline(this.spatialReference);
            polyline.addPath([point1, point2]);
            this.connectLineLayer.add(new Graphic(polyline, tmpSymbol));
            
            //endpoint
            var symbolPoint = new SimpleMarkerSymbol(
                SimpleMarkerSymbol.STYLE_CIRCLE, 
                7, 
                null,
                this._getConnectLineColor()
            );
            this.connectLineLayer.add(new Graphic(point2, symbolPoint));
        },
        
        _removePreDiscoveryLocate: function(){
            if(this.preDiscoveryLocateCli){
                this._removeClient(this.preDiscoveryLocateCli, true);
                this.preDiscoveryLocateCli = null;
                
                $(this.domNode).find('.discovery .discoveryContainer>a.active').removeClass('active');
            }
        },
        
        _createDiscoveryDetail: function(container, data){
            var imgUrl = base.isNull(data.uIcon)? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + data.uIcon);
            
            var imageIcon = data.hasImage? '<i class="fa fa-image"></i>' : '';
            var videoIcon = data.hasVideo? '<i class="fa fa-video-camera"></i>' : '';
            var tsDataIcon = data.hasTsData? '<i class="fa fa-line-chart"></i>' : '';
            var noneIcon = !data.hasImage && !data.hasVideo && !data.hasTsData? '暂无数据' : '';
            var starCls = data.starByCurrent? 'fa-star' : 'fa-star-o';
            
            container.html($('<div class="img"><img src="'+ imgUrl +'" title="'+ data.uNm +'"></div><span><i class="fa '+ starCls +'"></i> 关注 <span  class="starCount">'+ data.starCount + '</span></span><span>'+ (new Date(data.crtTs)).format('yyyy-MM-dd') +' 创建</span><span>'+ imageIcon + videoIcon + tsDataIcon + noneIcon + '</span>'));
        },
        
        _boundaryChanged: function(extent, defer){
            var bd = this.getBoundary();

            topic.publish('component/dataMonitor/widget/monitorMap/boundaryChanged', $.extend({defer: defer}, bd));
        },
        
        _setInfoWinTimeOut: function(){
            this.clearInfoWinTimeOut = setTimeout(lang.hitch(this, function(){
                this._hideInfoWindow();
            }), 1000);
        },
        
        _clearInfowWinTimeOut: function(){
            if(this.clearInfoWinTimeOut){
                clearTimeout(this.clearInfoWinTimeOut);
                this.clearInfoWinTimeOut = null;
            }
        },
        
        _hideInfoWindow: function(){
            this._clearInfowWinTimeOut();
            
            this.map.infoWindow.hide();
            this.currentInfoWin = null;
        },
        
        _openInfoWindow:function(client){
            if(this.currentInfoWin && this.currentInfoWin.c_ID == client.c_ID){
                return;
            }
            
            this.currentInfoWin = client;
            
            if(!this.clientPrevCard){
                this.clientPrevCard = new ClientPrevCard();
                this.map.infoWindow.setContent(this.clientPrevCard.domNode);
                
                this.clientPrevCard.startup();
                this.own(this.clientPrevCard);
                
                $(this.map.infoWindow.domNode).hover(lang.hitch(this, function(){
                    this._clearInfowWinTimeOut();
                    
                }), lang.hitch(this, function(){
                    this._setInfoWinTimeOut();
                }));
            }
            
            var data = this.prevCardDataMap[client.c_ID];
            if(data){
                this._refreshInfoWindowContent(client, data);
            }else{
                this.map.infoWindow.hide();
                
                this._ajaxPreViewInfo(client, lang.hitch(this, function(preViewData){
                    if(this.currentInfoWin && this.currentInfoWin.c_ID == client.c_ID){
                        this._refreshInfoWindowContent(client, preViewData);
                    }
                }));
            }
        },
        
        _ajaxPreViewInfo: function(client, callBack){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + "platformApi/own/client/normal/metadata/preview",
                data: {clientId: client.c_ID}
            }).success(lang.hitch(this, function(ret){
                //we get 'addTM'(for expiring) and 'star' field here.
                var data = $.extend(client, {addTM: (new Date()).getTime(), star: ret.data.star, metaInfo: ret.data.metaInfo});
                this.prevCardDataMap[client.c_ID] = data;
                
                if(callBack){
                    callBack(data);
                }
            }));
        },
        
        _refreshInfoWindowContent: function(client, data){
            this.clientPrevCard.refresh(data);
            
            this.map.infoWindow.show(new Point(client.c_LGTD, client.c_LTTD));
        },
        
        _refreshScrollBar: function(scrollObj, callBack){
            this.defer(function(){
                CustomScrollBar.update(scrollObj, 'x');
                
                if(callBack){
                    callBack();
                }
            }, 500);
        },
        
        _resetPosOnTransition: function(tranObj, scrollObj, x){
            tranObj.css('transition-duration', '0.2s').css('transition-timing-function', 'linear');
            tranObj.one('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                tranObj.off('webkitTransitionEnd transitionend');
                this._refreshScrollBar(scrollObj);
            }));
            tranObj.css('left', (parseInt(tranObj.css('left')) + x) + 'px');
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('component/dataMonitor/transition', lang.hitch(this, function(data){
                var discovery = $(this.domNode).find('.discovery');
                this._resetPosOnTransition(discovery, discovery.children('div:first-child'), data.x);
                
                var metaList = $(this.domNode).find('.metaList');
                this._resetPosOnTransition(metaList, metaList.find('.slcContainer'), data.x);
            }));
            var sub2 = topic.subscribe('component/dataMonitor/widget/monitorMap/locate', lang.hitch(this, function(data){
                this.locate(data, data.ignoreCenter);
                this.callLater(function(){
                    if($(this.domNode).hasClass('metaListShow')){
                        this._refreshMetaList(data);
                    }
                });
            }));
            var sub3 = topic.subscribe('component/dataMonitor/widget/monitorMap/position', lang.hitch(this, function(data){
                this.callLater(function(){
                    if(data){
                        this._position(data);
                    }else{
                        this._removePosition();
                    }
                });
            }));
            var sub4 = topic.subscribe('component/dataMonitor/widget/monitorMap/refreshClients', lang.hitch(this, function(data){
                this.clear();
                
                if(data && data.length>0){
                    this.callLater(function(){
                        this._showClients(data);
                    });
                }
            }));
            var sub5 = topic.subscribe('component/dataMonitor/widget/monitorMap/addClient', lang.hitch(this, function(data){
                if(data){
                    this.callLater(function(){
                        this._addClient(data);
                    });
                }
            }));
            var sub6 = topic.subscribe('component/dataMonitor/widget/monitorMap/removeClient', lang.hitch(this, function(data){
                this.callLater(function(){
                    this._removeClient(data);
                });
            }));
            var sub7 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleMetaList', lang.hitch(this, function(data){
                this.callLater(function(){
                    if(!$(this.domNode).hasClass('metaListShow') || (this.preMetaList && this.preMetaList.c_ID != data.c_ID)){
                        this._showMetaList(data);
                    }else{
                        this._hideMetaList(true);
                    }
                    
                    this.locate(data, true);
                });
            }));
            var sub7_1 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/hideMetaList', lang.hitch(this, function(data){
                this._hideMetaList(false);
            }));
            var sub8 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleStar', lang.hitch(this, function(data){
                this.callLater(function(){
                    var cliData = this.prevCardDataMap[data.c_ID];
                    if(cliData){
                        cliData.star = data.star;
                    }
                    
                    this._updateDiscoveryOnStar(data);
                });
            }));
            var sub9 = topic.subscribe('component/dataMonitor/widget/monitorMap/requireBoundary', lang.hitch(this, function(data){
                this.callLater(function(){
                    this._boundaryChanged(this.map.extent, false);
                });
            }));
            var sub10 = topic.subscribe('component/dataMonitor/widget/star/removeManual', lang.hitch(this, function(data){
                this.callLater(function(){
                    this._updateDiscoveryOnStar(data);
                });
            }));
            var sub11 = topic.subscribe('component/dataMonitor/widget/monitorMap/hideDiscovery', lang.hitch(this, function(data){
                this.callLater(function(){
                    $(this.domNode).find('.discovery').css('transition-duration', '0s');
                    $(this.domNode).removeClass('discoveryShow');
                    this._removePreDiscoveryLocate();
                });
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
            this.own(sub5);
            this.own(sub6);
            this.own(sub7);
            this.own(sub7_1);
            this.own(sub8);
            this.own(sub9);
            this.own(sub10);
            this.own(sub11);
        }
    });
});
