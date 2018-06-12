
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "common/widget/zTree/zTree",
    "dojo/text!./template/roleMgr.html",
    "tool/css!./css/roleMgr.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        ZTree,
        template){
    
    return declare("component.userAccount.widget.subAccount.widget.roleMgr", [_Widget], {
        baseClass: "component_userAccount_widget_subAccount_roleMgr",
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
        },
        
        _initDom: function(){
            $(this.domNode).find('li.append>a').click(lang.hitch(this, function(e){
            	if(this.roleTree){
            		this._addRole();
            	}
            }));
            
            $(this.domNode).find('li.delete>a').click(lang.hitch(this, function(e){
            	if(this.roleTree){
            		this._toggleDeleteStatus(true);
            		
            		this.roleTree.toggleCheckMode();
            	}
            }));
            
            $(this.domNode).find('li.cancel>a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        		this.roleTree.toggleCheckMode();
        	}));
        	
        	$(this.domNode).find('li.ok>a').click(lang.hitch(this, function(){
        		this._deleteRole();
        		this._toggleDeleteStatus(false);
        		this.roleTree.toggleCheckMode();
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
                
                var havedSelected = this.roleTree.removeNodes([preNode], true);
                if(!havedSelected){
                    this._clearContent();
                }
            }));
            
            /* api tree */
            this.apiTree = new ZTree({
                treeObj: $(this.domNode).find('.roleContent .apiTree ul'),
                urlOrData: base.getServerNM() + 'platformApi/own/sys/normal/subUserApi', 
                expandFirst: false,
                render: null, 
                maxTitleAsciiLen: 34,
                loaded: lang.hitch(this, function(zTree){
                    this.apiMap = {};
                    var nodes = zTree.getAllNodes();
                    
                    for(var i=0; i<nodes.length; i++){
                        if(nodes[i].type == 'client'){
                            var nodeData = nodes[i].nodeData;
                            this.apiMap[nodeData.api_ID + '_' + nodeData.api_METHOD] = nodes[i];
                        }
                    }
                    
                    //select event of role tree need 'this.apiMap', create it after apiTree's initialization
                    this._createRoleTree();
                })
            });
            this.apiTree.startup();
            this.own(this.apiTree);
        },
        
        _createRoleTree: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sys/normal/role'
            }).success(lang.hitch(this, function(ret){
                
                this.roleTree = new ZTree({
                    treeObj: $(this.domNode).find('.roleTree ul'),
                    urlOrData: this._getRoleTreeData(ret.data), 
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
                this.roleTree.startup();
                this.own(this.roleTree);
            }));
        },
        
        _getRoleTreeData: function(data){
            var nodeList = [];
            var nodeMap = {};
            for(var i=0; i<data.length; i++){
                var item = data[i];

                var node = nodeMap[item.role_ID];
                if(!node){
                    node = {
                        id: item.role_ID,
                        dId: item.role_ID,
                        pId: null,
                        pDid: null,
                        name: item.role_NM,
                        nocheck: true,
                        nodeData: {
                            role_ID: item.role_ID,
                            role_NM: item.role_NM,
                            role_DESC: item.role_DESC,
                            role_APIS: []
                        }
                    };
                    nodeMap[data[i].role_ID] = node;
                    nodeList.push(node);
                }

                node.nodeData.role_APIS.push(item);
            }
            
            return nodeList;
        },
        
        _getApiTreeSavedData: function(){
            var chkApiMap = {};
            var chkApiNodes = [];
            var chkApis = this.apiTree.getCheckedNodes(true);
            
            for(var i=0; i<chkApis.length; i++){
                if(chkApis[i].type == 'client'){
                    var nodeData = chkApis[i].nodeData;
                    
                    var api = chkApiMap[nodeData.api_ID];
                    if(!api){
                        api = {
                            role_ID: null,
                            role_NM: null,
                            role_DESC: null,
                            api_ID: nodeData.api_ID,
                            http_GET: 0,
                            http_POST: 0,
                            http_PUT: 0,
                            http_DELETE: 0
                        }
                        chkApiMap[nodeData.api_ID] = api;
                        chkApiNodes.push(api);
                    }
                    
                    if(nodeData.api_METHOD == 'get'){
                        api.http_GET = 1;
                    }
                    if(nodeData.api_METHOD == 'put'){
                        api.http_PUT = 1;
                    }
                    if(nodeData.api_METHOD == 'post'){
                        api.http_POST = 1;
                    }
                    if(nodeData.api_METHOD == 'delete'){
                        api.http_DELETE = 1;
                    }
                }
            }
            
            return chkApiNodes;
        },
        
        _cmdSave: function(){
            var roleNM = $(this.domNode).find('.roleContent .roleNM').val().trim();
            var roleDesc = $(this.domNode).find('.roleContent .roleDesc').val().trim();
            
            if(roleNM.length == 0){
                base.info('提醒', '角色名称不能为空');
                return;
            }
            
            var apis = this._getApiTreeSavedData();
            
            //mind that dId is the real value for 'id in db'
            var saveObj = {
                id: this.preSelect.dId, 
                name: roleNM,
                desc: roleDesc,
                apis: JSON.stringify(apis)
            };
            
            var isAdd = base.isNull(saveObj.id);
            
            base.ajax({
                hintOnSuccess: true,
                type: isAdd? 'POST' : 'PUT',  
                url: base.getServerNM() + 'platformApi/own/sys/normal/role',
                data: saveObj
            }).success(lang.hitch(this, function(ret){
                var treeData = ret.data;
                
                var nodeData = {
                    role_ID: ret.data.id,
                    role_NM: roleNM,
                    role_DESC: roleDesc,
                    role_APIS: apis
                };
                
                if(isAdd){
                    $.extend(this.preSelect, {id: ret.data.id, dId: ret.data.dId, name: roleNM, nodeData: nodeData});
                }else{
                    $.extend(this.preSelect, {name: roleNM, nodeData: nodeData});
                }
                
                this.roleTree.updateNode(this.preSelect);
                
                $(this.domNode).find('.cmd button.cancel').hide();
                
                //notice that roles are refreshed
                topic.publish('component/userAccount/widget/subAccount/widget/roleMgr/refresh');
            }));
        },
        
        _deleteRole: function(){
        	var nodes = this.roleTree.getCheckedNodes(true);
            
            var roleIds = [];
            var nodeMap = {};
            var clearToDelNodes = [];
            for(var i=0; i<nodes.length; i++){
                if(nodes[i].dId){
                    roleIds.push(nodes[i].dId);
                    nodeMap[nodes[i].dId] = nodes[i];
                }else{
                    clearToDelNodes.push(nodes[i]);
                }
            }
            
            //check the delete nodes contains the 'new node' or not
            var clearCurrent = clearToDelNodes.length > 0;
        	
        	if(nodes.length > 0){
                if(roleIds.length > 0){
                    base.ajax({
                        type: 'DELETE',  
                        url: base.getServerNM() + 'platformApi/own/sys/normal/role',
                        data: {
                            roleIds: JSON.stringify(roleIds)
                        }
                    }).success(lang.hitch(this, function(ret){
                        var delIds = ret.data;

                        if(delIds && delIds.length > 0){
                            for(var i=0; i<delIds.length; i++){
                                clearToDelNodes.push(nodeMap[delIds[i]]);
                            }
                        }
                        
                        this._afterDelete(clearToDelNodes, clearCurrent);

                        if(delIds.length != roleIds.length){
                            base.ok('删除成功，但其中已被使用的角色不能被删除!');
                        }
                        
                        //notice that roles are refreshed
                        topic.publish('component/userAccount/widget/subAccount/widget/roleMgr/refresh');
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
                var havedSelected = this.roleTree.removeNodes(nodes, true);
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
        
        _addRole: function(){
            if(this._checkUnSave()){
                return;
            }
            
        	var newRow = {
				id: null, 
                pId: null,
                dId: null,
                pDid: null,
				name: '[新角色]', 
                nocheck: true,
                nodeData: {
                    role_ID: null,
                    role_NM: '[新角色]',
                    role_DESC: null,
                    role_APIS: []
                }
    		};
        	
        	var addedRow = this.roleTree.addNodes(null, [newRow]);
            if(addedRow.length > 0){
            	this.roleTree.selectNode(addedRow[0]);
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
        
        _setContent: function(row){
            if(base.isNull(row.dId)){
                $(this.domNode).find('.cmd button.save').show();
                $(this.domNode).find('.cmd button.cancel').show();
            }else{
                $(this.domNode).find('.cmd button.save').show();
                $(this.domNode).find('.cmd button.cancel').hide();
            }
            
            $(this.domNode).find('.roleContent .roleNM').val(row.nodeData.role_NM);
            $(this.domNode).find('.roleContent .roleDesc').val(row.nodeData.role_DESC);
            
            this.apiTree.clearSelect();
            
            var apis = row.nodeData.role_APIS;
            for(var i=0; i<apis.length; i++){
                if(parseInt(apis[i].http_GET) != 0){
                    var chkNode = this.apiMap[apis[i].api_ID + '_get'];
                    if(chkNode){
                        this.apiTree.checkNode(chkNode, true);
                    }
                }
                
                if(parseInt(apis[i].http_POST) != 0){
                    var chkNode = this.apiMap[apis[i].api_ID + '_post'];
                    if(chkNode){
                        this.apiTree.checkNode(chkNode, true);
                    }
                }
                
                if(parseInt(apis[i].http_PUT) != 0){
                    var chkNode = this.apiMap[apis[i].api_ID + '_put'];
                    if(chkNode){
                        this.apiTree.checkNode(chkNode, true);
                    }
                }
                
                if(parseInt(apis[i].http_DELETE) != 0){
                    var chkNode = this.apiMap[apis[i].api_ID + '_delete'];
                    if(chkNode){
                        this.apiTree.checkNode(chkNode, true);
                    }
                }
            }
        },
        
        _clearContent: function(){
            this.preSelect = null;
            
            $(this.domNode).find('.cmd button.save').hide();
            $(this.domNode).find('.cmd button.cancel').hide();
            
        	$(this.domNode).find('.roleContent .roleNM').val(null);
            this.apiTree.clearSelect();
            
            this._toggleDeleteStatus(false);
        },
        
        _initEvents: function () {
        }
    });
});
