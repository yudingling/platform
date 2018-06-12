
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    'root/dropdownBox/DropdownBox',
    'root/dateTimePicker/DateTimePicker',
    'root/panel/Panel',
    "root/colorRainbow/rainbowvis",
    "common/widget/deviceActionTree/deviceActionTree",
    'common/widget/maintRecordDetail/maintRecordDetail',
    "dojo/text!./template/maintRecord.html",
    "tool/css!./css/maintRecord.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        DropdownBox,
        DateTimePicker,
        Panel,
        ColorRainbow,
        DeviceActionTree,
        MaintRecDetail,
        template){
    
    return declare("component.maintRecord", [_Widget], {
        baseClass: "component_maintRecord",
        templateString: template,
        
        selfAuth: true,
        
        authApi: {
            maintRecordUpt: '/platformApi/own/maint/maintRecord/update'
        },
        
        constructor: function(args){
            declare.safeMixin(this, args);

            this._initEvents();
        },

        postCreate: function(){
            this.inherited(arguments);

            this._initDom();
        },

        startup: function(){
            this.inherited(arguments);

            this.resizeBind = lang.hitch(this, function(){
                var detailShown = $(this.domNode).find('.mrContent>.bottom').hasClass('showDetail');
                this._resizeManual(1, detailShown);
            });
            $(window).resize(this.resizeBind);
            
            this._setData();
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
            }), 500);

        },

        destroy: function(){
            this.inherited(arguments);

            if (this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
        },

        bindAuthed: function(){
            this.inherited(arguments);
            
            //hide the action button at first to reduce twinke
            $(this.domNode).find('.mrContent>.bottom>.detail>.actionBar>*[bindAuth]').hide();
        },


        _initDom: function(){
            this._initDom_search();
            this._initDom_page();
            this._initDom_table();
        },
        
        _initDom_search: function(){
            var parentNode = $(this.domNode).find('.mrContent>.top');
            
            this.dpRecSource = new DropdownBox(parentNode.find('.recSource'), {
                placeholder: '选择来源',
                minWidth: 100,
                btnClass: 'btn-default',
                options: [{name: '所有', value: ''}, {name: '人工产生', value: 'manual'}, {name: '设备告警', value: 'client'}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData();
                })
            });
            this.own(this.dpRecSource);
            
            this.dpRecStatus = new DropdownBox(parentNode.find('.recStatus'), {
                placeholder: '选择状态',
                minWidth: 100,
                btnClass: 'btn-default',
                options: [{name: '所有', value: ''}, {name: '待处理', value: '0'}, {name: '处理中', value: '1'}, {name: '已关闭', value: '2'}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData();
                })
            });
            this.own(this.dpRecStatus);
            
            parentNode.find('.searchField button.search').click(lang.hitch(this, function(){
                this._setData();
            }));
            
            var fdiv = parentNode.find('.searchField>div:nth-child(1)');
            var sdiv = parentNode.find('.searchField>div:nth-child(2)');
            var aObj = parentNode.find('.searchField>a.switch');
            
            fdiv.find('input').keydown(lang.hitch(this, function(event){
                if (event.which == 13){
                    this._setData();
                }
            }));
            
            aObj.click(lang.hitch(this, function(){
                this._hideClientTree();
                
                if(fdiv.is(':visible')){
                    fdiv.hide();
                    sdiv.removeClass('animated fadeInLeft').addClass('animated fadeInLeft').show();
                    aObj.text('简洁');
                    
                }else{
                    sdiv.hide();
                    fdiv.removeClass('animated fadeInLeft').addClass('animated fadeInLeft').show();
                    aObj.text('高级');
                }
            }));
            
            this.stm = new DateTimePicker(parentNode.find('.searchField .stm'), 'Y-m-d');
            this.etm = new DateTimePicker(parentNode.find('.searchField .etm'), 'Y-m-d');
            this.own(this.stm);
            this.own(this.etm);
            
            parentNode.find('.searchField .tm').focusin(lang.hitch(this, function(){
                this._hideClientTree();
            }));
            
            parentNode.find('.searchField .clients').focusin(lang.hitch(this, function(e){
                this._showClientTree($(e.currentTarget).parent());
            }));
            
            parentNode.find('.searchField>a.add').click(lang.hitch(this, function(){
                this._showAppender();
            }));
        },
        
        _initDom_page: function(){
            var parentNode = $(this.domNode).find('.mrContent>.top .warnPage');
            
            parentNode.find('.currentPage').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._setData();
                }
            }));
            
            parentNode.find('i.fa-arrow-right').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = parentNode.find('.currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur < this.totalPage){
                        curPageNode.val(cur + 1);
                        
                        this._setData();
                    }
                }
            }));
            
            parentNode.find('i.fa-arrow-left').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = parentNode.find('.currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur > 1){
                        curPageNode.val(cur - 1);
                        
                        this._setData();
                    }
                }
            }));
        },
        
        _initDom_table: function(){
            $(this.domNode).find('.mrContent>.bottom>.detail>.actionBar>.closeDetail').click(lang.hitch(this, function(){
                this._clearDetail();
                
                $(this.domNode).find('.mrContent>.bottom').one('webkitTransitionEnd transitionend', lang.hitch(this, function(e){
                    $(e.currentTarget).off('webkitTransitionEnd transitionend');
                    this._resizeManual(1, false);

                }));
            }));
        },
        
        _showClientTree: function(container){
            if(!this.panel){
                var obj = $('<div class="clientTreeCC" style="height:100%; padding: 3px;"></div>');
                this.panel = new Panel(container, obj, "选择设备");
                this.own(this.panel);

                var tree = new DeviceActionTree({
                    groupSelect: false,
                    showCheckBox: true,
                    loaded: lang.hitch(this, function(){
                        $(this.domNode).find('.mrContent>.top .searchField .clients').val(null);
                    })
                });
                obj.append($(tree.domNode));
                tree.startup();
                this.own(tree);
                
                this.cliSelTree = tree;
            }
            
            this.panel.show({width: '280px', height: '350px', top: '40px', left: '0px'});
        },
        
        _hideClientTree: function(){
            if(this.panel){
                this.panel.hide();
            }
        },

        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            $(this.domNode).find('.mrContent>.bottom>div').removeClass('trans');
            this._clearDetail();
            
            this._resizeManual(1, false);
            
            node.find('tr.empty').remove();
            
            var children = node.find('tr');
            if(base.isNull(newCount) || newCount == 0){
                children.remove();
                
            }else if(children.length > newCount){
                for(var i = newCount; i < children.length; i++){
                    $(children[i]).remove();
                }
            }
        },
        
        _clearDetail: function(){
            if(this.detailObj){
                $(this.detailObj.domNode).hide();
            }
            
            $(this.domNode).find('.mrContent>.bottom').removeClass('showDetail');
            
            $(this.domNode).find('.mrContent>.bottom .recContainer tr.active').removeClass('active');
        },
        
        _getSearchArgs: function(){
            var fdiv = $(this.domNode).find('.mrContent>.top .searchField>div:nth-child(1)');
            var sdiv = $(this.domNode).find('.mrContent>.top .searchField>div:nth-child(2)');
            var args = {};
            
            if(fdiv.is(':visible')){
                args.search = fdiv.find('input').val();
            }else{
                args.clientIds = sdiv.find('input.clients').val();
                
                var tmpStm = sdiv.find('input.stm').val();
                if(tmpStm.length > 0){
                    args.stm = tmpStm + ' 00:00:00';
                }
                
                var tmpEtm = sdiv.find('input.etm').val();
                if(tmpEtm.length > 0){
                    args.etm = tmpEtm + ' 23:59:59';
                }
            }
            
            var status = this.dpRecStatus.getCurrentSelect();
            if(!base.isNull(status.value) && status.value.length > 0){
                args.status = parseInt(status.value);
            }
            
            var from = this.dpRecSource.getCurrentSelect();
            if(!base.isNull(from.value) && from.value.length > 0){
                args.from = from.value;
            }
            
            return args;
        },

        _setData: function(){
            this._hideClientTree();
            
            var pageSize = 15;
            
            var pageParent = $(this.domNode).find('.mrContent>.top .warnPage');
            
            var curPageNode = pageParent.find('.currentPage');
            var curPage = parseInt(curPageNode.val());
            if (isNaN(curPage) || curPage < 1){
                curPage = 1;
                curPageNode.val(curPage);
            }
            if (!base.isNull(this.totalPage) && this.totalPage > 0){
                if (curPage > this.totalPage){
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }
            
            var recContainer = $(this.domNode).find('.mrContent>.bottom .recContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/maint/normal/maintRecord',
                data: $.extend({
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }, this._getSearchArgs())
            }).success(lang.hitch(this, function(ret){
                var records = ret.data.records;
                this.statistic = ret.data.statistic;
                
                //statistic
                this._showStatistic();
                
                //records
                var data = records[1];
                this._clear(recContainer, data.length);
                
                if(data.length > 0){
                    this._createItem(0, recContainer);
                    
                    for(var i = 0; i < data.length; i++){
                        this._createItem(i+1, recContainer, data[i]);
                    }
                }else{
                    recContainer.append('<tr class="empty"><td>暂无记录!</td></tr>');
                }

                this.totalPage = Math.ceil(parseInt(records[0]) / pageSize);
                pageParent.find('.totalPage').html(this.totalPage);
                if (this.totalPage == 0){
                    curPageNode.val(0);
                }

            })).fail(lang.hitch(this, function(ret){
                $(this.domNode).find('.mrContent>.bottom').removeClass('showDetail');

                pageParent.find('.currentPage').val('0');
                pageParent.find('.totalPage').val('0');

                recContainer.children().remove();
                recContainer.append('<tr class="empty"><td>获取数据失败!</td></tr>');
            }));
        },
        
        _showStatistic: function(){
            var waitNode = $(this.domNode).find('.mrContent>.top span.wait');
            var executingNode = $(this.domNode).find('.mrContent>.top span.executing');
            waitNode.text(this.statistic[0]);
            executingNode.text(this.statistic[1]);

            if(this.statistic[0] == 0){
                waitNode.addClass('zero');
            }else{
                waitNode.removeClass('zero');
            }

            if(this.statistic[1] == 0){
                executingNode.addClass('zero');
            }else{
                executingNode.removeClass('zero');
            }
        },
        
        _getSubTitle: function(title, parentWidth, detailShown){
            //get the title span width
            var availWidth = 0;
            var diffWith = 0;
            if(detailShown){
                diffWith = 42 + 170 + 110;
                
            }else{
                diffWith = 42 + 100 + 110 + 170 + 110;
            }
            
            availWidth = parentWidth - diffWith;
            
            if (availWidth <= 0){
                availWidth = $(window).width() - diffWith;
            }
            
            //average 7 pixels for each ascii character
            return base.subDescription(title, parseInt(availWidth / 7));
        },
        
        _getStatusHtml: function(trItem, data){
            if(data.maint_STATUS == 2){
                trItem.addClass('closed');
            }else{
                trItem.removeClass('closed');
            }
            return '<span class="level level'+ data.maint_STATUS +'"></span>';
        },
        
        _getTimePeriodHtml: function(data){
            if(data.maint_STATUS > 0 && !base.isNull(data.maint_ACT_TS)){
                var endTs = base.isNull(data.maint_END_TS)? (new Date()).getTime() : data.maint_END_TS;
                
                var diffMs = endTs - data.maint_ACT_TS;
                
                var tmLen = parseInt(diffMs / 3600000);
                if(tmLen < 1){
                    tmLen = 0.5;
                }
                
                var tmDesc = '';
                if(tmLen <= 1){
                    tmDesc = '1小时以内';
                }else if(tmLen <= 24){
                    tmDesc = tmLen + '小时';
                }else if(tmLen <= 168){
                    tmDesc = parseInt(tmLen / 24) + '天';
                }else if(tmLen <= 720){
                    tmDesc = parseInt(tmLen / 168) + '周';
                }else{
                    tmDesc = parseInt(tmLen / 720) + '月';
                }
                
                var colorObj = this._getRBColorForTime(tmLen);
                
                var spanStyle = '';
                if(colorObj.step < 20){
                    spanStyle = 'class="min"';
                }
                
                return '<div style="background: linear-gradient(to right, '+ colorObj.sColor +', '+ colorObj.eColor +'); width: '+ colorObj.step +'%"><span '+ spanStyle +'>'+ tmDesc +'</span></div>';
                
            }else{
                return '';
            }
        },
        
        _getRecordSourceHtml: function(data){
            return base.isNull(data.wrn_ID)? '人工产生' : '设备告警';
        },
        
        _getRBColorForTime: function(tmVal){
            if(!this.rainbow){
                this.rainbow = new ColorRainbow({fromColor: '#4CB050', endColor: '#E36281', length: 30});

                this.rainbowVal = [];
                this.rainbowVal.push(1);
                for(var i=1; i<30; i++){
                    this.rainbowVal.push(i*12);
                }
            }
            
            var i = -1;
            while(++i<30){
                if(this.rainbowVal[i] > tmVal){
                    break;
                }
            }
            if(i == 30){
                i = 29;
            }
            
            var step = parseInt((i + 1) * 100 / 30);
            if(step < 15){
                step = 15;
            }
            if(step > 100){
                step = 100;
            }
            
            step = step * 0.9;
            
            return {
                sColor: this.rainbow.colourAt(0),
                eColor: this.rainbow.colourAt(i),
                step: step
            };
        },
        
        _createItem: function(i, parent, data){
            var item = i >= 0 ? parent.find('tr:nth-child(' + (i + 1) + ')') : null;
            
            if (!item || item.length == 0){
                var headStr= '<tr class="h"><th style="width: 50px;"></th><th>工单简介</th><th style="width:100px; text-align: center;">来源</th><th style="width:110px; text-align: center;">处理人员</th><th style="width:170px; padding-left: 20px;">已耗时</th><th style="width:110px; text-align: right; padding-right: 20px;">创建日期</th></tr>';
                
                if(i == 0){
                    item = $(headStr);
                    parent.append(item);
                    return;
                    
                }else{
                    item = $('<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
                    
                    if(i == -1){
                        var headTr = parent.find('tr.h');
                        if(headTr.length > 0){
                            headTr.after(item);
                        }else{
                            headTr = $(headStr);
                            parent.append(headTr);
                            headTr.after(item);
                        }
                        
                    }else{
                        parent.append(item);
                    }
                }
            }else if(i == 0){
                return;
            }
            
            item.attr('maintID', data.maint_ID);
            item.data('data', data);
            
            item.unbind().click(lang.hitch(this, function(e){
                if (item.hasClass('active')){
                    return;
                }
                
                var bottom = $(this.domNode).find('.mrContent>.bottom');
                if (!bottom.hasClass('showDetail')){
                    //change the title description first
                    this._resizeManual(0.5, true);
                    
                    bottom.children('div').addClass('trans');
                    
                    bottom.one('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                        bottom.off('webkitTransitionEnd transitionend');
                        //defer 50ms for timeline, its canvan size need to be accurate
                        this.defer(lang.hitch(this, function(){
                            this._showDetail(data);

                        }), 100);
                    })).addClass('showDetail');

                }else{
                    this._showDetail(data);
                }

                item.parent().children('tr').not(item).removeClass('active');
                item.addClass('active');
            }));
            
            item.children('td:nth-child(1)').html(this._getStatusHtml(item, data));
            item.children('td:nth-child(2)').html(this._getSubTitle(data.maint_DESC, parent.width(), false));
            item.children('td:nth-child(3)').html(this._getRecordSourceHtml(data));
            item.children('td:nth-child(4)').html(data.maint_ACT_UNM);
            item.children('td:nth-child(5)').html(this._getTimePeriodHtml(data));
            item.children('td:nth-child(6)').html(base.getTMDesc(data.crt_TS));
        },

        _refreshItem: function(data){
            var item = $(this.domNode).find('.mrContent>.bottom .recContainer tr[maintID="' + data.maint_ID + '"]');
            
            item.children('td:nth-child(1)').html(this._getStatusHtml(item, data));
            
            this._setActionStatus(data);
        },
        
        _showDetail: function(data){
            this._setActionStatus(data);
            
            if(!this.detailObj){
                this.detailObj = new MaintRecDetail();
                $(this.domNode).find('.mrContent>.bottom>.detail>.recDetail .recDetailCC').append($(this.detailObj.domNode));
                
                this.detailObj.startup();
                this.own(this.detailObj);
            }
            
            $(this.detailObj.domNode).show();
            
            this.detailObj.refresh(data);
        },

        _setActionStatus: function(data){
            var parent = $(this.domNode).find('.mrContent>.bottom>.detail>.actionBar');
            
            var btnClose = parent.find('button.recClose');
            //can only close the record that created by himself
            if(data.maint_STATUS == 2 || data.maint_CRT_UID != base.getUid()){
                btnClose.unbind().hide();
                
            }else{
                if(Boolean(btnClose.attr('bindAuthResult'))){
                    btnClose.show().unbind().click(lang.hitch(this, function(){
                        base.confirm('关闭工单', '是否确定从后台关闭工单?', lang.hitch(this, function(){
                            this._closeRecord(data);
                            
                        }), function(){});
                        
                    }));
                }
            }
        },
        
        _closeRecord: function(data){
            var oldStatus = data.maint_STATUS;
            
            base.ajax({
                type: 'PUT',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/maint/maintRecord/update',
                data: {
                    maintId: data.maint_ID
                }
            }).success(lang.hitch(this, function(ret){
                $.extend(data, {
                    maint_END_UID: ret.data.maint_END_UID, 
                    maint_END_TS: ret.data.maint_END_TS, 
                    maint_END_UNM: ret.data.maint_END_UNM, 
                    maint_STATUS: ret.data.maint_STATUS
                });
                
                this._refreshItem(data);
                
                this.detailObj.ended(data);
                
                if(oldStatus == 0){
                    this.statistic[0] = this.statistic[0] - 1;
                }else if(oldStatus == 1){
                    this.statistic[1] = this.statistic[1] - 1;
                }
                this._showStatistic();
                
                this._scrollToEnd();
            }));
        },
        
        _scrollToEnd: function(){
             CustomScrollBar.scrollTo($(this.domNode).find('.mrContent>.bottom>.detail>.recDetail'), 'bottom');
        },
        
        _resizeManual: function(percentage, detailShown){
            var parent = $(this.domNode).find('.mrContent>.bottom .recContainer');
            var parentWidth = parseInt(parent.width() * percentage);
            
            if(detailShown){
                parent.find('tr>td:nth-child(3), td:nth-child(4), tr>th:nth-child(3), th:nth-child(4)').hide();
            }else{
                parent.find('tr>td:nth-child(3), td:nth-child(4), tr>th:nth-child(3), th:nth-child(4)').show();
            }
            
            parent.children('tr:not(.h):not(.empty)').each(lang.hitch(this, function(index, e){
                var cur = $(e);
                var data = cur.data('data');
                
                cur.children('td:nth-child(2)').html(this._getSubTitle(data.maint_DESC, parentWidth, detailShown));
            }));
        },
        
        _addSelClients: function(data){
            var clientsNode = $(this.domNode).find('.mrContent>.top .searchField .clients');
            var orgStr = clientsNode.val();
            var str = '';
            
            for(var i = 0; i < data.length; i++){
                if(data[i].type == 'client'){
                    var tmp = data[i].dId;
                    if(orgStr.indexOf(tmp) < 0){
                        str += tmp + ',';
                    }
                }
            }
            
            if(str.length > 0){
                str = str.substr(0, str.length - 1);
            }
            
            if(orgStr.length > 0){
                clientsNode.val(orgStr + ',' + str);
            }else{
                clientsNode.val(str);
            }
        },
        
        _deleteSelClients: function(data){
            var clientsNode = $(this.domNode).find('.mrContent>.top .searchField .clients');
            var orgStr = clientsNode.val();
            
            for(var i = 0; i < data.length; i++){
                if(data[i].type == 'client'){
                    var tmp = data[i].dId;
                    
                    var index = orgStr.indexOf(tmp);
                    if(index >= 0){
                        if(index == 0){
                            orgStr = orgStr.substr(orgStr.length == tmp.length ? tmp.length : (tmp.length + 1));
                        }else if(index == orgStr.length - tmp.length){
                            orgStr = orgStr.substr(0, index - 1);
                        }else{
                            orgStr = orgStr.substr(0, index) + orgStr.substr(index + tmp.length + 1);
                        }
                    }
                }
            }
            
            clientsNode.val(orgStr);
        },
        
        _showAppender: function(){
            this._destroyAppender();
            
            base.newDojo(
                'common/widget/maintRecordCreator/maintRecordCreator', 
                'maintRecordCreator', 
                null
            ).success(lang.hitch(this, function(obj){
                this.appender = obj;
                
                var modalNode = $(this.domNode).children('.modal');
                modalNode.find('.modal-body').append($(this.appender.domNode));
                this.appender.startup();
                
                modalNode.modal({backdrop: 'static', keyboard: false});
            }));
        },
        
        _appendRecord: function(data){
            var recContainer = $(this.domNode).find('.mrContent>.bottom .recContainer');
            recContainer.find('tr.empty').remove();
            
            this._createItem(-1, recContainer, data);
            
            this.statistic[0] = this.statistic[0] + 1;
            this._showStatistic();
            
            $(this.domNode).resize();
        },
        
        _destroyAppender: function(){
            if(this.appender){
                this.appender.destroyRecursive();
                this.appender = null;
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('common/widget/ztree/check', lang.hitch(this, function(data){
            	if(data.instanceId == this.cliSelTree.deviceTree.instanceId){
            		this._addSelClients(data);
            	}
            }));
            var sub2 = topic.subscribe('common/widget/ztree/unCheck', lang.hitch(this, function(data){
            	if(data.instanceId == this.cliSelTree.deviceTree.instanceId){
            		this._deleteSelClients(data);
            	}
            }));
            var sub3 = topic.subscribe('common/widget/maintRecordCreator/finish', lang.hitch(this, function(data){
                this._appendRecord(data);
            }));
            var sub4 = topic.subscribe('common/widget/maintRecordCreator/close', lang.hitch(this, function(data){
                $(this.domNode).children('.modal').modal('hide');
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
        }
    });
});
