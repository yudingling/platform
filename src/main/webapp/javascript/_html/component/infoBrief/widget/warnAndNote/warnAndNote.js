
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "dojo/text!./template/warnAndNote.html",
    "tool/css!./css/warnAndNote.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        template){
    
    return declare("component.infoBrief.warnAndNote", [_Widget], {
        baseClass: "component_infoBrief_warnAndNote",
        templateString: template,
        
        authApi: {
            updateWarn: '/platformApi/own/warn/update'
        },
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.remindIds = [];
            this.remindTotal = 0;
            
            this.warnIds = [];
            this.warnTotal = 0;
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            this.canClose = Boolean($(this.domNode).find('div.page.warns>.infoHead a.closeAll').attr('bindAuthResult'));
            //we need 'this.canClose' in '_setData', so call this in bindAuthed rather than startup
            this._setData();
        },
        
        refresh: function(){
            this._setData();
        },
        
        changeSelect: function(selType){
            var curPage = $(this.domNode).find('div.page.' + selType);
            $(this.domNode).find('div.page').not(curPage).hide();
            curPage.css('display', 'block');
        },
        
        _initDom: function(){
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(remindCount, warnCount){
            var remindChildren = $(this.domNode).find('.page.notes>.itemList').children();
            var warnChildren = $(this.domNode).find('.page.warns>.itemList').children();
            
            if(remindCount == 0){
                remindChildren.remove();
            }else if(remindCount < remindChildren.length){
                for(var i=remindCount; i<remindChildren.length; i++){
                    $(remindChildren[i]).remove();
                }
            }
            
            if(warnCount == 0){
                warnChildren.remove();
            }else if(warnCount < warnChildren.length){
                for(var i=warnCount; i<warnChildren.length; i++){
                    $(warnChildren[i]).remove();
                }
            }
        },
        
        _setData: function(){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/user/normal/infoList',
                data: {
                    length: 10
                }
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
                this._clear(data.remindList? data.remindList.length : 0, data.wrnList? data.wrnList.length : 0);
                
                var wrnCount = parseInt(data.wrnCount), remindCount = parseInt(data.remindCount);
                
                topic.publish('topInfo/refreshInfo', {bdSize: wrnCount + remindCount});
                
                this._createNotes(remindCount, data.remindList);
                this._createWarns(wrnCount, data.wrnList);
                
                if(data.remindCount > 0 || data.wrnCount == 0){
                    topic.publish('component/infoBrief/warnAndNote/selTypeChange', {selType: 'notes'});
                }else{
                    topic.publish('component/infoBrief/warnAndNote/selTypeChange', {selType: 'warns'});
                }
                
            })).fail(lang.hitch(this, function(){
                this._clear(0, 0);
                
                this.remindTotal = 0;
                this.remindIds = [];
                
                this.warnTotal = 0;
                this.warnIds = [];
                
                topic.publish('component/infoBrief/warnAndNote/selTypeChange', {selType: 'notes'});
            }));
        },
        
        _createNotes: function(size, list){
            this._updateNotesTitle(size, list.length);
            
            var ids = [];
            if(list.length > 0){
                var items = [];
                var parent = $(this.domNode).find('.page.notes>.itemList');
                
                for(var i=0; i<list.length; i++){
                    this._genNoteItem(parent, i, list[i], i % 2 != 0);
                    ids.push(list[i].rm_ID);
                }
            }
            
            this.remindTotal = size;
            this.remindIds = ids;
        },
        
        _updateNotesTitle: function(total, current){
            topic.publish('component/infoBrief/warnAndNote/refreshTotalSize', {selType: 'notes', total: total});
            
            var infoHeadTitle = current > 0? ('最新 <span>'+ current +'</span> 条消息') : '暂无通知';
            $(this.domNode).find('div.page.notes>.infoHead span>span').html(infoHeadTitle);
            
            var readAllNode = $(this.domNode).find('div.page.notes>.infoHead a.readAll').unbind();
            if(current > 0){
                readAllNode.removeClass('hidden').click(lang.hitch(this, function(){
                    this._readedAll();
                }));
                
            }else{
                //when parent of readAllNode is invisible, the 'hide/css' method has no effect to the dom node, set its visibility with class
                readAllNode.addClass('hidden');
            }
        },
        
        _readedAll: function(){
            this._closeNote(this.remindIds).done(lang.hitch(this, function(){
                this._setData();
            }));
        },
        
        _readedSingle: function(id, itemNode){
            this._closeNote([id]).done(lang.hitch(this, function(){
                itemNode.remove();
                
                this.remindIds.remove(id);
                this.remindTotal -= 1;
                topic.publish('topInfo/refreshInfo', {increment: -1});
                
                var parent = $(this.domNode).find('.page.notes>.itemList');
                
                if(this.remindTotal <= 0){
                    this._setData();
                    
                }else if(this.remindTotal > this.remindIds.length){
                    //get one more
                    base.ajax({
                        type: 'GET',
                        url: base.getServerNM() + 'platformApi/own/user/normal/infoList',
                        data: {
                            excludeRemindIds: JSON.stringify(this.remindIds),
                            length: 1,
                            dataType: 'remind',
                            ignoreSize: true
                        }
                    }).success(lang.hitch(this, function(ret){
                        var data = ret.data;

                        if(data.remindList.length == 1){
                            this.remindIds.push(data.remindList[0].rm_ID);

                            //create item
                            this._genNoteItem(parent, -1, data.remindList[0]);
                            this._refreshSplit(parent);
                        }

                        this._updateNotesTitle(this.remindTotal, this.remindIds.length);

                    })).fail(lang.hitch(this, function(){
                        this._refreshSplit(parent);
                        this._updateNotesTitle(this.remindTotal, this.remindIds.length);

                    }));
                    
                }else{
                    this._refreshSplit(parent);
                    this._updateNotesTitle(this.remindTotal, this.remindIds.length);
                }
                
            }));
        },
        
        _closeNote: function(rmIds){
            var def = $.Deferred();
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/user/normal/notification',
                data: {
                    rmIds: JSON.stringify(rmIds)
                }
            }).success(lang.hitch(this, function(ret){
                def.resolve();
            })).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _genNoteItem: function(parent, i, itemData, isSplit){
            var itemNode = i>=0? parent.children(':nth-child('+ (i+1) +')') : null;
            
            var isNew = false;
            if(itemNode == null || itemNode.length == 0){
                var itemNode = $('<div><div class="media"><a class="media-left" href="javascript:void(0);">'
                    + '<img></a><div class="media-body">'
                    + '<span></span></div></div>'
                    + '<div class="itemFoot"><a href="javascript:void(0);">已读</a>'
                    + '<span></span></div></div>');
                
                isNew = true;
            }
            
            if(isSplit){
                itemNode.addClass('split');
            }
            
            itemNode.find('.media-left>img').attr('src', this._getImgSrc(itemData.rm_LEVEL));
            itemNode.find('.media-body>span').html(base.subDescription(itemData.rm_DESC, 300));
            itemNode.find('.itemFoot>span').html(base.getTMDesc(itemData.crt_TS));
            
            itemNode.find('.itemFoot>a:first-child').unbind().click(lang.hitch(this, function(){
                //disable scroll to avoid scrollbar twinkle when it stay at bottom
                topic.publish('index/infoBrief/disableScroll', {disabled: true});
                itemNode.animate({height: '0px'}, 300, lang.hitch(this, function(){
                    this._readedSingle(itemData.rm_ID, itemNode);
                    topic.publish('index/infoBrief/disableScroll', {disabled: false});
                }));
            }));
            
            if(isNew){
                parent.append(itemNode);
            }
        },
        
        
        
        _getImgSrc: function(level){
            level = parseInt(level);
            
            var src = base.getServerNM() + 'javascript/_html/component/infoBrief/widget/warnAndNote/img/';
            if(level == 0){
                return src + 'info.svg';
            }else if(level == 1){
                return src + 'warn.svg';
            }else if(level == 2){
                return src + 'error.svg';
            }
            
            return '';
        },
        
        _updateWarnsTitle: function(total, current){
            topic.publish('component/infoBrief/warnAndNote/refreshTotalSize', {selType: 'warns', total: total});
            
            var infoHeadTitle = current > 0? ('最新 <span>'+ current +'</span> 条告警') : '暂无告警';
            $(this.domNode).find('div.page.warns>.infoHead span>span').html(infoHeadTitle);
            
            if(this.canClose){
                var closeAllNode = $(this.domNode).find('div.page.warns>.infoHead a.closeAll').unbind();
                if(current > 0){
                    closeAllNode.removeClass('hidden').click(lang.hitch(this, function(){
                        this._closedAll();
                    }));

                }else{
                    closeAllNode.addClass('hidden');
                }
            }
        },
        
        _createWarns: function(size, list){
            this._updateWarnsTitle(size, list.length);
            
            var ids = [];
            if(list.length > 0){
                var items = [];
                var parent = $(this.domNode).find('.page.warns>.itemList');
                
                for(var i=0; i<list.length; i++){
                    this._genWarnItem(parent, i, list[i], i % 2 != 0);
                    ids.push(list[i].wrn_ID);
                }
            }
            
            this.warnTotal = size;
            this.warnIds = ids;
        },
        
        _closedAll: function(){
            this._closeWarn(this.warnIds).done(lang.hitch(this, function(){
                this._setData();
            }));
        },
        
        _closedSingle: function(id, itemNode){
            this._closeWarn([id]).done(lang.hitch(this, function(){
                itemNode.remove();
                
                this.warnIds.remove(id);
                this.warnTotal -= 1;
                
                topic.publish('topInfo/refreshInfo', {increment: -1});
                var parent = $(this.domNode).find('.page.warns>.itemList');
                
                if(this.warnTotal <= 0){
                    this._setData();
                    
                }else if(this.warnTotal > this.warnIds.length){
                    //get one more
                    base.ajax({
                        type: 'GET',
                        url: base.getServerNM() + 'platformApi/own/user/normal/infoList',
                        data: {
                            excludeWarnIds: JSON.stringify(this.warnIds),
                            length: 1,
                            dataType: 'warn',
                            ignoreSize: true
                        }
                    }).success(lang.hitch(this, function(ret){
                        var data = ret.data;

                        if(data.wrnList.length == 1){
                            this.warnIds.push(data.wrnList[0].wrn_ID);

                            //create item
                            this._genWarnItem(parent, -1, data.wrnList[0]);
                            this._refreshSplit(parent);
                        }

                        this._updateWarnsTitle(this.warnTotal, this.warnIds.length);

                    })).fail(lang.hitch(this, function(){
                        this._refreshSplit(parent);
                        this._updateWarnsTitle(this.warnTotal, this.warnIds.length);

                    }));
                    
                }else{
                    this._refreshSplit(parent);
                    this._updateWarnsTitle(this.warnTotal, this.warnIds.length);
                }
                
            }));
        },
        
        _closeWarn: function(wrnIds){
            var def = $.Deferred();
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/warn/update',
                data: {
                    actionType: 'close',
                    wrnIds: JSON.stringify(wrnIds)
                }
            }).success(lang.hitch(this, function(ret){
                def.resolve();
            })).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _genWarnItem: function(parent, i, itemData, isSplit){
            var itemNode = i>=0? parent.children(':nth-child('+ (i+1) +')') : null;
            
            var isNew = false;
            if(itemNode == null || itemNode.length == 0){
                var itemNode = $('<div><div class="media"><a class="media-left" href="javascript:void(0);">'
                    + '<img></a><div class="media-body">'
                    + '<h5 class="media-heading cnm"></h5><h5 class="media-heading metadata"></h5>'
                    + '<span></span></div></div>'
                    + '<div class="itemFoot"><a href="javascript:void(0);">关闭</a>'
                    + '<span></span></div></div>');
                
                isNew = true;
            }
            
            if(isSplit){
                itemNode.addClass('split');
            }
            
            itemNode.find('.media-left>img').attr('src', this._getImgSrc(itemData.wrn_LEVEL));
            
            var pWidth = $(this.domNode).width();
            var subLen1 = parseInt((pWidth - 50) / 7), subLen2 = parseInt((pWidth - 80) / 7);
            if(subLen1 <= 0){
            	subLen1 = 35;
            }
            if(subLen2 <= 0){
            	subLen2 = 32;
            }
            itemNode.find('.media-body>.media-heading.cnm').html(base.subDescription(itemData.c_NM, subLen1));
            
            var metadataNode = itemNode.find('.media-body>.media-heading.metadata');
            if(itemData.meta_CID && itemData.meta_CID.length > 0){
                metadataNode.html(base.subDescription(itemData.meta_NM && itemData.meta_NM.length > 0? itemData.meta_NM : itemData.meta_CID, subLen2));
            }else{
                metadataNode.remove();
            }
            
            itemNode.find('.media-body>span').html(base.subDescription(itemData.wrn_DESC, 300));
            itemNode.find('.itemFoot>span').html(base.getTMDesc(itemData.crt_TS));
            
            if(this.canClose){
                itemNode.find('.itemFoot>a:first-child').unbind().click(lang.hitch(this, function(){
                    topic.publish('index/infoBrief/disableScroll', {disabled: true});
                    itemNode.animate({height: '0px'}, 300, lang.hitch(this, function(){
                        this._closedSingle(itemData.wrn_ID, itemNode);
                        topic.publish('index/infoBrief/disableScroll', {disabled: false});
                    }));
                }));
                
            }else{
                itemNode.find('.itemFoot>a:first-child').hide();
            }
            
            if(isNew){
                parent.append(itemNode);
            }
        },
        
        _refreshSplit: function(nodeParent){
            var children = nodeParent.children();
            for(var i=0; i<children.length; i++){
                if(i % 2 == 0){
                    $(children[i]).removeClass('split');
                }else{
                    $(children[i]).addClass('split');
                }
            }
        }
    });
});
