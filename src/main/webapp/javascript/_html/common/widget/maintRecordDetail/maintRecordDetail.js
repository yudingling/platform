
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    'root/timeLine/timeLine',
    'root/unitegallery/gallery',
    './widget/locationMap/locationMap',
    "dojo/text!./template/maintRecordDetail.html",
    "tool/css!./css/maintRecordDetail.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        TimeLine,
        Gallery,
        LocationMap, 
        template){
    
    return declare("common.widget.maintRecordDetail", [_Widget], {
        baseClass: "common_widget_maintRecordDetail",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.imgNodes = [];

            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._destroyLocationMap();
            this._destroyImages();
        },
        
        refresh: function(rec){
            if(rec != null){
                this._show(rec);
            }else{
                this._clear();
            }
        },
        
        ended: function(rec){
            $(this.domNode).find('.recDesc .exec').html(this._getRecordExecHtml(rec));
            
            this._showEnd(rec);
        },
        
        response: function(data){
            this._createResponseNode(data);
        },
        
        _initDom: function(){
            this.tl = new TimeLine($(this.domNode).children('.recTmLine'));
            this.own(this.tl);
        },
        
        _show: function(rec){
            var descParent = $(this.domNode).children('.recDesc');
            
            var spin = new Spin($(this.domNode));
            
            descParent.find('.crtNm').text(rec.maint_CRT_UNM);
            descParent.find('.crtTs').text((new Date(rec.crt_TS)).format('yyyy-MM-dd HH:mm'));
            descParent.find('.from').text(this._getRecordSourceHtml(rec));
            descParent.find('.exec').html(this._getRecordExecHtml(rec));
            descParent.find('.desc').text(rec.maint_DESC);
            
            this._clearTl();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/maint/normal/maintRecord/detail',
                data: {
                    maintId: rec.maint_ID,
                    getSelf: false
                }
            }).success(lang.hitch(this, function(ret){
                this._showClients(descParent, ret.data.clients);
                this._showDist(rec, ret.data.dist, ret.data.clients);
                this._showReceive(rec);
                this._showResponse(ret.data.response);
                this._showEnd(rec);
                
                spin.destroy();
                
            })).fail(lang.hitch(this, function(){
                this._clear();
                spin.destroy();
            }));
        },
        
        _showClients: function(descParent, clis){
            var clientNms = '';
            for(var i=0; i<clis.length; i++){
                clientNms += clis[i].c_NM + ', '
            }
            if(clientNms.length > 0){
                clientNms = clientNms.substr(0, clientNms.length - 2);
            }
            
            descParent.find('.clients').text(clientNms);
        },
        
        _showDist: function(rec, dist, clis){
            var areaNms = '', uNms = '';
            for(var i=0; i<dist.length; i++){
                var md = dist[i];
                if(md.mdist_U_ID){
                    uNms += '<span class="label label-info">' + md.mdist_U_NM + '</span>';
                    
                }else if(md.mdist_MA_ID){
                    areaNms += '<span class="label label-primary">' + (md.mdist_MA_ID == '-1'? '默认' : md.mdist_MA_NM) + '</span>';
                }
            }
            
            //distribute to a maintenance user get an higher priority than area
            var str = '';
            if(uNms.length > 0){
                str = '分发给运维人员：' + uNms;
                
            }else if(areaNms.length > 0){
                str = '分发至运维区域：' + areaNms;
            }
            
            var ts = (new Date(rec.crt_TS)).format('MM/dd HH:mm');
            var contentNode = $('<div><span class="unm">' + rec.maint_CRT_UNM + '</span> 创建工单，并' + str + '<div style="width: 100%; margin-top: 5px;"></div></div>');
            
            this.tl.append(ts, 'wait', '创建工单', contentNode);
            
            this._createLocationMap(contentNode.find('div'), clis);
        },
        
        _showReceive: function(rec){
            if(rec.maint_STATUS != 0 && rec.maint_ACT_UID){
                var ts = (new Date(rec.maint_ACT_TS)).format('MM/dd HH:mm');
                var content = $('<div><span class="unm">' + rec.maint_ACT_UNM + '</span> 接收工单，开始处理</div>');
                
                this.tl.append(ts, 'execute', '运维人员接单', content);
            }
        },
        
        _showResponse: function(resp){
            if(resp.length > 0){
                for(var i=0; i<resp.length; i++){
                    this._createResponseNode(resp[i]);
                }
            }
        },
        
        _showEnd: function(rec){
            if(rec.maint_STATUS == 2){
                var ts = (new Date(rec.maint_END_TS)).format('MM/dd HH:mm');
                var content = $('<div><span class="unm">' + rec.maint_END_UNM + '</span> 结束工单</div>');
                
                this.tl.append(ts, 'ended', '工单结束', content);
            }
        },
        
        _createResponseNode: function(curResp){
            var ts = (new Date(curResp.crt_TS)).format('MM/dd HH:mm');
            var content = $('<div>');
            this.tl.append(ts, 'execute', '运维反馈', content);

            if(curResp.mr_CONTENT && curResp.mr_CONTENT.length > 0){
                content.append($('<span>').text(curResp.mr_CONTENT));
            }

            if(curResp.urls && curResp.urls.length > 0){
                var imgParent = $('<div style="width: 100%; margin-top: 5px;">');
                content.append(imgParent);
                
                this._createImgNode(imgParent, curResp.urls);
            }
        },
        
        _createImgNode: function(parent, data){
            var nodes = [];
            for(var i=0; i<data.length; i++){
                nodes.push($('<img src="'+ data[i] +'" data-image="'+ data[i] +'">'));
            }
            
            parent.append(nodes);
            
            var options = {
				gallery_height: 200,
                slider_enable_zoom_panel: false,
                gallery_preserve_ratio: false,
                theme_enable_play_button: false,
                slider_enable_play_button: false,
                slider_controls_always_on: false,
                gallery_theme: 'compact',
                theme_panel_position: 'right',
                slider_fullscreen_button_offset_hor: 11,
                strippanel_enable_buttons: true,
                strip_control_avia: false,
                slider_scale_mode: 'fit'
            };
            
            this.imgNodes.push(new Gallery(parent, options));
        },
        
        _getRecordSourceHtml: function(data){
            return base.isNull(data.wrn_ID)? '人工产生' : '设备告警';
        },
        
        _getRecordExecHtml: function(data){
            if(data.maint_STATUS == 0){
                return '待处理';
                
            }else if(data.maint_STATUS == 1){
                return '<span class="unm">' + data.maint_ACT_UNM + '</span> 处理中，已耗时 <span>' + this._getTimePeriodStr(data) + '</span>';
            
            }else{
                if(data.maint_ACT_UID){
                    return '<span class="unm">' + data.maint_ACT_UNM + '</span> 已处理，耗时 <span>' + this._getTimePeriodStr(data) + '</span>';
                }else{
                    return '未处理';
                }
            }
        },
        
        _getTimePeriodStr: function(data){
            var endTs;
            if(data.maint_STATUS == 1){
                endTs = (new Date()).getTime();
            }else{
                endTs = data.maint_END_TS;
            }
            
            var diffMs = endTs - data.maint_ACT_TS;

            var tmLen = parseInt(diffMs / 3600000);
            if(tmLen < 1){
                tmLen = 0.5;
            }

            var tmDesc = '';
            if(tmLen <= 1){
                var minLen = parseInt(diffMs / 60000);
                if(minLen < 1){
                    minLen = 1;
                }

                tmDesc = minLen + '分钟';
            }else if(tmLen <= 24){
                tmDesc = tmLen + '小时';
            }else if(tmLen <= 168){
                tmDesc = parseInt(tmLen / 24) + '天';
            }else if(tmLen <= 720){
                tmDesc = parseInt(tmLen / 168) + '周';
            }else{
                tmDesc = parseInt(tmLen / 720) + '月';
            }

            return tmDesc;
        },
        
        _createLocationMap: function(mapDiv, clis){
            var center = [76.016, 44.159]
            if(clis.length > 0){
                if(!base.isNull(clis[0].c_LGTD) && !base.isNull(clis[0].c_LTTD)){
                    center = [clis[0].c_LGTD, clis[0].c_LTTD];
                }
            }
            
            this.map = new LocationMap({center: center, zoom: 5, toolboxPos: 1});
            mapDiv.append($(this.map.domNode));
            this.map.startup();
            
            this.defer(lang.hitch(this, function(){
                this.map.resize();
                
                this.map.refresh(clis);
                
            }), 500);
        },
        
        _destroyLocationMap: function(){
            if(this.map){
                this.map.destroyRecursive();
                this.map = null;
            }
        },
        
        _destroyImages: function(){
            for(var i=0; i<this.imgNodes.length; i++){
                this.imgNodes[i].destroy();
            }
            
            this.imgNodes = [];
        },
        
        _clear: function(){
            $(this.domNode).find('lblForVal').text('');
            
            this._clearTl();
        },
        
        _clearTl: function(){
            this._destroyLocationMap();
            this._destroyImages();
            
            this.tl.clear();
        },
        
        _initEvents: function(){
        }
    });
});
