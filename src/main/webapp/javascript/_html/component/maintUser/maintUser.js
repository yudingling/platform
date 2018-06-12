
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    "common/widget/maintAreaTree/maintAreaTree",
    "root/objectSelector/ObjectSelector",
    "dojo/text!./template/maintUser.html",
    "tool/css!./css/maintUser.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        AreaTree,
        ObjectSelector,
        template){
    
    return declare("component.maintUser", [_Widget], {
        baseClass: "component_maintUser",
        templateString: template,
        
        selfAuth: true,
        
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
            
            this.defer(lang.hitch(this, function(){
            	CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._destroySelTree();
        },
        
        _initDom: function(){
            this._initDom_areaCmd();
            this._initDom_areaTree();
            this._initDom_page();
            this._initDom_userCmd();
        },
        
        _initDom_areaCmd: function(){
            var nodeP = $(this.domNode).find('.content>.ctTop');
            
            nodeP.find('li.append>a').click(lang.hitch(this, function(e){
            	if(this.areaTree){
            		this.areaTree.addArea();
            	}
            }));
            
            nodeP.find('li.delete>a').click(lang.hitch(this, function(e){
            	if(this.areaTree){
            		this._toggleDeleteStatus(true);
            		
            		this.areaTree.toggleDelete();
            	}
            }));
            
            nodeP.find('li.cancel>a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        		this.areaTree.toggleDelete();
        	}));
        	
        	nodeP.find('li.ok>a').click(lang.hitch(this, function(){
                this.areaTree.deleteChecked();
        	}));
            
            $(this.domNode).find('.content>.ctTop button').click(lang.hitch(this, function(){
            	this._refreshAreaTree();
            }));
            
            $(this.domNode).find('.content>.ctTop .nameOrId').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._refreshAreaTree();
                }
            }));
        },
        
        _initDom_areaTree: function(){
            this.areaTree = new AreaTree({
        		groupEdit: true,
                expandFirst: false,
                maxTitleAsciiLen: 35,
                canDrag: true,
        		click: lang.hitch(this, function(treeNode){
                    this.currentArea = treeNode;
                    
                    this._setUserData();
                })
            });
            
            $(this.domNode).find('.content>.ctBottom>.list').append($(this.areaTree.domNode));
            this.areaTree.startup();
            this.own(this.areaTree);
        },
        
        _initDom_userCmd: function(){
            var userCmd = $(this.domNode).find('.content>.ctBottom>.detail>.detailTop');
            
            userCmd.find('.uAdd').click(lang.hitch(this, function(e){
                this._hideAreaSelector();
            	this._addUser();
            }));
            
            userCmd.find('.uDisable').click(lang.hitch(this, function(e){
                this._hideAreaSelector();
                
                base.confirm('禁用用户', '是否要禁用所选定的用户?', lang.hitch(this, function(){
                    this._disableUser();
                }), function(){});
            }));
            
            userCmd.find('.uEnable').click(lang.hitch(this, function(e){
                this._hideAreaSelector();
                
                base.confirmSave('启用用户', '是否要启用所选定的用户?', lang.hitch(this, function(){
                    this._enableUser();
                    
                }), function(){});
            }));
            
            userCmd.find('.uMove').click(lang.hitch(this, function(e){
            	this._moveUser();
            }));
            
            userCmd.find('.uVerify').click(lang.hitch(this, function(e){
                this._hideAreaSelector();
                
            	this._verifyUser();
            }));
        },
        
        _initDom_page: function(){
            var parentNode = $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .notePage');
            
            parentNode.find('.currentPage').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._setUserData();
                }
            }));
            
            parentNode.find('i.fa-arrow-right').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = parentNode.find('.currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur < this.totalPage){
                        curPageNode.val(cur + 1);
                        
                        this._setUserData();
                    }
                }
            }));
            
            parentNode.find('i.fa-arrow-left').click(lang.hitch(this, function(event){
                if(!base.isNull(this.totalPage)){
                    var curPageNode = parentNode.find('.currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur > 1){
                        curPageNode.val(cur - 1);
                        
                        this._setUserData();
                    }
                }
            }));
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function(node, newCount){
            node.find('tr.empty').remove();
            
            var children = node.find('tr');
            if(base.isNull(newCount) || newCount == 0){
                children.remove();
                
            }else if(children.length > newCount){
                for(var i = newCount; i < children.length; i++){
                    $(children[i]).remove();
                }
            }
            
            node.find('input[type="checkbox"]').prop('checked', false);
        },
        
        _resetUserCmdStatus: function(ok){
            this._destroySelTree();
            
            var userCmd = $(this.domNode).find('.content>.ctBottom>.detail>.detailTop');
            if(ok){
                userCmd.find('.uAdd').show();
                userCmd.find('div').hide();
            }else{
                userCmd.find('.uAdd').hide();
                userCmd.find('div').hide();
            }
        },
        
        _setUserData: function(){
            var userContainer = $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .userListCC>table');
            var pageNodes = $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .notePage');
            
            if(!this.currentArea){
                pageNodes.find('.currentPage').val('0');
                pageNodes.find('.totalPage').val('0');
                
                userContainer.children().remove();
                
                this._resetUserCmdStatus(false);
                
                return;
                
            }
            
            this._resetUserCmdStatus(true);
            
            var pageSize = 15;
            
            var curPageNode = pageNodes.find('.currentPage');
            
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
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/maint/normal/maintUser',
                data: {
                    search: this.searchStr,
                    gpId: this.currentArea.dId,
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function(ret){
                var data = ret.data[1];
                
                this._clear(userContainer, data.length);
                
                if(data.length > 0){
                    this._createItem(0, userContainer);
                    
                    for(var i = 0; i < data.length; i++){
                        this._createItem(i+1, userContainer, data[i]);
                    }
                }else{
                    userContainer.append('<tr class="empty"><td>暂无记录!</td></tr>');
                }
                
                this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);
                pageNodes.find('.totalPage').html(this.totalPage);
                if(this.totalPage == 0){
                    curPageNode.val(0);
                }
                
            })).fail(lang.hitch(this, function(){
                pageNodes.find('.currentPage').val('0');
                pageNodes.find('.totalPage').val('0');
                
                userContainer.children().remove();
                userContainer.append('<tr class="empty"><td>获取数据失败!</td></tr>');
            }));
        },
        
        _getIconUrl: function(data){
            var url =  base.isNull(data.u_ICON) ? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + data.u_ICON);
            
            return 'url(' + url + ')';
        },
        
        _createItem: function(i, parent, data){
            var item = i >= 0 ? parent.find('tr:nth-child(' + (i + 1) + ')') : null;
            
            if (!item || item.length == 0) {
                var headStr= '<tr class="h"><th></th><th>运维用户ID</th><th>姓名</th><th>状态</th><th>创建日期</th></tr>';
                
                if(i == 0){
                    item = $(headStr);
                    parent.append(item);
                    return;
                    
                }else{
                    item = $('<tr>'
                        + '<td><div class="checkbox checkbox-primary"><input class="styled" type="checkbox"><label></label></div><div class="icon"></div></td>'
                        + '<td></td><td></td><td></td><td></td></tr>');
                    
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
            
            item.attr('uid', data.u_ID);
            
            var td1 = item.children('td:nth-child(1)');
            td1.find('.checkbox').data('item', data);
            td1.find('.icon').css('background-image', this._getIconUrl(data));
            
            item.children('td:nth-child(2)').html(data.u_ID);
            item.children('td:nth-child(3)').html(data.u_NM);
            
            this._updateUserStatusNode(item, data);
            
            item.children('td:nth-child(5)').html((new Date(data.crt_TS)).format('yyyy-MM-dd'));
            
            item.find('input[type="checkbox"]').unbind().change(lang.hitch(this, function(e){
                if($(e.currentTarget).prop('checked')){
                    if(!this.userSelected){
                        this.userSelected = {};
                    }
                    
                    this.userSelected[data.u_ID] = data;

                }else{
                    delete this.userSelected[data.u_ID];
                }
                
                this._checkUserCmdVisible();
                
                this._hideAreaSelector();
            }));
        },
        
        _hideAreaSelector: function(){
            if(this.areaSelector){
                this.areaSelector.hide();
            }
        },
        
        _updateUserStatusNode: function(item, data){
            var statusStr = "", statusCls = "";
            if(data.u_DISABLED == 1){
                statusStr = "已禁用";
                statusCls = 'uDisabled';
            }else if(data.u_ACTIVE == 0){
                statusStr = "未激活";
                statusCls = 'uUnActive';
            }else{
                statusStr = "正常";
                statusCls = 'uNormal';
            }
            item.removeClass('uDisabled uUnActive uNormal').addClass(statusCls);
            item.children('td:nth-child(4)').html(statusStr);
        },
        
        _checkUserCmdVisible: function(){
            var userCmd = $(this.domNode).find('.content>.ctBottom>.detail>.detailTop>div');
            if(this.userSelected){
                if(Object.keys(this.userSelected).length > 0){
                    userCmd.show();
                }else{
                    userCmd.hide();
                }
            }else{
                userCmd.hide();
            }
        },
        
        _toggleDeleteStatus: function(isDelete){
            var nodeP = $(this.domNode).find('.content>.ctTop');
            
        	if(isDelete){
        		nodeP.find('li.delete').hide();
        		nodeP.find('li.append').hide();
        		
        		nodeP.find('li.ok').show();
        		nodeP.find('li.cancel').show();
                
                nodeP.find('input.nameOrId, button').prop('disabled', true);
                
        	}else{
        		nodeP.find('li.ok').hide();
        		nodeP.find('li.cancel').hide();
        		
        		nodeP.find('li.delete').show();
        		nodeP.find('li.append').show();
                
                nodeP.find('input.nameOrId, button').prop('disabled', false);
        	}
        },
        
        _refreshAreaTree: function(){
            if(this.areaTree){
                this.searchStr = $(this.domNode).find('.content>.ctTop .nameOrId').val();
                
                this.areaTree.refresh(this.searchStr);
                
                //clear
                this.currentArea = null;
                this._setUserData();
            }
        },
        
        _resetModalContent: function(){
            var modal = $(this.domNode).children('.modal');
            
            modal.find('.modal-body label.gpNm').text(this.currentArea.name);
            
            modal.find('.modal-body input').val(null);
        },
        
        _addUser: function(){
            if(!this.currentArea){
                return;
            }
            
            this._resetModalContent();
            
            $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
            
            $(this.domNode).find('.modal button.sure').unbind().click(lang.hitch(this, function(){
                this._saveOnAdd();
            }));
        },
        
        _disableUser: function(){
            if(this.userSelected){
                var uidList = [];
                for(var uid in this.userSelected){
                    if(this.userSelected[uid].u_DISABLED == 0){
                        uidList.push(uid);
                    }
                }
                
                if(uidList.length > 0){
                    this._saveOnUpdate(uidList, 'disable');
                }else{
                    base.info('提醒', '请选择需要禁用的用户');
                }
            }
        },
        
        _enableUser: function(){
            if(this.userSelected){
                var uidList = [];
                for(var uid in this.userSelected){
                    if(this.userSelected[uid].u_DISABLED == 1){
                        uidList.push(uid);
                    }
                }
                
                if(uidList.length > 0){
                    this._saveOnUpdate(uidList, 'enable');
                }else{
                    base.info('提醒', '请选择需要启用的用户');
                }
            }
        },
        
        _moveUser: function(){
            if(this.userSelected){
                var uidList = Object.keys(this.userSelected);
                
                if(uidList.length > 0){
                    this._destroySelTree();
                    
                    this.areaSelector = new ObjectSelector(
                        $(this.domNode).find('.content>.ctBottom>.detail>.detailTop'),
                        '选择运维区域', 
                        lang.hitch(this, function(objContainer){


                            this.selTree = new AreaTree({
                                groupEdit: false,
                                expandFirst: false,
                                maxTitleAsciiLen: 31,
                                canDrag: false,
                                click: lang.hitch(this, function(treeNode){
                                    objContainer.data('data', treeNode);
                                })
                            });

                            objContainer.append($(this.selTree.domNode));
                            this.selTree.startup();
                        })
                    );
                    
                    this.areaSelector.show(lang.hitch(this, function(objContainer){
                        return this._saveOnMove(objContainer.data('data'));
                        
                    }), {width: '270px', height: '300px', top: '60px', right: '150px' });
                    
                }else{
                    base.info('提醒', '请选择需要变更区域的用户');
                }
            }
        },
        
        _verifyUser: function(){
            if(this.userSelected){
                var uidList = [];
                for(var uid in this.userSelected){
                    if(this.userSelected[uid].u_ACTIVE == 0){
                        uidList.push(uid);
                    }
                }
                
                if(uidList.length > 0){
                    this._saveOnVefiry(uidList);
                }else{
                    base.info('提醒', '请选择需要重新发送激活邮件的用户');
                }
            }
        },
        
        _destroySelTree: function(){
            if(this.selTree){
                this.selTree.destroyRecursive();
                this.selTree = null;
            }
            
            if(this.areaSelector){
                this.areaSelector.destroy();
                this.areaSelector = null;
            }
        },
        
        _saveOnVefiry: function(uidList){
            base.ajax({
                hintOnSuccess: true,
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/maint/normal/maintUser/verifyMail',
                data: {
                    users: JSON.stringify(uidList)
                }
            }).success(lang.hitch(this, function(ret){
                this._clearSelected();
            }));
        },
        
        _saveOnMove: function(destArea){
            if(!this.currentArea){
                return false;
            }
            
            if(!destArea){
                base.error('错误', '请选择目标区域');
                return false;
            }
            
            if(this.currentArea.dId == destArea.dId){
                base.error('错误', '目标区域与当前区域不能一样');
                return false;
            }
            
            var users = {};
            for(var uid in this.userSelected){
                users[uid] = destArea.dId;
            }
            
            if(Object.keys(users).length == 0){
                base.error('错误', '请选择需要变更区域的用户');
                return false;
            }
            
            base.ajax({
                hintOnSuccess: true,
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/maint/normal/parentChange',
                data: {
                    users: JSON.stringify(users)
                }
            }).success(lang.hitch(this, function(ret){
                var userContainer = $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .userListCC>table');
                
                for(var uid in users){
                    userContainer.find('tr[uid="' + uid + '"]').remove();
                }
                
                //first row is the table head
                if(userContainer.children().length == 1){
                    userContainer.empty();
                    userContainer.append('<tr class="empty"><td>暂无记录!</td></tr>');
                }
                
                this._clearSelected();
            }));
            
            return true;
        },
        
        _saveOnUpdate: function(uidList, editType){
            base.ajax({
                hintOnSuccess: true,
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/maint/normal/maintUser',
                data: {
                    editType: editType,
                    users: JSON.stringify(uidList)
                }
            }).success(lang.hitch(this, function(ret){
                var userContainer = $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .userListCC>table');
                
                for(var i=0; i<uidList.length; i++){
                    var itemData = this.userSelected[uidList[i]];
                    if(editType == 'disable'){
                        itemData.u_DISABLED = 1;
                    }else{
                        itemData.u_DISABLED = 0;
                    }
                    
                    var itemNode = userContainer.find('tr[uid="' + itemData.u_ID + '"]');
                    
                    this._updateUserStatusNode(itemNode, itemData);
                }
                
                this._clearSelected();
            }));
        },
        
        _saveOnAdd: function(){
            var modalBody = $(this.domNode).find('.modal .modal-body');
            
            var uid = modalBody.find('input.uId').val();
            var unm = modalBody.find('input.uNm').val();
            
            if(uid.length == 0 || unm.length == 0){
                base.error('错误', '输入不完整');
                return;
            }
            
            base.ajax({
                hintOnSuccess: true,
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/maint/normal/maintUser',
                data: {
                    uId: uid,
                    uNm: unm,
                    gpId: this.currentArea.dId
                }
            }).success(lang.hitch(this, function(ret){
                this._removeEmptyDesc();
                
                var userContainer = $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .userListCC>table');
                this._createItem(-1, userContainer, ret.data);
                
                $(this.domNode).children('.modal').modal('hide');
            }));
        },
        
        _removeEmptyDesc: function(){
            $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .userListCC>table tr.empty').remove();
        },
        
        _clearSelected: function(){
            this.userSelected = {};
            $(this.domNode).find('.content>.ctBottom>.detail>.detailBottom .userListCC>table tr input[type="checkbox"]').prop('checked', false);
            
            this._checkUserCmdVisible();
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/maintUser/areaTree/afterDelete', lang.hitch(this, function(data){
                if(this.areaTree && this.areaTree.instanceId == data.instanceId){
                    this._toggleDeleteStatus(false);
                }
            }));
            
            this.own(sub1);
        }
    });
});
