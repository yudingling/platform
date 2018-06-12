define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    "../searchBox/searchBox",
    "dojo/text!./template/discovery.html",
    "tool/css!./css/discovery.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        SearchBox,
        template){
    
    return declare("component.dataMonitor.widget.discovery", [_Widget], {
        baseClass: "component_dataMonitor_widget_discovery",
        templateString: template,
        
        constructor: function (args) {
            this.startIndex = 0;
            this.fetchSize = 8;
            this.loadedDataMap = {};
            this.detailMap = {};
            
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customscrollbar'), 'y', lang.hitch(this, function(){
                    this._getMore();
                }));
                
            }), 500);
            
            topic.publish('component/dataMonitor/menuResultShown');
            
            topic.publish('component/dataMonitor/widget/monitorMap/hideDiscovery');
            topic.publish('component/dataMonitor/widget/monitorMap/requireBoundary');
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._clearBoundaryChangedTO();
        	
            $(this.domNode).find('.listContainer .list-group>.list-group-item div>div.img').tooltip('destroy');
            
        	topic.publish('component/dataMonitor/widget/monitorMap/refreshClients');
        },
        
        _initDom: function(){
            this.searchBox = new SearchBox({
                showMenu: false,
                placeholder: '探索发现',
                search: lang.hitch(this, function(txt){
                    this.searchTxt = txt;
                    topic.publish('component/dataMonitor/widget/monitorMap/requireBoundary');
                }),
                remove: lang.hitch(this, function(){
                    this.searchTxt = null;
                })
            });
            $(this.domNode).find('.discoverySearch>div').append($(this.searchBox.domNode));
            this.searchBox.startup();
            this.own(this.searchBox);
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            topic.publish('component/dataMonitor/widget/monitorMap/refreshClients');
            
            this.loadedDataMap = {};
            this.startIndex = 0;
            
            node.find('.list-group-item div>div.img').tooltip('destroy');
            node.find('.list-group-item.active').removeClass('active');
            
            this._removeGetMoreHref(node);
            
            var children = node.children();
            if(base.isNull(newCount) || newCount == 0){
                children.remove();
            }else if(children.length > newCount){
                for(var i=newCount; i<children.length; i++){
                    $(children[i]).remove();
                }
            }
        },
        
        _getMore: function(){
            if(!this.boundary){
                return;
            }
            
            var parent = $(this.domNode).find('.listContainer .list-group');
            var wait = parent.find('a.getMore');
            
            if(wait.hasClass('finished')){
                return;
            }
            
            wait.removeClass('hvr-hang');
            wait.find('i.fa').removeClass('fa-angle-double-down').addClass('fa-spinner fa-spin');
            
            CustomScrollBar.scrollTo($(this.domNode).find('.customscrollbar'), 'bottom');
            
            base.ajax({
                url: base.getServerNM() + "platformApi/own/client/normal/discovery",
                type: 'GET',
                data: $.extend({
                    startIndex: this.startIndex, 
                    length: this.fetchSize,
                    search: this.searchTxt
                }, this.boundary)
            }).success(lang.hitch(this, function(ret){
                
                this._removeGetMoreHref(parent);
                
                var dataList = ret.data;
                var ids = [];
                this.startIndex += dataList.length;
                
                for(var i=0; i<dataList.length; i++){
                    var cid = dataList[i].c_ID;
                    
                    if(!this.loadedDataMap[cid]){
                        ids.push(cid);
                        this._createItem(-1, parent, dataList[i]);
                        
                        topic.publish('component/dataMonitor/widget/monitorMap/addClient', dataList[i]);

                        this.loadedDataMap[cid] = cid;
                    }
                }
                
                this._addGetMoreHref(parent, dataList.length >= this.fetchSize);
                
                this._loadDetail(ids, parent, lang.hitch(this, function(){
                    this.defer(lang.hitch(this, function(){
                        CustomScrollBar.scrollTo($(this.domNode).find('.customscrollbar'), '-=90');
                    }), 600);
                }));
                
                this.searchBox.finish();
                
            })).fail(function(){
                wait.remove();
            });
        },
        
        _appendData: function(boundary){
            this.boundary = boundary;
            var parent = $(this.domNode).find('.listContainer .list-group');
            
            base.ajax({
                url: base.getServerNM() + "platformApi/own/client/normal/discovery",
                type: 'GET',
                data: $.extend({
                    startIndex: 0, 
                    length: this.fetchSize,
                    search: this.searchTxt
                }, this.boundary)
            }).success(lang.hitch(this, function(ret){
                var dataList = ret.data;
                
                this._clear(parent, dataList.length);
                
                var ids = [];
                this.startIndex += dataList.length;
                
                var index = 0;
                for(var i=0; i<dataList.length; i++){
                    var cid = dataList[i].c_ID;
                    
                    if(!this.loadedDataMap[cid]){
                        ids.push(cid);
                        this._createItem(index++, parent, dataList[i]);

                        topic.publish('component/dataMonitor/widget/monitorMap/addClient', dataList[i]);

                        this.loadedDataMap[cid] = cid;
                    }
                }
                
                this._addGetMoreHref(parent, dataList.length >= this.fetchSize);
                
                this._loadDetail(ids, parent);
                
                this.searchBox.finish();
                
            })).fail(lang.hitch(this, function(ret){
                this._clear(parent, 0);
            }));
        },
        
        _addGetMoreHref: function(parent, hasMore){
            if(hasMore){
                parent.append($('<a href="javascript:void(0);" class="getMore hvr-hang" title="点击/向下滚动获取更多"><div><i class="fa fa-angle-double-down fa-2x"></i></div></a>').click(lang.hitch(this, function(){
                    this._getMore();
                })));
                
            }else{
                parent.append($('<a href="javascript:void(0);" class="getMore finished"><div>暂无更多数据</div></a>'));
            }
        },
        
        _removeGetMoreHref: function(parent){
            parent.find('a.getMore').remove();
        },
        
        _loadDetail: function(ids, parent, callBack){
            if(ids.length > 0){
                var cachedList = [], ajaxIds = [];
                
                for(var i=0; i<ids.length; i++){
                    var cached = this.detailMap[ids[i]];
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
                        
                        if(callBack){
                            callBack();
                        }
                    }));
                    
                }else{
                    this._loadDetailDefer(parent, cachedList, false);
                    if(callBack){
                        callBack();
                    }
                }
            }
        },
        
        _loadDetailDefer: function(parent, data, isSetCache){
            for(var i=0; i<data.length; i++){
                var node = parent.find('.list-group-item[data="'+ data[i].cid +'"]>div');
                if(node.length > 0){
                    this._createDetail(node, data[i]);

                    if(isSetCache){
                        this.detailMap[data[i].cid] = data[i];
                    }
                }
            }
        },
        
        _createItem: function(i, parent, data){
            var item = i>=0? parent.children(':nth-child('+ (i+1) +')') : null;
            
            if(item && item.length > 0){
                item.attr('data', data.c_ID);
                
            }else{
                item = $('<a href="javascript:void(0);" data="'+ data.c_ID +'" class="list-group-item"><span></span><div></div></a>');
                parent.append(item);
            }
            
            var cNM = base.subDescription(data.c_NM, 42);
            if(cNM.length < data.c_NM.length){
                item.children('span').text(cNM);
                item.attr('title', data.c_NM);
            }else{
                item.children('span').text(data.c_NM);
            }
            
            item.unbind().hover(lang.hitch(this, function(){
                if(!base.isNull(data.c_LGTD) && !base.isNull(data.c_LTTD)){
                    topic.publish('component/dataMonitor/widget/monitorMap/position', data);
                }
            }), lang.hitch(this, function(){
                topic.publish('component/dataMonitor/widget/monitorMap/position');
                
            })).click(lang.hitch(this, function(e){
                var self = $(e.currentTarget);
                if(!self.hasClass('active')){
                    parent.find('a.list-group-item').removeClass('active');
                    self.addClass('active');
                    
                    if(!base.isNull(data.c_LGTD) && !base.isNull(data.c_LTTD)){
                        //should not center the map(that will fire extend_changed event and reset the data)
                        topic.publish('component/dataMonitor/widget/monitorMap/locate', $.extend({}, data, {ignoreCenter: true}));
                    }
                }
            }));
        },
        
        _createDetail: function(container, data){
            var imgUrl = base.isNull(data.uIcon)? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + data.uIcon);
            
            var maxValLen = 30;
            var tagStr = '', tagPreStr = '', tagValStr = '';
            for(var i=0; i<data.tags.length; i++){
                tagValStr += data.tags[i];
                tagPreStr += '<span class="label label-warning '+ (i==0? 'first' : '') +'"><i class="fa fa-tag"></i>'+ base.subDescription(data.tags[i], maxValLen) +'</span>';
                
                if(base.asciiLength(tagValStr) > maxValLen){
                    if(i == 0){
                        tagStr = tagPreStr;
                    }else{
                        tagStr += '<span class="label label-warning">..</span>';
                    }
                    
                    break;
                }
                
                tagStr = tagPreStr;
            }
            
            var imageIcon = data.hasImage? '<i class="fa fa-image"></i>' : '';
            var videoIcon = data.hasVideo? '<i class="fa fa-video-camera"></i>' : '';
            var tsDataIcon = data.hasTsData? '<i class="fa fa-line-chart"></i>' : '';
            var noneIcon = !data.hasImage && !data.hasVideo && !data.hasTsData? '暂无数据' : '';
            var lastestStr = !base.isNull(data.latestTs)? ('<em class="latestTM">最近数据 '+ (new Date(data.latestTs)).format('MM/dd HH:mm') +'</em>') : '';
            var starCls = data.starByCurrent? 'fa-star' : 'fa-star-o';
            
            container.html($('<div class="img"><img src="'+ imgUrl +'"></div><span><i class="fa '+ starCls +'"></i> 关注 <span  class="starCount">'+ data.starCount + '</span>' + tagStr + '</span><span>'+ (new Date(data.crtTs)).format('yyyy-MM-dd') +' 创建</span><span>'+ imageIcon + videoIcon + tsDataIcon + noneIcon + lastestStr + '</span>'));
            
            container.find('div.img').tooltip({
                container: 'body',
                placement: 'auto right',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip" style="margin-left: 0px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                title: lang.hitch(this, function(e){
                    return data.uNm;
                })
            });
            
            //defer is needed
            this.defer(function(){
                container.css('height', '61px').css('opacity', 1);
            }, 50);
        },
        
        _clearBoundaryChangedTO: function(){
            if(this.boundaryChangedTO){
                clearTimeout(this.boundaryChangedTO);
                this.boundaryChangedTO = null;
            }
        },

        _initEvents: function(){
            var sub1 = topic.subscribe('component/dataMonitor/widget/monitorMap/boundaryChanged', lang.hitch(this, function(boundary){
                this._clearBoundaryChangedTO();
                
                if(boundary.defer){
                    this.boundaryChangedTO = setTimeout(lang.hitch(this, function(){
                        this._appendData(boundary);
                    }), 800);
                }else{
                    this._appendData(boundary);
                }
                
            }));
            var sub2 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleStar', lang.hitch(this, function(client){
                var node = $(this.domNode).find('.listContainer .list-group .list-group-item[data="'+ client.c_ID +'"]>div');
                if(node.length > 0){
                    var spanStarCount = node.find('span.starCount');
                    var count = parseInt(spanStarCount.html());
                    
                    var cache = this.detailMap[client.c_ID];
                    
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
            }));
            var sub3 = topic.subscribe('component/dataMonitor/widget/monitorMap/discoveryLocated', lang.hitch(this, function(data){
                $(this.domNode).find('.listContainer .list-group a.list-group-item.active').removeClass('active');
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});
