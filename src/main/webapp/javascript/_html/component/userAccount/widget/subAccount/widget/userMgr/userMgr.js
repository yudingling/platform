
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "tool/validator",
    "root/customScrollbar/CustomScrollBar",
    "root/bootstrap-switch/BSwitch",
    "common/widget/zTree/zTree",
    "root/objectSelector/ObjectSelector",
    "dojo/text!./template/userMgr.html",
    "tool/css!./css/userMgr.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Validator,
        CustomScrollBar,
        BSwitch,
        ZTree,
        ObjectSelector,
        template){
    
    return declare("component.userAccount.widget.subAccount.widget.userMgr", [_Widget], {
        baseClass: "component_userAccount_widget_subAccount_userMgr",
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
            
            this.defer(lang.hitch(this, function(){
            	CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._destroyRoleTree();
        },
        
        _initDom: function(){
            BSwitch.init($(this.domNode).find('.bswitch'), {
        		handleWidth: 60, 
        		size: 'small', 
        		onColor: 'success', 
        		offColor: 'default', 
        		onText: '已激活', 
        		offText: '已停用', 
        		state: false, 
        		wrapperClass: 'bs', 
        		onChange: lang.hitch(this, function(e){
        		})
            });
            
            $(this.domNode).find('li.append>a').click(lang.hitch(this, function(e){
            	if(this.userTree){
            		this._addUser();
            	}
            }));
            
            $(this.domNode).find('li.delete>a').click(lang.hitch(this, function(e){
            	if(this.userTree){
            		this._toggleDeleteStatus(true);
            		
            		this.userTree.toggleCheckMode();
            	}
            }));
            
            $(this.domNode).find('li.cancel>a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        		this.userTree.toggleCheckMode();
        	}));
        	
        	$(this.domNode).find('li.ok>a').click(lang.hitch(this, function(){
        		this._deleteUser();
        		this._toggleDeleteStatus(false);
        		this.userTree.toggleCheckMode();
        	}));
            
            $(this.domNode).find('.cmd button.save').click(lang.hitch(this, function(){
                if(this.preSelect){
                    this._cmdSave();
                }
            }));
            
            $(this.domNode).find('.cmd button.cancel').click(lang.hitch(this, function(){
                var preNode = this.preSelect;
                //set the preSelect to null to ensure the 'select' action works correctly after delete 
                this.preSelect = null;
                
                var havedSelected = this.userTree.removeNodes([preNode], true);
                if(!havedSelected){
                    this._clearContent();
                }
            }));
            
            $(this.domNode).find('.userContent .reVerifyDiv a').click(lang.hitch(this, function(){
                if(this.preSelect && this.preSelect.nodeData && base.isNull(this.preSelect.nodeData.u_PHONE)){
                    this._reSendVerifyEmail();
                }
            }));
            
            $(this.domNode).find('.userContent i.selRole').click(lang.hitch(this, function(){
                this._getRoles(lang.hitch(this, function(){
                    if(this.preSelect && this.roleSelector){
                        
                        this.roleSelector.show(lang.hitch(this, function(objContainer){
                            return this._treeSelected(objContainer.data('data'));

                        }), {width: '220px', height: '290px', top: '80px', right: '10px' });
                    }
                }));
            }));
            
            /* device tree. only load the devices that its owner is the current user */
            this.deviceTree = new ZTree({
                treeObj: $(this.domNode).find('.userContent .deviceTree ul'),
                urlOrData: base.getServerNM() + 'platformApi/own/client/normal/clientTree?ownedClients=true&needNodeData=false&showCheck=true&search=', 
                expandFirst: false,
                render: null, 
                maxTitleAsciiLen: 40,
                loaded: lang.hitch(this, function(zTree){
                    this.deviceMap = {};
                    var nodes = zTree.getAllNodes();
                    
                    for(var i=0; i<nodes.length; i++){
                        if(nodes[i].type == 'client'){
                            this.deviceMap[nodes[i].dId] = nodes[i];
                        }
                    }
                    
                    //select event of role tree need 'this.deviceMap', create it after deviceTree's initialization
                    this._createUserTree();
                })
            });
            this.deviceTree.startup();
            this.own(this.deviceTree);
        },
        
        _createUserTree: function(){
            this.userTree = new ZTree({
                treeObj: $(this.domNode).find('.userTree ul'),
                urlOrData: base.getServerNM() + 'platformApi/own/sys/normal/subUser', 
                expandFirst: true,
                render: null, 
                maxTitleAsciiLen: 32,
                beforeClick: lang.hitch(this, function(treeNode){
                    return !this._checkUnSave(treeNode);
                }), 
                click: lang.hitch(this, function(treeNode){
                    return this._selectItem(treeNode);
                })
            });
            this.userTree.startup();
            this.own(this.userTree);
        },
        
        _getDeviceTreeSavedData: function(){
            var saveIds = [];
            var chkNodes = this.deviceTree.getCheckedNodes(true);
            
            for(var i=0; i<chkNodes.length; i++){
                if(chkNodes[i].type == 'client'){
                    saveIds.push(chkNodes[i].dId);
                }
            }
            
            return saveIds;
        },
        
        _reSendVerifyEmail: function(){
            base.ajax({
                type: 'POST',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/sys/normal/subUser/verifyMail',
                data: {
                    uId: this.preSelect.dId
                }
            }).success(lang.hitch(this, function(ret){
            }));
        },
        
        _cmdSave: function(){
            var uId = $(this.domNode).find('.userContent .uId').val().trim();
            var uNm = $(this.domNode).find('.userContent .uNm').val().trim();
            var roleId = $(this.domNode).find('.userContent .roleId').val().trim();
            var active = BSwitch.state($(this.domNode).find('.bswitch.status'));
            
            if(uId.length == 0 || !Validator.isEmail(uId)){
                base.error('错误', '邮箱输入错误');
                return;
            }
            if(uNm.length == 0){
                base.error('错误', '姓名不能为空');
                return;
            }
            if(roleId.length == 0){
                base.error('错误', '请设置用户角色');
                return;
            }
            
            var clientIds = this._getDeviceTreeSavedData();
            
            //mind that dId is the real value for 'id in db'
            var saveObj = {
                uId: uId, 
                uNm: uNm,
                roleId: roleId,
                active: active,
                clientIds: JSON.stringify(clientIds)
            };
            
            var isAdd = base.isNull(this.preSelect.dId);
            
            base.ajax({
                hintOnSuccess: true,
                type: isAdd? 'POST' : 'PUT',  
                url: base.getServerNM() + 'platformApi/own/sys/normal/subUser',
                data: saveObj
            }).success(lang.hitch(this, function(ret){
                
                if(isAdd){
                    $.extend(this.preSelect, {id: uId, dId: uId, name: uNm, nodeData: ret.data});
                    
                    //show the resend verify mail button
                    $(this.domNode).find('.userContent .reVerifyDiv').show();
                }else{
                    $.extend(this.preSelect, {name: uNm, nodeData: ret.data});
                }
                
                this.userTree.updateNode(this.preSelect);
                
                $(this.domNode).find('.userContent .uId').prop('disabled', true);
                $(this.domNode).find('.userContent .cmd button.cancel').hide();
            }));
        },
        
        _deleteUser: function(){
        	var nodes = this.userTree.getCheckedNodes(true);
            
            //check the delete nodes contains the 'new node' or not
            var clearCurrent = false;
            var userIds = [];
            for(var i=0; i<nodes.length; i++){
                if(nodes[i].dId){
                    userIds.push(nodes[i].dId);
                }else{
                    clearCurrent = true;
                }
            }
            
        	if(nodes.length > 0){
                if(userIds.length > 0){
                    base.ajax({
                        type: 'DELETE',  
                        url: base.getServerNM() + 'platformApi/own/sys/normal/subUser',
                        data: {
                            userIds: JSON.stringify(userIds)
                        }
                    }).success(lang.hitch(this, function(ret){
                        
                        this._afterDelete(nodes, clearCurrent);
                    }));
                    
                }else{
                    this._afterDelete(nodes, clearCurrent);
                }
        	}
        },
        
        _afterDelete: function(nodes, clearCurrent){
            if(clearCurrent){
                this.preSelect = null;
            }
            
            if(nodes.length > 0){
                var havedSelected = this.userTree.removeNodes(nodes, true);
                if(!havedSelected){
                    this._clearContent();
                }
            }
        },
        
        _toggleDeleteStatus: function(isDelete){
        	if(isDelete){
        		$(this.domNode).find('li.delete').hide();
        		$(this.domNode).find('li.append').hide();
        		
        		$(this.domNode).find('li.ok').show();
        		$(this.domNode).find('li.cancel').show();
        	}else{
        		$(this.domNode).find('li.ok').hide();
        		$(this.domNode).find('li.cancel').hide();
        		
        		$(this.domNode).find('li.delete').show();
        		$(this.domNode).find('li.append').show();
        	}
        },
        
        _addUser: function(){
            if(this._checkUnSave()){
                return;
            }
            
        	var newRow = {
				id: null, 
                pId: null,
                dId: null,
                pDid: null,
				name: '[新用户]', 
                nocheck: true,
                nodeData: null
    		};
        	
        	var addedRow = this.userTree.addNodes(null, [newRow]);
            if(addedRow.length > 0){
            	this.userTree.selectNode(addedRow[0]);
            }
        },
        
        _checkUnSave: function(treeNode){
            if(this.preSelect && base.isNull(this.preSelect.dId) && (!treeNode || treeNode.dId != this.preSelect.dId)){
                base.info('提醒', '存在新增数据未保存');
                return true;
            }else{
                return false;
            }
        },
        
        _selectItem: function(treeNode){
        	if(!this.preSelect || this.preSelect.tId != treeNode.tId){
        		this.preSelect = treeNode;
        		this._setContent(treeNode);
			}
        },
        
        _getRoles: function(callBack){
            if(this.roleTreeData){
                callBack();
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/sys/normal/roleTree'
                }).success(lang.hitch(this, function(ret){
                    this.roleTreeData = ret.data;

                    this.roleMap = {};
                    for(var i=0; i<ret.data.length; i++){
                        if(ret.data[i].type == 'client'){
                            this.roleMap[ret.data[i].dId] = ret.data[i];
                        }
                    }
                    
                    callBack();
                }));
            }
        },
        
        _destroyRoleTree: function(){
            if(this.roleTree){
                this.roleTree.destroyRecursive();
                this.roleTree = null;
            }
        },
        
        _treeSelected: function(sel){
            if(base.isNull(sel)){
                base.info('提醒', '请选择一个角色');
                return false;
                
            }else{
                $(this.domNode).find('.userContent .roleId').val(sel.dId);
                $(this.domNode).find('.userContent .roleNM').val(sel.name);
                return true;
            }
        },
        
        _initRoleSelector: function(){
            if(this.roleSelector)
                return;
            
            this.roleSelector = new ObjectSelector(
                $(this.domNode).find('.userContent form.baseInfo'), 
                '选择角色', 
                lang.hitch(this, function(objContainer){
                    
                    this._destroyRoleTree();
                    
                    this.roleTree = new ZTree({
                        treeObj: objContainer,
                        urlOrData: this.roleTreeData,  //'this.roleTreeData' has been required in  'this._setContent'
                        expandFirst: false,
                        render: null, 
                        beforeClick: null, 
                        maxTitleAsciiLen: 28,
                        click: function(treeNode){
                            //store the treeNode to somewhere that we can achieve from okevent passed in the 'show' method.
                            //here we assign the selected data to objContainer. also you may try an another way you like
                            objContainer.data('data', treeNode);
                        },
                        dblClick: lang.hitch(this, function(treeNode){
                            if(this._treeSelected(treeNode)){
                                this.roleSelector.hide();
                            }
                        })
                    });

                    this.roleTree.startup();
                    
                    //select the related role. mind that 'selDId' defined below has the value of treeNode's dId rather than id. 
                    //  so you need to find the 'id' from roleMap
                    var selDId = $(this.domNode).find('.userContent .roleId').val();
                    if(selDId && selDId.length>0){
                        var nodeId = this.roleMap[selDId].id;

                        this.roleTree.selectNode(this.roleTree.getNode(nodeId));
                    }
                })
            );
            
            this.own(this.roleSelector);
        },
        
        _setContent: function(row){
            if(this.roleSelector){
                this.roleSelector.hide();
            }
            
            var parent = $(this.domNode).find('.userContent');
            
            if(base.isNull(row.dId)){
                $(this.domNode).find('.cmd button.save').show();
                $(this.domNode).find('.cmd button.cancel').show();
                
                parent.find('.uId').val(null).prop('disabled', false);
            }else{
                $(this.domNode).find('.cmd button.save').show();
                $(this.domNode).find('.cmd button.cancel').hide();
                
                parent.find('.uId').val(row.dId).prop('disabled', true);
            }
            
            if(row.nodeData){
                parent.find('.uNm').val(row.nodeData.u_NM);
                parent.find('.roleId').val(row.nodeData.role_ID);
                
                //u_phone not null means the user has been actived
                if(!base.isNull(row.nodeData.u_PHONE)){
                    parent.find('.bswitchDiv').show();
                    parent.find('.reVerifyDiv').hide();
                    
                }else{
                    parent.find('.bswitchDiv').hide();
                    parent.find('.reVerifyDiv').show();
                }
                
                BSwitch.state($(this.domNode).find('.bswitch'), parseInt(row.nodeData.u_ACTIVE) != 0);
                
            }else{
                parent.find('.uNm').val(null);
                parent.find('.roleId').val(null);
                
                parent.find('.bswitchDiv').hide();
                parent.find('.reVerifyDiv').hide();
                
                BSwitch.state($(this.domNode).find('.bswitch'), false);
            }
            
            this._getRoles(lang.hitch(this, function(){
                if(this.roleMap && row.nodeData && row.nodeData.role_ID){
                    parent.find('.roleNM').val(this.roleMap[row.nodeData.role_ID].name);
                }else{
                    parent.find('.roleNM').val(null);
                }
                
                this._initRoleSelector();
            }));
            
            //set the check status of device tree
            this._checkDeviceTree(row);
        },
        
        _checkDeviceTree: function(row){
            this.deviceTree.clearSelect();
            
            if(!base.isNull(row.dId)){
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/client/normal/clientsFromParent',
                    data: {
                        childUid: row.dId
                    }
                }).success(lang.hitch(this, function(ret){
                    var data = ret.data;
                    for(var i=0; i<data.length; i++){
                        var chkNode = this.deviceMap[data[i]];
                        if(chkNode){
                            this.deviceTree.checkNode(chkNode, true);
                        }
                    }
                }));
            }
        },
        
        _clearContent: function(){
            if(this.roleSelector){
                this.roleSelector.hide();
            }
            
            this.preSelect = null;
            
            $(this.domNode).find('.cmd button.save').hide();
            $(this.domNode).find('.cmd button.cancel').hide();
            
        	$(this.domNode).find('.userContent input').val(null);
            this.deviceTree.clearSelect();
            
            this._toggleDeleteStatus(false);
        },
        
        _resetRoles: function(){
            this.roleTreeData = null;
            this.roleMap = null;

            if(this.preSelect){
                this._getRoles(lang.hitch(this, function(){
                    var parent = $(this.domNode).find('.userContent');
                    var roleId = parent.find('.roleId').val();

                    if(this.roleMap && roleId){
                        parent.find('.roleNM').val(this.roleMap[roleId].name);
                    }else{
                        parent.find('.roleNM').val(null);
                    }
                }));
            }
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('component/userAccount/widget/subAccount/widget/roleMgr/refresh', lang.hitch(this, function(){
                this._resetRoles();
            }));
            var sub2 = topic.subscribe('component/userAccount/widget/subAccount/hide', lang.hitch(this, function(data){
                if(this.roleSelector){
                    this.roleSelector.hide();
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
