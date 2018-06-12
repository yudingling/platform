
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    "root/colorRainbow/rainbowvis",
    'root/fileSelector/FileSelector',
    'common/widget/maintRecordDetail/maintRecordDetail',
    "dojo/text!./template/actedList.html",
    "tool/css!./css/actedList.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        ColorRainbow,
        FileSelector,
        MaintRecDetail,
        template){
    
    return declare("component.myMaint.actedList", [_Widget], {
        baseClass: "component_myMaint_actedList",
        templateString: template,
        
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
                var sfeef = $(this.domNode).find('.modal .imgAdder');
                CustomScrollBar.init($(this.domNode).find('.modal .imgAdder'), 'x');
                
            }), 500);
        },
        
        destroy: function(){
            this.inherited(arguments);

            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
        },
        
        _initDom: function(){
            this._initDom_search();
            this._initDom_page();
            this._initDom_table();
            this._initDom_response();
        },
        
        _initDom_response: function(){
            this.fs = new FileSelector(
                $(this.domNode).find('.modal .imgAdder .imgAdderCC>.tmp'), 
                'image/jpeg,image/jpg,image/png,image/bmp', 
                lang.hitch(this, function(e){
                    this._loadImages(e);
            }));
            this.fs.multiSelect();
            this.own(this.fs);
        },
        
        _initDom_search: function(){
            var parentNode = $(this.domNode).find('.mrContent>.top');
            
            parentNode.find('.searchField button.search').click(lang.hitch(this, function(){
                this._setData();
            }));
            
            parentNode.find('.searchField>div input').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                    this._setData();
                }
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
                
                this._padLeft(false);
            }));
        },
        
        _padLeft: function(isPad){
            topic.publish('component/myMaint/padLeft', isPad);
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
        
        _setData: function(){
            var pageSize = 15;
            
            var pageParent = $(this.domNode).find('.mrContent>.top .warnPage');
            
            var curPageNode = pageParent.find('.currentPage');
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
            
            var recContainer = $(this.domNode).find('.mrContent>.bottom .recContainer');
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/myMaint/normal/actedMaintRecord',
                data: {
                    start: (curPage - 1) * pageSize,
                    length: pageSize,
                    search: $(this.domNode).find('.mrContent>.top>.searchField>div input').val()
                }
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
                if(this.totalPage == 0){
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
            var executingNode = $(this.domNode).find('.mrContent>.top span.executing');
            executingNode.text(this.statistic[0]);
            
            if(this.statistic[0] == 0){
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
                diffWith = 42 + 100 + 170 + 110;
            }
            
            availWidth = parentWidth - diffWith;
            
            if(availWidth <= 0){
                availWidth = $(this.domNode).parent().width() - diffWith;
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
                var endTs = base.isNull(data.maint_END_TS)?(new Date()).getTime() : data.maint_END_TS;
                
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
            var item = i >= 0 ? parent.find('tr:nth-child(' +(i + 1) + ')') : null;
            
            if(!item || item.length == 0){
                var headStr= '<tr class="h"><th style="width: 50px;"></th><th>工单简介</th><th style="width:100px; text-align: center;">来源</th><th style="width:170px; padding-left: 20px;">已耗时</th><th style="width:110px; text-align: right; padding-right: 20px;">创建日期</th></tr>';
                
                if(i == 0){
                    item = $(headStr);
                    parent.append(item);
                    return;
                    
                }else{
                    item = $('<tr><td></td><td></td><td></td><td></td><td></td></tr>');
                    
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
                if(item.hasClass('active')){
                    return;
                }
                
                var bottom = $(this.domNode).find('.mrContent>.bottom');
                if(!bottom.hasClass('showDetail')){
                    this._padLeft(true);
                    
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
            item.children('td:nth-child(4)').html(this._getTimePeriodHtml(data));
            item.children('td:nth-child(5)').html(base.getTMDesc(data.crt_TS));
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
            
            var btnResponse = parent.find('button.recResponse');
            var btnClose = parent.find('button.recClose');
            var btnResponseSave = $(this.domNode).find('.modal .modal-footer .btn');
            
            if(data.maint_STATUS == 2){
                btnClose.unbind().hide();
                btnResponse.unbind().hide();
                
            }else{
                btnClose.show().unbind().click(lang.hitch(this, function(){
                    base.confirm('关闭工单', '是否确定结束工单?', lang.hitch(this, function(){
                        this._closeRecord(data);
                        
                    }), function(){});
                }));
                
                btnResponse.show().unbind().click(lang.hitch(this, function(){
                    this.files = {};
                    $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                    
                    CustomScrollBar.update($(this.domNode).find('.modal .imgAdder'), 'x');
                    
                }));
                
                btnResponseSave.unbind().click(lang.hitch(this, function(){
                    this._saveResponse(data);
                }));
            }
        },
        
        _closeRecord: function(data){
            base.ajax({
                type: 'DELETE',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/myMaint/normal/maintRecord',
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
                
                this.statistic[0] = this.statistic[0] - 1;
                
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
                parent.find('tr>td:nth-child(3), tr>th:nth-child(3)').hide();
            }else{
                parent.find('tr>td:nth-child(3), tr>th:nth-child(3)').show();
            }
            
            parent.children('tr:not(.h):not(.empty)').each(lang.hitch(this, function(index, e){
                var cur = $(e);
                var data = cur.data('data');
                
                cur.children('td:nth-child(2)').html(this._getSubTitle(data.maint_DESC, parentWidth, detailShown));
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
        
        _loadImages: function(file){
            if(file.currentTarget.files.length == 0){
                return;
            }
            
            var tmpDiv = $(this.domNode).find('.modal .imgAdder .imgAdderCC>.tmp');
            var scrollNode = $(this.domNode).find('.modal .imgAdder');
            
            //image preview in html5
            for(var i=0; i<file.currentTarget.files.length; i++){
                var imgId = 'img' + base.uuid();
                var fileObj = file.currentTarget.files[i];
                
                this._loadImages_Html5(imgId, fileObj, tmpDiv, scrollNode);
                this.files[imgId] = fileObj;
            }
        },
        
        _loadImages_Html5: function(imgId, fileObj, tmpDiv, scrollNode){
            var reader = new FileReader();
            
            reader.onload = lang.hitch(this, function(e){
                var newDiv = $('<div class="hvr-grow-shadow"><img><div><i class="fa fa-times"></i><div></div>');
                tmpDiv.after(newDiv);

                newDiv.find('img').attr('src', e.target.result);
                newDiv.find('div').click(lang.hitch(this, function(){
                    newDiv.remove();
                    delete this.files[imgId];

                    CustomScrollBar.update(scrollNode, 'x');
                }));
            });

            reader.readAsDataURL(fileObj);
        },
        
        _saveResponse: function(data){
            var ct = $(this.domNode).find('.modal textarea').val();
            if(ct.length == 0){
                base.error('错误', '反馈内容不能为空');
                return;
            }
            
            var spin = new Spin($(this.domNode).find('.modal .modal-content'));
            
            var fileKeys = Object.keys(this.files);
            if(fileKeys.length > 0){
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/myMaint/response',
                    data: {
                        imgSize: fileKeys.length
                    }
                }).success(lang.hitch(this, function(ret){
                    var auth = ret.data.auth;
                    var idList = ret.data.fileIds;
                    
                    var defs = [];
                    for(var i=0; i<idList.length; i++){
                        defs.push(this._upload(auth, idList[i], this.files[fileKeys[i]]));
                    }
                    
                    $.when.apply($, defs).then(lang.hitch(this, function(){
                        this._saveResponseCloud(data, ct, idList, spin);
                        
                    }), lang.hitch(this, function(){
                        base.error('错误', '图片上传失败');
                        spin.destroy();
                    }));
                    
                })).fail(function(){
                    spin.destroy();
                });
                
            }else{
                this._saveResponseCloud(data, ct, null, spin);
            }
        },
        
        _saveResponseCloud: function(data, content, imgs, spin){
            base.ajax({
                type: 'POST',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/myMaint/response',
                data: {
                    maintId: data.maint_ID,
                    content: content,
                    imgIds: JSON.stringify(imgs)
                }
            }).success(lang.hitch(this, function(ret){
                this.detailObj.response(ret.data);
                
                this._clearResponse();
                this._scrollToEnd();
                
                spin.destroy();
                $(this.domNode).children('.modal').modal('hide');
                
            })).fail(function(){
                spin.destroy();
            })
        },
        
        _clearResponse: function(){
            $(this.domNode).find('.modal textarea').val(null);
            $(this.domNode).find('.modal .imgAdder .imgAdderCC>div:not(.tmp)').remove();
            this.files = {};
            
            this.fs.getSelector().val(null);
        },
        
        _upload: function(uploadInfo, fileId, fileObj) {
            var def = $.Deferred();
            
            var fd = new FormData();
            fd.append('key', fileId);
            fd.append('OSSAccessKeyId', uploadInfo.accessKeyId);
            fd.append('Signature', uploadInfo.auth);
            fd.append('policy', uploadInfo.url);
            fd.append('file', fileObj);
            
            $.ajax({
                type: 'POST',
                url: 'http://' + uploadInfo.host,
                data: fd,
                processData: false,
                contentType: false,
                xhrFields:{
                    //withCredentials: true  //send the cookie in cors
                },
                beforeSend: function(xhr){
                    //xhr.setRequestHeader("Authorization", "Basic " + Utils.getUsernamePassword());
                },
                success: lang.hitch(this, function(ret){
                    def.resolve();
				}),
                fail: lang.hitch(this, function(error){
                    def.reject();
				})
            });
            
            return def.promise();
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/myMaint/added', lang.hitch(this, function(data){
                this._appendRecord(data);
            }));
            
            this.own(sub1);
        }
    });
});
