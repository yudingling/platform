define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    "root/brandHref/BrandHref",
    "root/lvbPlayer/aliPlayer/AliPlayer",
    "dojo/text!./template/search.html",
    "tool/css!./css/search.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        BrandHref,
        LvbPlayer,
        template){
    
    return declare("component.dataMonitor.widget.search", [_Widget], {
        baseClass: "component_dataMonitor_widget_search",
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
                CustomScrollBar.init($(this.domNode).find('.listContainer'), 'y', lang.hitch(this, function(){
                    this._getMore();
                }));
                
            }), 500);
            
        },
        
        destroy: function(){
        	this.inherited(arguments);
        	
            this._destroyBrand();
            this._destroyPlayer();
            
            $(this.domNode).find('.listContainer .list-group>.list-group-item div>div.img, td.noSysMeta, span.metaLatest i').tooltip('destroy');
            
        	topic.publish('component/dataMonitor/widget/monitorMap/refreshClients');
        },
        
        refresh: function(txt){
            this.searchTxt = txt;
            
            topic.publish('component/dataMonitor/widget/monitorMap/requireBoundary');
        },
        
        _initDom: function(){
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            topic.publish('component/dataMonitor/widget/monitorMap/refreshClients');
            
            this.loadedDataMap = {};
            this.startIndex = 0;
            var children = node.children();
            
            this._destroyBrand();
            this._destroyPlayer();
            
            //data attribute is used on 'single' mode 
            node.removeAttr('data');
            
            if(base.isNull(newCount) || newCount == 0){
                node.removeClass('list-group').addClass('single');
                children.remove();
                
            }else{
                if(node.hasClass('single')){
                    children.remove();
                }else{
                    if(children.length > newCount){
                        for(var i=newCount; i<children.length; i++){
                            $(children[i]).remove();
                        }
                    }
                }
                
                node.removeClass('single').addClass('list-group');
            }
            
            node.find('.list-group-item div>div.img').tooltip('destroy');
            node.find('.list-group-item.active').removeClass('active');
            
            this._removeGetMoreHref(node);
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
                    search: this.searchTxt_Inner
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
                        
                        this.loadedDataMap[cid] = dataList[i];
                    }
                }
                
                this._addGetMoreHref(parent, dataList.length >= this.fetchSize);
                
                this._loadDetail(ids, parent, lang.hitch(this, function(){
                    this.defer(lang.hitch(this, function(){
                        CustomScrollBar.scrollTo($(this.domNode).find('.customscrollbar'), '-=90');
                    }), 600);
                }));
                
            })).fail(function(){
                wait.remove();
            });
        },
        
        _appendData: function(boundary){
            if(!this.searchTxt){
                return;
            }
            
            this.boundary = boundary;
            this.searchTxt_Inner = this.searchTxt;
            
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
                var parent = $(this.domNode).find('.listContainer .listSlc');
                
                if(dataList.length <= 1){
                    this._setDataForSingle(parent, dataList);
                }else{
                    this._setDataForMulit(parent, dataList);
                }
                
                topic.publish('component/dataMonitor/searchFinished');
                
            })).fail(function(){
                this._setDataForSingle(parent, []);
                topic.publish('component/dataMonitor/searchFinished');
            });
            
            //execute once for each search
            this.searchTxt = null;
        },
        
        _getImgUrl: function(data){
            return base.isNull(data.uIcon)? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + data.uIcon);
        },
        
        _setDataForSingle: function(parent, dataList){
            this._clear(parent, 0);
            
            if(dataList.length == 0){
                parent.html('<span class="empty">未搜索到相关数据<span>');
            }else{
                topic.publish('component/dataMonitor/widget/monitorMap/addClient', dataList[0]);
                topic.publish('component/dataMonitor/widget/monitorMap/locate', dataList[0]);
                
                this.loadedDataMap[dataList[0].c_ID] = dataList[0];
                
                this._loadDetail([dataList[0].c_ID], parent);
            }
        },
        
        _setDataForMulit: function(parent, dataList){
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
                    
                    this.loadedDataMap[cid] = dataList[i];
                }
            }

            this._addGetMoreHref(parent, dataList.length >= this.fetchSize);

            this._loadDetail(ids, parent);
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
            var isSingle = parent.hasClass('single');
            
            for(var i=0; i<data.length; i++){
                
                if(isSingle){
                    this._createDetailSingle(parent, data[i]);
                }else{
                    var node = parent.find('.list-group-item[data="'+ data[i].cid +'"]>div');
                    if(node.length > 0){    
                        this._createDetailMulti(node, data[i]);
                    }
                }
                
                if(isSetCache){
                    this.detailMap[data[i].cid] = data[i];
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
        
        _createDetailMulti: function(container, data){
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
            
            container.html($('<div class="img"><img src="'+ this._getImgUrl(data) +'"></div><span><i class="fa '+ starCls +'"></i> 关注 <span  class="starCount">'+ data.starCount + '</span>' + tagStr + '</span><span>'+ (new Date(data.crtTs)).format('yyyy-MM-dd') +' 创建</span><span>'+ imageIcon + videoIcon + tsDataIcon + noneIcon + lastestStr + '</span>'));
            
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
        
        _createDetailSingle: function(container, data){
            container.attr('data', data.cid);
            
            var maxValLen = 30;
            var tagStr = '';
            for(var i=0; i<data.tags.length; i++){
                tagStr += '<span class="label label-primary"><i class="fa fa-tag"></i>'+ base.subDescription(data.tags[i], maxValLen) +'</span>';
            }
            
            var imageIcon = data.hasImage? '<i class="fa fa-image"></i>' : '';
            var videoIcon = data.hasVideo? '<i class="fa fa-video-camera"></i>' : '';
            var tsDataIcon = data.hasTsData? '<i class="fa fa-line-chart"></i>' : '';
            var noneIcon = !data.hasImage && !data.hasVideo && !data.hasTsData? '暂无数据' : '';
            
            var starCls = data.starByCurrent? 'fa-star' : 'fa-star-o';
            
            container.append($('<span>' + base.subDescription(data.cnm, 42) + '</span><div class="img"><img src="'+ this._getImgUrl(data) +'"></div><span class="star"><i class="fa '+ starCls +'"></i> 关注 <span  class="starCount">'+ data.starCount + '</span></span><span>'+ (new Date(data.crtTs)).format('yyyy-MM-dd') +' 创建</span><span class="metaIcon">'+ imageIcon + videoIcon + tsDataIcon + noneIcon + '</span>'));
            
            if(tagStr.length > 0){
                container.append($('<div class="tag">'+ tagStr +'</div>'));
            }
            
            container.find('div.img').tooltip({
                container: 'body',
                placement: 'auto bottom',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip" style="margin-top: 0px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                title: lang.hitch(this, function(e){
                    return data.uNm;
                })
            });
            
            //brand
            if(data.uId == base.getUid()){
                this._destroyBrand();
                
                this.brand = new BrandHref(container);
                if(data.public){
                    this.brand.setInfo('公开', '#28bacb');
                }else{
                    this.brand.setInfo('私有', '#bbb');
                }
            }
            
            //metadata preview data
            this._getMetaPreviewInfo(container, data.cid);
        },
        
        _destroyBrand: function(){
            if(this.brand){
                this.brand.destroy();
                this.brand = null;
            }
        },
        
        _getMetaPreviewInfo: function(parent, cid){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + "platformApi/own/client/normal/metadata/preview",
                data: {clientId: cid}
            }).success(lang.hitch(this, function(ret){
                this._showPreviewInfo(parent, cid, ret.data)
            }));
        },
        
        _showPreviewInfo: function(parent, cid, data){
            var metaInfo = data.metaInfo;
            var firstImage = null;
            var firstVideo = null;
            var imageCount = 0, videoCount = 0;
            var hasNumeric = false;
            
            parent.append('<span class="metaLatest">最新数据<i class="fa fa-expand"></i></span>');
            parent.find('span.metaLatest i').tooltip({
                container: 'body',
                placement: 'auto right',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip" style="margin-left: 0px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                title: '详细数据'
            });
            
            var trStr = "";
            for(var i=0; i<metaInfo.length; i++){
                
                if(metaInfo[i].preview_TP == 'image'){
                    if(!firstImage && !base.isNull(metaInfo[i].latest_IMG_ID)){
                        firstImage = metaInfo[i];
                    }
                    imageCount++;
                }else if(metaInfo[i].preview_TP == 'video'){
                    if(!firstVideo && !base.isNull(metaInfo[i].latest_VIDEO_URL)){
                        firstVideo = metaInfo[i];
                    }
                    videoCount++;
                }else if(metaInfo[i].preview_TP == 'numeric'){
                    var unit = metaInfo[i].meta_UNIT? metaInfo[i].meta_UNIT : '';
                    
                    var ltm = base.isNull(metaInfo[i].latest_TM)? '--' : metaInfo[i].latest_TM;
                    var val = (base.isNull(metaInfo[i].latest_TM) || base.isNull(metaInfo[i].latest_VAL))? 
                        '--' : (metaInfo[i].latest_VAL + ' ' + unit);
                    
                    var tdCls = base.isNull(metaInfo[i].sysmeta_ID) ? 'class="noSysMeta"' : '';
                    
                    trStr += '<tr><td '+ tdCls +'>' + this._getMetaName(metaInfo[i]) + '</td><td style="width: 80px">' + val + '</td><td style="width: 120px;">' + ltm + '</td></tr>';
                    hasNumeric = true;
                }
            }
            
            if(trStr.length > 0){
                parent.append('<table class="numeric">' + trStr + '</table>');
            }
            
            parent.find('td.noSysMeta').tooltip({
                container: 'body',
                placement: 'auto right',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip" style="margin-left: 0px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
                title: '未设置系统元数据映射'
            });
            
            if(firstVideo){
                //make img/stream vertical-middle, the div has css 'display: table-cell', that depends on table's fixed width 
                var str = '<tr><td class="metaVideo"><div style="display: block"></div></td></tr>';
                
                if(videoCount > 1){
                    str += '<tr><td><span>当前：'+ base.subDescription(this._getMetaName(firstVideo), 40) +'</span><a class="more" href="javascript:void(0);">更多</a></td></tr>';
                }else{
                    str += '<tr><td><span>当前：'+ base.subDescription(this._getMetaName(firstVideo), 40) +'</span></td></tr>';
                }
                
                parent.append('<table class="stream">'+ str +'</table>');
                
                this.player = new LvbPlayer(
                    parent.find('.metaVideo>div'), 
                    firstVideo.latest_VIDEO_URL, 
                    firstVideo.latest_VIDEO_URL_MOBILE, 
                    firstVideo.latest_VIDEO_SCREENSHOT);
            }
            
            if(firstImage){
                var url = base.getServerNM('file') + 'fileApi/own/stream?fileId=' + firstImage.latest_IMG_ID;
                var str = '<tr><td class="metaImage"><div><img src="' + url + '"></img></div></td></tr>';
                
                if(imageCount > 1){
                    str += '<tr><td><span>当前：'+ base.subDescription(this._getMetaName(firstImage), 32) + '&nbsp;&nbsp;' + firstImage.latest_TM +'<a  class="more" href="javascript:void(0);">更多</a></span></td></tr>';
                }else{
                    str += '<tr><td><span>当前：'+ base.subDescription(this._getMetaName(firstImage), 32) + '&nbsp;&nbsp;' + firstImage.latest_TM +'</span></td></tr>';
                }
                
                parent.append('<table class="stream">'+ str +'</table>');
            }
            
            parent.find('span.metaLatest i, td a.more').click(lang.hitch(this, function(){
                topic.publish('component/dataMonitor/metaShowExpand', $.extend({}, this.loadedDataMap[cid], data));
            }));
        },
        
        _destroyPlayer: function(){
            if(this.player){
                this.player.destroy();
                this.player = null;
            }
        },
        
        _getMetaName: function(meta){
            return meta.meta_NM && meta.meta_NM.length>0? meta.meta_NM : meta.meta_CID
        },
        
        _updateOnStar: function(client){
            var parent = $(this.domNode).find('.listContainer .listSlc');
                
            if(parent.hasClass('list-group')){
                var node = parent.find('.list-group-item[data="'+ client.c_ID +'"]>div');

            }else{
                if(parent.attr('data') == client.c_ID){
                    node = parent;
                }
            }

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
        },

        _initEvents: function(){
            var sub1 = topic.subscribe('component/dataMonitor/widget/monitorMap/boundaryChanged', lang.hitch(this, function(boundary){
                this._appendData(boundary);
            }));
            
            var sub2 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleStar', lang.hitch(this, function(client){
                this._updateOnStar(client);
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
