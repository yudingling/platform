
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/echarts/echarts.min',
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/myCreated.html",
    "tool/css!./css/myCreated.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        echarts,
        CustomScrollBar,
        template){
    
    return declare("component.my3rd.widget.myCreated", [_Widget], {
        baseClass: "component_my3rd_widget_myCreated",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.statisticMap = {};
            this.chartMap = {};
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).children('.customScrollBar'));
                
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.svItem *[title], .svItem .status, .svItem .reliable').tooltip('destroy');
            
            for(var key in this.chartMap){
                this.chartMap[key].dispose();
            }
            
            this._destroyEditor();
        },
        
        _initDom: function(){
        },
        
        _setData: function(){
            var svContainer = $(this.domNode).find('.svContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/mineList'
            }).success(lang.hitch(this, function(ret){
                this.isRNA = ret.data.isRNA;
                
                var data = ret.data.list;
                
                if(data.length > 0){
                    for(var i=0; i<data.length; i++){
                        this._createItem(svContainer, data[i]);
                    }
                }else{
                    svContainer.append('<div class="empty">暂无更多数据!</div>');
                }
                
            })).fail(lang.hitch(this, function(){
                svContainer.append('<div class="empty">获取数据失败!</div>');
            }));
        },
        
        _createItem: function(parent, data, insertTop){
            var item = parent.find('.svItem[tpsId="'+ data.tps_ID +'"]');
            if(item.length == 0){
                var clsTg = 'cls_' + base.uuid();
            
                var strTmp = '<div class="svItem">'
                    +   '<div>'
                    +       '<img>'
                    +       '<div>'
                    +           '<div><span class="tpsNM" style="font-weight: bold;"></span></div>'
                    +           '<div style="margin-top: 5px;"><span>创建于</span><span class="crtTs" style="margin-left: 3px;"></span></div>'
                    +           '<div style="margin-top: 5px;"><span class="status" style="display: none;"><i class="fa"></i><span style="margin-left: 5px">审核中</span></span></div>'
                    +           '<div style="margin-top: 5px;"><span class="reliable" style="display: none;"><i class="fa"></i><span style="margin-left: 5px">已认证</span></span></div>'
                    +           '<div style="margin-top: 10px; color: #9c9c9c"><span class="feeStr"></span></div>'
                    +           '<div style="margin-top: 5px; color: #9c9c9c"><span title="用户数"><i class="fa fa-user"></i><span class="usedCount" style="margin-left: 5px"></span></span><span class="profit" title="收益" style="margin-left: 20px"></span></div>'
                    +           '<div class="svCmd"><a href="javascript:void(0);" data-toggle="collapse" aria-expanded="false" data-target=".'+ clsTg +'">时段统计</a><a href="javascript:void(0);" class="edit" style="margin-left: 10px;">编辑</a><a href="javascript:void(0);" class="postStatus" style="margin-left: 10px; display: none">申请审核</a><a href="javascript:void(0);" class="postReliable" style="margin-left: 10px; display: none">申请认证</a></div>'
                    +       '</div>'
                    +   '</div>'
                    +   '<div class="collapse '+ clsTg +'">'
                    +       '<div class="chart"></div>'
                    +       '<div style="color: #9c9c9c; padding-left: 35px; padding-top: 5px"><span>总访问次数：</span><span class="callCount"></span></div>'
                    +   '</div></div>';

                item = $(strTmp).data('data', data).attr('tpsId', data.tps_ID);
                if(insertTop){
                    parent.prepend(item);
                }else{
                    parent.append(item);
                }
                
                item.find('*[title]').tooltip({
                    container: 'body',
                    placement: 'auto bottom',
                    trigger: 'hover'
                });
                
            }else{
                item.data('data', data);
            }
            
            item.find('img').attr('src', base.getServerNM('file') + 'fileApi/own/3rdService?fileId=' + data.tps_IMG);
            
            item.find('.tpsNM').text(data.tps_NM);
            item.find('.crtTs').text((new Date(data.crt_TS)).format('yyyy-MM-dd'));
            
            //status setting
            this._statusSet(item, data);
            
            //reliable setting
            this._reliableSet(item, data);
            
            item.find('.feeStr').text(this._getFeeString(data));
            item.find('.usedCount').text(data.tps_USED);
            
            if(parseInt(data.fee_TP) == 0){
                item.find('.profit').hide();
            }else{
                item.find('.profit').show().text('￥' + data.tps_PROFIT);
            }
            
            var tpsStatus = parseInt(data.tps_STATUS);
            item.find('.collapse').off('shown.bs.collapse').on('shown.bs.collapse', lang.hitch(this, function(){
                if(tpsStatus != -1){
                    this._showCallStatistic(item, data);
                }
            }));
            
            var editNode = item.find('a.edit').unbind();
            if(base.isMobileDevice()){
                editNode.hide();
                
            }else{
                if(tpsStatus != -1){
                    editNode.click(lang.hitch(this, function(){
                        this._edit(data);
                    }));

                }else{
                    editNode.hide();
                    item.find('a[data-toggle]').hide();
                }
            }
        },
        
        _statusSet: function(item, data){
            var tpsStatus = parseInt(data.tps_STATUS);
            
            var statusNode = item.find('.status');
            var statusSpan = statusNode.find('span');
            var statusFa = statusNode.find('i.fa');
            var postStatus = item.find('.postStatus');
            
            if(tpsStatus == -1){
                statusNode.show();
                statusSpan.text('被禁用');
                statusFa.addClass('fa-ban').css('color', '#ec4758');
                
            }else if(tpsStatus == 0){
                statusNode.show();
                
                if(data.reviewInfo){
                    if(data.reviewInfo.rv_RESULT == 0){
                        statusSpan.text('审核中');
                        statusFa.addClass('fa-clock-o').css('color', '#f7a54a');

                    }else if(data.reviewInfo.rv_RESULT == 2){
                        statusSpan.text('审核失败');
                        statusFa.addClass('fa-info-circle').css('color', '#ec4758');

                        var reviewStr = this._getCheckRetString('审核结果', data.reviewInfo.upt_TS, data.reviewInfo.rv_INFO);

                        statusNode.tooltip({
                            container: 'body',
                            placement: 'auto bottom',
                            trigger: 'hover',
                            animation: false,
                            html: true,
                            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width: 300px"></div></div>',
                            title: function(){
                                return reviewStr;
                            }
                        }).css('cursor', 'pointer');
                        
                        postStatus.show().click(lang.hitch(this, function(){
                            this._postStatus(postStatus, statusNode, statusSpan, statusFa, data);
                        }));
                    }
                    
                }else{
                    statusSpan.text('审核中');
                    statusFa.addClass('fa-clock-o').css('color', '#f7a54a');
                }
                
            }else{
                statusNode.hide();
            }
        },
        
        _postStatus: function(postStatus, statusNode, statusSpan, statusFa, data){
            base.ajax({
                hintOnSuccess: true,
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/thirdparty/statusReview',
                data: {
                    tpsId: data.tps_ID
                }
            }).success(lang.hitch(this, function(ret){
                statusSpan.text('审核中');
                statusFa.removeClass('fa-info-circle').addClass('fa-clock-o').css('color', '#f7a54a');
                statusNode.tooltip('destroy').show();
                
                postStatus.hide();
            }));
        },
        
        _reliableSet: function(item, data){
            if(parseInt(data.tps_STATUS) != 1){
                return;
            }
            
            var reliable = item.find('.reliable');
            var reliableSpan = reliable.find('span');
            var reliableFa = reliable.find('i.fa');
            var postReliable = item.find('.postReliable');
            
            if(base.isNull(data.tps_RELIABLE)){
                if(data.reliableInfo){
                    reliable.show();
                    
                    if(data.reliableInfo.rl_RESULT == 0){
                        reliableSpan.text('认证中');
                        reliableFa.addClass('fa-clock-o').css('color', '#f7a54a');
                        
                    }else if(data.reliableInfo.rl_RESULT == 2){
                        reliableSpan.text('认证失败');
                        reliableFa.addClass('fa-info-circle').css('color', '#ec4758');
                        
                        var reliableStr = this._getCheckRetString('认证结果', data.reliableInfo.upt_TS, data.reliableInfo.rl_INFO);
                        
                        reliable.tooltip({
                            container: 'body',
                            placement: 'auto bottom',
                            trigger: 'hover',
                            animation: false,
                            html: true,
                            template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner" style="max-width: 300px"></div></div>',
                            title: function(){
                                return reliableStr;
                            }
                        }).css('cursor', 'pointer');
                        
                        postReliable.show().click(lang.hitch(this, function(){
                            this._postReliable(data, true);
                        }));
                    }
                    
                }else{
                    reliable.hide();
                    postReliable.show().click(lang.hitch(this, function(){
                        this._postReliable(data, false);
                    }));
                }
                
            }else{
                reliable.show();
                reliableSpan.text(data.tps_RELIABLE);
                reliableFa.addClass('fa-shield').css('color', '#8baf04');
                
                reliable.tooltip({
                    container: 'body',
                    placement: 'auto bottom',
                    trigger: 'hover',
                    title: '已认证'
                }).css('cursor', 'pointer');
            }
        },
        
        _postReliable: function(data, hasReliabled){
            if(!this.isRNA){
                base.info('提醒', '请先在[我的账号]中完成实名认证');
            }else{
                this._reliableFee(data, hasReliabled);
            }
        },
        
        _reliableFee: function(data, hasReliabled){
            this._destroyEditor();
            
            var rlName = data.reliableInfo? data.reliableInfo.rl_NAME : null;
            
            base.newDojo(
                'component/my3rd/widget/myCreated/widget/reliable/reliable', 
                'myCreated.reliable', 
                {tpsId: data.tps_ID, tpsName: data.tps_NM, hasReliabled: hasReliabled, rlName: rlName}
            ).success(lang.hitch(this, function(obj){
                this.editor = obj;
                
                var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                this._changeModalSize(modal, true);
                modal.find('.modal-title').text(data.tps_NM + ' - 申请认证');
                modal.find('.modal-body').removeClass('editor').append($(this.editor.domNode));
                this.editor.startup();
            }));
        },
        
        _changeModalSize: function(normal){
            var dialog = $(this.domNode).children('.modal').children('.modal-dialog');
            if(normal){
                dialog.removeClass('modal-lg').css('min-width', 'initial');
            }else{
                dialog.addClass('modal-lg').css('min-width', '900px');
            }
        },
        
        _postReliable_end: function(tpsId){
            var item = $(this.domNode).find('.svContainer>.svItem[tpsId="'+ tpsId +'"]');
            
            var reliable = item.find('.reliable').tooltip('destroy').show();
            reliable.find('span').text('认证中');
            reliable.find('i.fa').removeClass('fa-info-circle').addClass('fa-clock-o').css('color', '#f7a54a');
            
            item.find('.postReliable').hide();
        },
        
        _getCheckRetString: function(title, ts, info){
            var str = '<span style="display: block; text-align: left; margin-top: 5px;">' + title + ' ' + (new Date(ts)).format('MM-dd HH:mm') + '</span><ol style="padding: 0px 0px 0px 15px; text-align: left;">';
            
            var rvlist = JSON.parse(info);
            for(var i=0; i<rvlist.length; i++){
                str += '<li>' + rvlist[i] + '</li>';
            }
            str += '</ol>';
            
            return str;
        },
        
        _edit: function(data){
            this._destroyEditor();
            var status = parseInt(data.tps_STATUS);
            
            this._changeModalSize(false);
            
            if(status == 1){
                base.newDojo(
                    'component/my3rd/widget/myCreated/widget/editor/editor', 
                    'myCreated.editor', 
                    {tpsId: data.tps_ID, tpsKey: data.tps_KEY, tpsUrl: data.tps_APIURL}
                ).success(lang.hitch(this, function(obj){
                    this.editor = obj;

                    var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                    modal.find('.modal-title').text(data.tps_NM);
                    modal.find('.modal-body').addClass('editor').append($(this.editor.domNode));
                    this.editor.startup();
                }));
                
            }else if(status == 0){
                base.newDojo(
                    'component/my3rd/widget/createService/createService', 
                    'my3rd.createService', 
                    {tpsId: data.tps_ID, tpsKey: data.tps_KEY, tpsUrl: data.tps_APIURL, isEdit: true}
                ).success(lang.hitch(this, function(obj){
                    this.editor = obj;

                    var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                    modal.find('.modal-title').text(data.tps_NM);
                    modal.find('.modal-body').removeClass('editor').append($(this.editor.domNode));
                    this.editor.startup();
                }));
            }
        },
        
        _destroyEditor: function(){
            if(this.editor){
                this.editor.destroyRecursive();
                this.editor = null;
            }
        },
        
        _showCallStatistic: function(node, data){
            var sta = this.statisticMap[data.tps_ID];
            if(sta){
                this._setStatisticInfo(data.tps_ID, node, sta);
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/thirdparty/normal/callStatistic',
                    data: {
                        tpsId: data.tps_ID
                    }
                }).success(lang.hitch(this, function(ret){
                    sta = ret.data;
                    
                    var mapData = {
                        callCount: 0,
                        chartArr: []
                    };
                    
                    if(sta.length > 0){
                        mapData.callCount = sta[sta.length - 1].tps_TOTAL;
                        
                        var tmMap = {}, preTsStr = (new Date(sta[0].crt_TS)).add('h', 1).format('yyyy-MM-dd HH:00:00');
                        var mapHd = function(curTMStr){
                        	var curTs = base.parseDate(curTMStr);
                        	mapData.chartArr.push({
                                name: curTs,
                                value: [curTs, tmMap[curTMStr]]
                            });
                        };
                        
                        for(var i=0; i<sta.length; i++){
                            var tsStr = (new Date(sta[i].crt_TS)).add('h', 1).format('yyyy-MM-dd HH:00:00');
                            
                            var tmp = tmMap[tsStr];
                            if(base.isNull(tmp)){
                            	tmMap[tsStr] = parseInt(sta[i].tps_CUR);
                            }else{
                            	tmMap[tsStr] = tmp + parseInt(sta[i].tps_CUR);
                            }
                            
                            if(preTsStr != tsStr){
                            	mapHd(preTsStr);
                            	preTsStr = tsStr;
                            }
                        }
                        
                        //the last one
                        mapHd(preTsStr);
                    }
                    
                    this.statisticMap[data.tps_ID] = mapData;
                    this._setStatisticInfo(data.tps_ID, node, mapData);
                }));
            }
        },
        
        _setStatisticInfo: function(tpsId, node, staData){
            node.find('.callCount').text(staData.callCount);
            
            this._refreshChart(tpsId, node, staData.chartArr);
        },
        
        _refreshChart: function(tpsId, node, data){
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: lang.hitch(this, function (params) {
                        var p = params[0];
                        if(p.value && p.value.length > 1){
                            var dt = new Date(p.name);
                            return dt.format('yyyy/M/d H点') + '<br>次数：' + p.value[1];
                        }else{
                            return null;
                        }
                    })
                },
                grid: {
                    bottom: 33
                },
                title: {
                    show: true,
                    left: 'right',
                    text: '近5天调用统计',
                    textStyle: {
                        fontSize: 13,
                        fontWeight: 'normal'
                    }
                },
                legend: {
                    show: false
                },
                xAxis: {
                    type: 'time',
                    boundaryGap: false,
                    splitLine: {show: false}
                },
                yAxis: {
                    type: 'value',
                    scale: true,
                    boundaryGap: [0.3, 0.3],
                    name: '次数'
                },
                series: [
                    {
                        type: 'line',
                        smooth: false,
                        data: data
                    }
                ]
            };
            
            var chart = this.chartMap[tpsId];
            if(!chart){
                chart = echarts.init(node.find('.chart')[0]);
                this.chartMap[tpsId] = chart;
            }
            
            chart.setOption(option);
        },
        
        _getFeeString: function(data){
            var feeTp = parseInt(data.fee_TP);
            if(feeTp == 0){
                return '免费';
            }else if(feeTp == 1){
                
                var countNum = parseInt(data.fee_COUNT_NUM);
                var countNumStr = '';
                
                if(data.fee_COUNT_NUM < 10000){
                    countNumStr = data.fee_COUNT_NUM;
                }else{
                    var tmp = parseInt(countNum / 10000), tmp1 = countNum % 10000;
                    if(tmp1 == 0){
                        countNumStr = tmp + '万';
                    }else{
                        countNumStr = data.fee_COUNT_NUM;
                    }
                }
                
                //fee by count
                if(parseInt(data.fee_COUNT_FREE) > 0){
                    return '￥' + data.fee_COUNT_BASE + '/' + countNumStr + '次，可试用' + data.fee_COUNT_FREE + '次';
                }else{
                    return '￥' + data.fee_COUNT_BASE + '/' + countNumStr + '次';
                }
                
            }else if(feeTp == 2){
                //fee by time
                var strEnd = parseInt(data.fee_TIME_FREE) > 0 ? ('，可试用' + data.fee_TIME_FREE + '天') : '';
                
                var period = parseInt(data.fee_TIME_PERIOD);
                var tmp = parseInt(period / 30), tmp1 = period % 30;
                if(tmp == 1 && tmp1 == 0){
                    return '￥' + data.fee_TIME_BASE + '/月' + strEnd;
                }
                
                tmp = parseInt(period / 180);
                tmp1 = period % 180;
                if(tmp == 1 && tmp1 == 0){
                    return '￥' + data.fee_TIME_BASE + '/半年' + strEnd;
                }
                
                tmp = parseInt(period / 360);
                tmp1 = period % 360;
                if(tmp1 == 0){
                    return '￥' + data.fee_TIME_BASE + '/' + (tmp == 1 ? '' : tmp) + '年' + strEnd;
                }
                
                return '￥' + data.fee_TIME_BASE + '/' + period + '天' + strEnd;
            }
        },
        
        _refreshItem: function(parent, data){
            var item = parent.find('.svItem[tpsId="'+ data.tps_ID +'"]');
            if(item.length > 0){
                item.data(data);
                
                //only fee information can be modified.
                item.find('.feeStr').text(this._getFeeString(data));
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/my3rd/widget/createService/finished', lang.hitch(this, function(data){
                this._createItem($(this.domNode).find('.svContainer'), data, true);
            }));
            
            var sub2 = topic.subscribe('component/my3rd/widget/myCreated/closeModal', lang.hitch(this, function(data){
                $(this.domNode).children('.modal').modal('hide');
            }));
            var sub3 = topic.subscribe('component/my3rd/widget/createService/closeModal', lang.hitch(this, function(data){
                $(this.domNode).children('.modal').modal('hide');
            }));
            var sub4 = topic.subscribe('component/my3rd/widget/myCreated/updated', lang.hitch(this, function(data){
                this._refreshItem($(this.domNode).find('.svContainer'), data);
                $(this.domNode).children('.modal').modal('hide');
            }));
            var sub5 = topic.subscribe('component/my3rd/widget/myCreated/reliableRefresh', lang.hitch(this, function(data){
                this._postReliable_end(data.tpsId);
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
            this.own(sub5);
        }
    });
});
