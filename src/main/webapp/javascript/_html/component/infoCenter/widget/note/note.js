
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/note.html",
    "tool/css!./css/note.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        template){
    
    return declare("component.infoCenter.widget.note", [_Widget], {
        baseClass: "component_infoCenter_widget_note",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);

            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.resizeBind = lang.hitch(this, function(){
                this._resizeManual();
            });
            $(window).resize(this.resizeBind);
            
            this._setFilter();
            $(this.domNode).find('.noteFilter li>a[data="all"]').click();
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.top i.readSel').tooltip('destroy');
            
            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('.noteFilter li.catalog>a').click(lang.hitch(this, function(e){
                $(e.currentTarget).parent().toggleClass('open');
            }));
            
            $(this.domNode).find('.rightContent .top .search button, .rightContent .top .search input[type="checkbox"]').click(lang.hitch(this, function(){
                this._setData();
        	}));
            
            $(this.domNode).find('.rightContent .top .search .noteTxt, .top .currentPage').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._setData();
                }
            }));
            
            $(this.domNode).find('.noteFilter2>li>a[data]').click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(this._filterAction(cur)){
                    this.noteLevel = parseInt(cur.attr('data'));
                    
                    this._setData();
                }
            }));
            
            $(this.domNode).find('.noteFilter li>a[data="all"]').click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(this._filterAction(cur)){
                    this._setData();
                }
            }));
            
            $(this.domNode).find('.top i.fa-arrow-right').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = $(this.domNode).find('.top .currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur < this.totalPage){
                        curPageNode.val(cur + 1);
                        
                        this._setData();
                    }
                }
            }));
            
            $(this.domNode).find('.top i.fa-arrow-left').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = $(this.domNode).find('.top .currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur > 1){
                        curPageNode.val(cur - 1);
                        
                        this._setData();
                    }
                }
            }));
            
            $(this.domNode).find('.top i.readSel').click(lang.hitch(this, function(event){
                if(this.unReadSelected){
                    if(Object.keys(this.unReadSelected).length > 0){
                        this._readRecords(this.unReadSelected).done(lang.hitch(this, function(){
                            
                            for(var key in this.unReadSelected){
                                this._readed(this.unReadSelected[key]);
                                
                                delete this.unReadAll[key];
                            }
                            
                            this.unReadSelected = {};
                            
                            this._checkUnReadCmdVisible();
                        }));
                    }
                }
            })).tooltip({
                container: 'body',
                placement: 'auto top',
                trigger: 'hover',
                template: '<div class="tooltip" role="tooltip" style="margin-bottom: 0px"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
            });
        },
        
        _bindTypesClick: function(){
            $(this.domNode).find('.noteFilter1>li>a[data]').unbind().click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(this._filterAction(cur)){
                    this.noteType = cur.attr('data');
                    
                    this._setData();
                }
            }));
        },
        
        _filterAction: function(cur, force){
            if(!cur.hasClass('active') || force){
                $(this.domNode).find('.noteFilter li>a[data]').not(cur).removeClass('active');
                cur.addClass('active');
                
                $(this.domNode).find('.top i.readSel').hide();
                
                $(this.domNode).find('.top .currentPage').val('1');
                this.totalPage = 0;
                this.unReadAll = {};
                this.unReadSelected = {};
                
                this.noteType = null;
                this.noteLevel = null;
                
                return true;
            }else{
                return false;
            }
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            node.children('div.empty').remove();
            
            var children = node.children();
            if(base.isNull(newCount) || newCount == 0){
                children.remove();
            }else if(children.length > newCount){
                for(var i=newCount; i<children.length; i++){
                    $(children[i]).remove();
                }
            }
            
            var opend = node.children('.noteItem.open');
            opend.children('.itemDetail.collapse.in').removeClass('in');
            opend.removeClass('open');
            
            node.find('.itemDesc input[type="checkbox"]').prop('checked', false);
            
            node.children('.unRead').removeClass('unRead');
        },
        
        _setData: function(){
            var pageSize = 15;
            
            var curPageNode = $(this.domNode).find('.top .currentPage');
            var curPage = parseInt(curPageNode.val());
            if(isNaN(curPage) || curPage < 1){
                curPage = 1;
                curPageNode.val(curPage);
            }
            if(!base.isNull(this.totalPage) && this.totalPage > 0){
                if(curPage > this.totalPage){
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }
            
            var notesContainer = $(this.domNode).find('.rightContent>div>.bottom .notesContainer');
            
            this.unReadAll = {};
            this.unReadSelected = {};
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/notification',
                data: {
                    noteLevel: this.noteLevel,
                    noteType: this.noteType,
                    search: $(this.domNode).find('.rightContent .top .search .noteTxt').val(),
                    readed: $(this.domNode).find('.rightContent .top .search input[type="checkbox"]').is(':checked')? 0 : null,
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function(ret){
                var data = ret.data[1];
                
                this._clear(notesContainer, data.length);
                
                this.unReadAll = {};
                if(data.length > 0){
                    for(var i=0; i<data.length; i++){
                        this._createItem(i, notesContainer, data[i]);

                        if(parseInt(data[i].rm_CLOSE) == 0){
                            this.unReadAll[data[i].rm_ID] = data[i];
                        }

                    }
                }else{
                    notesContainer.append('<div class="empty">暂无更多数据!</div>');
                }
                
                this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);
                $(this.domNode).find('.top .totalPage').html(this.totalPage);
                if(this.totalPage == 0){
                    curPageNode.val(0);
                }
                
                if(Object.keys(this.unReadAll).length > 0){
                    $(this.domNode).find('.top a.readAll').show().unbind().click(lang.hitch(this, function(event){
                        this._readRecords(this.unReadAll).done(lang.hitch(this, function(){
                            
                            for(var key in this.unReadAll){
                                this._readed(this.unReadAll[key]);
                                
                                delete this.unReadSelected[key];
                            }
                            
                            this.unReadAll = {};
                            
                            this._checkUnReadCmdVisible();
                        }));
                    }));
                }else{
                    $(this.domNode).find('.top a.readAll').hide();
                }
                
            })).fail(lang.hitch(this, function(){
                $(this.domNode).find('.top .currentPage').val('0');
                $(this.domNode).find('.top .totalPage').val('0');
                
                $(this.domNode).find('.top a.readAll').hide();
                
                notesContainer.children().remove();
                notesContainer.append('<div class="empty">获取数据失败!</div>');
                
            }));
        },
        
        _getSubTitle: function(title, parentWidth){
            //get the title span width
            var availWidth = parentWidth - 80 - 150;
            if(availWidth <= 0){
                availWidth = $(window).width() - 220 - 70 - 80 - 150;  
            }
            
            //average 7 pixels for each ascii character
            return base.subDescription(title, parseInt(availWidth / 7));
        },
        
        _getLevelInfo: function(levelVal){
            if(levelVal == 0){
                return ['info', '提示'];
            }else if(levelVal == 1){
                return ['warn', '告警'];
            }else{
                return ['error', '异常'];
            }
        },
        
        _createItem: function(i, parent, data){
            var item = i>=0? parent.children(':nth-child('+ (i+1) +')') : null;
            
            if(!item || item.length == 0){
                var uniCls = 'di_' + base.uuid();
                
                // there is a 'bug' that makes the accordion dependent on the '.panel' class when using the data-parent attribute
                var strTmp = '<div class="noteItem panel">'
                    + '<div class="itemDesc">'
                    +   '<div class="checkbox checkbox-primary pull-left"><input class="styled" type="checkbox"><label></label></div>'
                    +   '<span class="level"></span>'
                    +   '<span data-toggle="collapse" data-parent=".notesContainer" data-target=".'+ uniCls +'" aria-expanded="false"></span>'
                    +   '<span class="pull-right"></span>'
                    + '</div>'
                    + '<div class="itemDetail '+ uniCls +' collapse"><table><tr>'
                    +       '<td style="width:40px">时间:</td>'
                    +       '<td class="tdTM" style="width:150px"></td>'
                    +       '<td style="width:40px">级别:</td>'
                    +       '<td class="tdLevel" style="width:80px"></td>'
                    +       '<td style="width:40px">类型:</td>'
                    +       '<td class="tdType"></td>'
                    +       '</tr>'
                    +       '<tr><td class="tdDesc" colspan="6"></td></tr></table>'
                    + '</div></div>';
                
                item = $(strTmp);
                parent.append(item);
            }
            
            item.attr('rmID', data.rm_ID);
            item.data('data', data);
            
            if(parseInt(data.rm_CLOSE) == 0){
                item.addClass('unRead');
            }
            
            var encodeDesc = base.encodeDescription(data.rm_DESC);
            var levelInfo = this._getLevelInfo(parseInt(data.rm_LEVEL));
            
            item.find('.itemDesc>span.level').removeClass('info warn error').addClass(levelInfo[0]);
            item.find('.itemDesc>span[data-toggle]').html(this._getSubTitle(encodeDesc, parent.width())).unbind().click(lang.hitch(this, function(e){
                if(!item.hasClass('open') && parseInt(data.rm_CLOSE) == 0){
                    var map = {};
                    map[data.rm_ID] = data;
                    this._readRecords(map).done(lang.hitch(this, function(){
                        
                        delete this.unReadSelected[data.rm_ID];
                        delete this.unReadAll[data.rm_ID];
                        
                        this._readed(data);
                        
                        this._checkUnReadCmdVisible();
                    }));
                }
                
                var noteItems = parent.children('.noteItem');
                
                noteItems.not(item).removeClass('open');
                item.toggleClass('open');
            }));
            item.find('.itemDesc>:last-child').html(base.getTMDesc(data.crt_TS));
            
            item.find('.itemDetail td.tdTM').html((new Date(data.crt_TS)).format('yyyy-MM-dd HH:mm'));
            item.find('.itemDetail td.tdLevel').html(levelInfo[1]);
            item.find('.itemDetail td.tdType').html(this._getTypeName(data.rm_TP));
            item.find('.itemDetail td.tdDesc').html(encodeDesc);
            
            item.find('input[type="checkbox"]').unbind().change(lang.hitch(this, function(e){
                if(parseInt(data.rm_CLOSE) == 0){
                    if($(e.currentTarget).prop('checked')){
                        if(!this.unReadSelected){
                            this.unReadSelected = {};
                        }
                        
                        this.unReadSelected[data.rm_ID] = data;
                        
                    }else{
                        delete this.unReadSelected[data.rm_ID];
                    }
                    
                    this._checkUnReadCmdVisible();
                }
            }));
        },
        
        _checkUnReadCmdVisible: function(){
            var readSel = $(this.domNode).find('.top i.readSel');
            if(this.unReadSelected){
                if(Object.keys(this.unReadSelected).length > 0){
                    readSel.show();
                }else{
                    readSel.hide();
                }
            }else{
                readSel.hide();
            }
            
            var readAll = $(this.domNode).find('.top a.readAll');
            if(this.unReadAll){
                if(Object.keys(this.unReadAll).length > 0){
                    readAll.show();
                }else{
                    readAll.hide();
                }
            }else{
                readAll.hide();
            }
        },
        
        _resizeManual: function(){
            var parent = $(this.domNode).find('.rightContent>div>.bottom .notesContainer');
            var parentWidth = parent.width();
            
            parent.children('.noteItem').each(lang.hitch(this, function(index, e){
                var cur = $(e);
                var data = cur.data('data');
                
                cur.find('.itemDesc>span[data-toggle]').html(this._getSubTitle(base.encodeDescription(data.rm_DESC), parentWidth));
            }));
        },
        
        _setFilter: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/notification/unRead/statistic'
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
                //all
                data.all = parseInt(data.all);
                $(this.domNode).find('.noteFilter li>a[data="all"]>span').html(this._getCountSpanVal(data.all)).data('count', data.all);
                
                //note type catalog
                var noteTypeParent = $(this.domNode).find('.noteFilter1');
                if(data.noteType && data.noteType.length > 0){
                    var groupMap = {};
                    
                    for(var i=0; i<data.noteType.length; i++){
                        var rmType = parseInt(data.noteType[i].rm_TP);
                        var noteGroup = this._getTypeGroup(rmType);
                        
                        var gpInfo = groupMap[noteGroup];
                        if(gpInfo){
                            gpInfo.count += parseInt(data.noteType[i].count);
                            gpInfo.types.push(rmType);
                        }else{
                            groupMap[noteGroup] = {count: parseInt(data.noteType[i].count), types: [rmType]};
                        }
                    }
                    
                    var addedGroup = [];
                    for(var key in groupMap){
                        var gpNode = noteTypeParent.find('li>a[gpName="'+ key +'"]');
                        if(!gpNode || gpNode.length == 0){
                            var tmpNode = $('<li><a href="javascript:void(0);"></a></li>');
                            addedGroup.push(tmpNode);
                            
                            gpNode = tmpNode.find('a');
                        }
                        
                        gpNode.attr('gpName', key);
                        gpNode.attr('data', JSON.stringify(groupMap[key].types));
                        gpNode.html(key + '<span>' + this._getCountSpanVal(groupMap[key].count) + '</span>');
                        gpNode.find('span').data('count', groupMap[key].count);
                    }
                    
                    if(addedGroup.length > 0){
                        noteTypeParent.append(addedGroup);
                    }
                    
                    this._bindTypesClick();
                    
                }else{
                    noteTypeParent.children().remove();
                }
                
                //note level catalog
                var filter2CountMap = {};
                if(data.noteLevel && data.noteLevel.length > 0){
                    for(var i=0; i<data.noteLevel.length; i++){
                        filter2CountMap[parseInt(data.noteLevel[i].rm_LEVEL)] = parseInt(data.noteLevel[i].count);
                    }
                }
                
                $(this.domNode).find('.noteFilter2 li>a[data="0"]>span').html(this._getCountSpanVal(filter2CountMap[0])).data('count', filter2CountMap[0]);
                $(this.domNode).find('.noteFilter2 li>a[data="1"]>span').html(this._getCountSpanVal(filter2CountMap[1])).data('count', filter2CountMap[1]);
                $(this.domNode).find('.noteFilter2 li>a[data="2"]>span').html(this._getCountSpanVal(filter2CountMap[2])).data('count', filter2CountMap[2]);
                
                topic.publish('component/infoCenter/refreshInfoCount', {noteCount: data.all});
                
            })).fail(lang.hitch(this, function(){
                $(this.domNode).find('.noteFilter li>a[data="all"]>span').html(null);
                
                $(this.domNode).find('.noteFilter1>li').remove();
                
                $(this.domNode).find('.noteFilter2 li>a>span').html(null);
                
                topic.publish('component/infoCenter/refreshInfoCount', {noteCount: 0});
            }));
        },
        
        _getCountSpanVal: function(val){
            return !base.isNull(val) && parseInt(val) > 0 ? ('('+ val +')') : '';
        },
        
        _readRecords: function(recordsMap){
            var def = $.Deferred();
            
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/user/normal/notification',
                data: {
                    rmIds: JSON.stringify(Object.keys(recordsMap))
                }
            }).success(lang.hitch(this, function(ret){
                def.resolve();
            })).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _readed: function(record){
            var curVal = 0, spanNode = null;
            
            record.rm_CLOSE = 1;
            
            var noteItem = $(this.domNode).find('.rightContent>div>.bottom .notesContainer>.noteItem[rmID="'+ record.rm_ID +'"]').removeClass('unRead');
            noteItem.find('.itemDesc input[type="checkbox"]').prop('checked', false);
            
            var gpType = this._getTypeGroup(parseInt(record.rm_TP));
            var gpNode = $(this.domNode).find('.noteFilter1 li>a[gpName="'+ gpType +'"]');
            if(gpNode && gpNode.length > 0){
                spanNode = gpNode.find('span');
                curVal = spanNode.data('count');
                if(!base.isNull(curVal)){
                    spanNode.html(this._getCountSpanVal(curVal - 1)).data('count', curVal - 1);
                }
            }
            
            spanNode = $(this.domNode).find('.noteFilter2 li>a[data="'+ record.rm_LEVEL +'"]>span');
            curVal = spanNode.data('count');
            if(!base.isNull(curVal)){
                spanNode.html(this._getCountSpanVal(curVal - 1)).data('count', curVal - 1);
            }
            
            spanNode = $(this.domNode).find('.noteFilter li>a[data="all"]>span');
            curVal = spanNode.data('count');
            if(!base.isNull(curVal)){
                spanNode.html(this._getCountSpanVal(curVal - 1)).data('count', curVal - 1);
            }
            
            topic.publish('component/infoCenter/refreshInfoCount', {noteCount: curVal - 1});
            topic.publish('topInfo/refreshInfo', {increment: -1});
        },
        
        _getTypeGroup: function(typeVal){
            switch(typeVal){
                case 0: 
                case 8:
                case 9:
                case 10:
                case 11:
                    return '设备相关';
                case 1:
                case 2:
                case 3:
                    return '运维相关';
                case 4:
                    return '第三方推送';
                case 5:
                case 6:
                    return '固件升级';
                case 7:
                    return '平台通知';
                case 12:
                case 13:
                case 14:
                case 15:
                	return '用户资源';
                default:
                    return '其他';
            }
        },
        
        _getTypeName: function(typeVal){
            switch(typeVal){
                case 0: 
                    return '设备注册';
                case 8:
                    return '设备参数更新失败';
                case 9:
                    return '设备信息上报';
                case 10:
                    return '设备设置为不公开';
                case 11:
                    return '设备自定义命令反馈';
                case 1:
                    return '运维人员注册';
                case 2:
                    return '运维人员审核';
                case 3:
                    return '工单';
                case 4:
                    return '第三方推送阻塞';
                case 5:
                     return '固件升级失败';
                case 6:
                    return '固件升级成功';
                case 7:
                    return '平台通知';
                case 12:
                	return '图像存储空间不足';
                case 13:
                	return '短信数量不足';
                case 14:
                	return '视频流指标不足';
                case 15:
                	return '第三方服务欠费';
                default:
                    return '其他';
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/infoCenter/refresh', lang.hitch(this, function(data){
                this._setFilter();
                
                if(this._filterAction($(this.domNode).find('.noteFilter li>a[data="all"]'), true)){
                    this._setData();
                }
            }));
            
            this.own(sub1);
        },
    });
});
