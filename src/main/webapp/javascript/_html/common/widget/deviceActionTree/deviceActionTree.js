
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/spin/Spin",
    "common/widget/zTree/zTree",
    "dojo/text!./template/deviceActionTree.html",
    "tool/css!./css/deviceActionTree.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        Spin,
        ZTree,
        template){
    
    return declare("common.widget.deviceActionTree", [_Widget], {
        baseClass: "common_widget_dat",
        templateString: template,
        
        /**
         * args: {
        		groupSelect: false,
                ownedClients: false,
                showCheckBox: false,
                needNodeData: false,
                maxTitleAsciiLen: 32,
                canDrag: false,
                loaded: function(tree){
                },
                hover: {
                    inFunc: function(treeNode){
                    },
                    outFunc: function(treeNode){
                    }
                }
        	}
         */
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
        	
        	if(this.deviceTree){
        		this.deviceTree.destroyRecursive();
        	}
        },
        
        getCheckedNodes: function(){
            var groups = [], groups_hasId = [], clients = [], clients_hasId = [], chkNodes = [];
            
        	var nodes = this.deviceTree.getCheckedNodes(true);
        	for(var i=0; i<nodes.length; i++){
        		if(nodes[i].type == 'group'){
        			//check_Child_State == -1 means group has no child, check_Child_State == 2 means all children are checked
        			if(nodes[i].check_Child_State == -1 || nodes[i].check_Child_State == 2){
        				groups.push(nodes[i].dId);
                        if(nodes[i].dId){
                            groups_hasId.push(nodes[i].dId);
                        }
                        
                        chkNodes.push(nodes[i]);
        			}
        		}else{
        			clients.push(nodes[i].dId);
                    if(nodes[i].dId){
                        clients_hasId.push(nodes[i].dId);
                    }
                    
                    chkNodes.push(nodes[i]);
        		}
        	}
            
            return {groups: groups, groups_hasId: groups_hasId, clients: clients, clients_hasId: clients_hasId, chkNodes: chkNodes};
        },
        
        refresh: function(refreshCallback){
            this.refreshCallback = refreshCallback;
            this._createTree();
        },
        
        clearSelect: function(){
            this.deviceTree.clearSelect();
            
            this._clearSelected();
        },
        
        _initDom: function(){
            this._createTree();
            
            $(this.domNode).find('.search button').click(lang.hitch(this, function(){
            	this._createTree();
            }));
            
            $(this.domNode).find('.search .nameOrId').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._createTree();
                }
            }));
        },
        
        _createTree: function(){
        	if(this.deviceTree){
        		this.deviceTree.destroyRecursive();
        	}
        	this._clearSelected();
            
        	//cause deviceTree will be create/destroy on search，so we use "destroyRecursive" instead of "this.own(this.deviceTree)"
        	
        	this.deviceTree = new ZTree({
        		treeObj: $(this.domNode).find('.treeContainer ul.treeUl'),
        		urlOrData: base.getServerNM() + "platformApi/own/client/normal/clientTree?ownedClients="+ (this.ownedClients? this.ownedClients : false) + "&needNodeData=" + (this.needNodeData? this.needNodeData : false) + "&search=" + $(this.domNode).find('.nameOrId').val().trim() + "&showCheck=" +  (this.showCheckBox? this.showCheckBox : false), 
        		groupSelect: this.groupSelect,
                maxTitleAsciiLen: this._getMaxTitleLen(),
        		render: null, 
                canDrag: this.canDrag,
        		beforeClick: lang.hitch(this, function(treeNode){
        			return !this._checkUnSave(treeNode);
        		}), 
        		click: lang.hitch(this, function(treeNode){
        			return this._selectItem(treeNode);
        		}),
                loaded: lang.hitch(this, function(curZTree){
                    //this.refreshCallback has a higher priority than this.loaded
                    if(this.refreshCallback){
                        this.refreshCallback(curZTree);
                        
                    }else if(this.loaded){
                        this.loaded(curZTree);
                    }
                }),
                beforeDrag: lang.hitch(this, function(treeNodes){
                    return this._beforeDrag(treeNodes);
                }),
                onDrag: lang.hitch(this, function(moveType, targetNode, treeNodes){
                    return this._onDrag(moveType, targetNode, treeNodes);
                }),
                afterDrag: lang.hitch(this, function(targetNode, treeNodes){
                    return this._afterDrag(targetNode, treeNodes);
                }),
                hover: this.hover
        	});
        	
        	this.deviceTree.startup();
        },
        
        _beforeDrag: function(treeNodes){
            if(this._checkUnSave(null, true)){
                return false;
            }
            
            var uid = base.getUid();
            for(var i=0; i<treeNodes.length; i++){
                var tmpNode = treeNodes[i];
                
                if(!tmpNode.nocheck || tmpNode.uid != uid){
                    base.info('提醒', '只能移动当前用户创建的节点');
                    return false;
                }
            }
            
            return true;
        },
        
        _onDrag: function(moveType, targetNode, treeNodes){
            if(!targetNode){
                return false;
            }
            
            if(moveType == 'inner' && targetNode.type == 'client'){
                return false;
            }
            
            var needSave = false;
            var gpEditMap = {}, clientEditMap = {};
            
            for(var i=0; i<treeNodes.length; i++){
                var tmpNode = treeNodes[i];
                
                //ignore the node on drag save if it was newly added(haven't been saved), 
                if(tmpNode.dId){
                    var parentDid = null;
                    
                    if(moveType == 'inner'){
                        tmpNode.pId = targetNode.id;
                        tmpNode.pDid = targetNode.dId;
                        parentDid = targetNode.dId;
                        
                    }else{
                        if(tmpNode.pDid == targetNode.pDid){
                            return false;
                        }else{
                            tmpNode.pId = targetNode.pId;
                            tmpNode.pDid = targetNode.pDid;
                            
                            parentDid = targetNode.pDid;
                        }
                    }
                    
                    if(tmpNode.type == 'client'){
                        clientEditMap[tmpNode.dId] = parentDid;
                    }else{
                        gpEditMap[tmpNode.dId] = parentDid;
                    }
                    
                    needSave = true;
                }
            }
            
            if(needSave){
                base.ajax({
                    hintOnSuccess: true,
                    type: 'PUT',
                    url: base.getServerNM() + 'platformApi/own/client/group',
                    data: {
                        groups: JSON.stringify(gpEditMap),
                        clients: JSON.stringify(clientEditMap)
                    }
                });
                
                return true;
            }else{
                return false;
            }
        },
        
        _afterDrag: function(targetNode, treeNodes){
            //reSelect without check
            this.preSelect = null;
            
            for(var i=0; i<treeNodes.length; i++){
                if(treeNodes[i].type == 'client'){
                    this._selectItem(treeNodes[i]);
                    
                    return;
                }
            }
        },
        
        _checkUnSave: function(treeNode, noAlert){
        	if(this.preSelect && base.isNull(this.preSelect.id) && (!treeNode || treeNode.id != this.preSelect.id)){
                if(!noAlert){
                    base.info('提醒', '存在新增数据未保存');
                }
                
                return true;
            }else{
                return false;
            }
        },
        
        _getMaxTitleLen: function(){
            var asciiLen = 35;
            if(base.isNull(this.maxTitleAsciiLen)){
                if($(this.domNode).is(':visible')){
                    var parentWidth = $(this.domNode).width() - 20;
                    if(parentWidth > 0){
                        asciiLen = parseInt(parentWidth / 7);
                    }
                }
            }else{
                asciiLen = this.maxTitleAsciiLen;
            }
            
            return asciiLen;
        },
        
        _selectItem: function(treeNode){
        	if(!this.preSelect || this.preSelect.id != treeNode.id || this.preSelect.type != treeNode.type){
        		var pubData = {preRow: this.preSelect, newRow: treeNode};
        		
				this.preSelect = treeNode;
				
        		topic.publish('common/widget/dat/select', $.extend(pubData, {instanceId: this.instanceId}));
			}
        },
        
        _addItem: function(isGroup){
            if(this._checkUnSave()){
            	return;
            }
            
            var parentRow = null;
        	var newRow = null;
        	
        	if(this.preSelect){
    			if(this.preSelect.type == 'client'){
    				//append to the same level
    				parentRow = this.preSelect.getParentNode();  //this.deviceTree.getNode(this.preSelect.pId);
    			}else{
    				//append to child level
    				parentRow = this.preSelect;
    			}
    		}
    		
        	if(isGroup){
        		newRow = {
        				id: null, 
        				pId: parentRow? parentRow.id : null,
                        dId: null,
                        pDid: parentRow? parentRow.dId : null,
        				name: '[新增分组]', 
        				isParent: false,   //here we set isParent = false to avoid 'arrow-down' icon shown
        				nocheck: true, 
        				type: 'group', 
        				children: []
        		};
        	}else{
        		newRow = {
        				id: null, 
        				pId: parentRow? parentRow.id : null,
                        dId: null,
                        pDid: parentRow? parentRow.dId : null,
        				name: '[新增设备]', 
        				isParent: false, 
        				nocheck: true, 
        				type: 'client'
        		};
        	}
        	
        	//parentRow = null, means append to root
        	var addedRow = this.deviceTree.addNodes(parentRow, [newRow]);
            if(addedRow.length > 0){
            	this.deviceTree.selectNode(addedRow[0], newRow.isParent);
            }
        },
        
        _cancelAdd: function(preRow, newRow){
        	//remove the newRow but do not select the nextNode. we select the preRow here
        	this.deviceTree.removeNodes([newRow], false);
        	
            if(preRow && preRow.type != 'group'){
                this.preSelect = null;
                this.deviceTree.selectNode(preRow);
            }else{
                this._clearSelected();
            }
        },
        
        _updateItem: function(row){
            //change 'isParent' after 'new group' action was finished
            if(row.type == 'group'){
                row.isParent = true;
            }
            this.deviceTree.updateNode(row);
        },
        
        _toggleDelete: function(){
        	this.deviceTree.toggleCheckMode();
            
            if($(this.domNode).find('.search input.nameOrId').prop('disabled')){
                $(this.domNode).find('.search input,.search button').prop('disabled', false);
            }else{
                $(this.domNode).find('.search input,.search button').prop('disabled', true);
            }
        },
        
        _deleteItem: function(){
            var chkData = this.getCheckedNodes();
            
            //check the delete nodes contains the 'new node' or not. if ture, we need to clear the current selection 
            var clearCurrent = (chkData.clients.length != chkData.clients_hasId.length) || (chkData.groups.length != chkData.groups_hasId.length);
            
        	if(chkData.clients_hasId.length > 0){
        		base.ajax({
        			type: 'DELETE',
        			url: base.getServerNM() + 'platformApi/own/client/clientInfo',
        			data: {clients: JSON.stringify(chkData.clients_hasId)}
        		}).success(lang.hitch(this, function(ret){
                    this._afterDelete(chkData, clearCurrent);
        		}));
        	}else{
                this._afterDelete(chkData, clearCurrent);
            }
        },
        
        _afterDelete: function(chkData, clearCurrent){
        	this._toggleDelete();
        	
            if(clearCurrent){
                this.preSelect = null;
            }
            
            if(chkData.chkNodes && chkData.chkNodes.length > 0){
                var havedSelected = this.deviceTree.removeNodes(chkData.chkNodes, true);
                
                //if nothing is selected after delete, we need to publish a msg to notice this situtation
                if(!havedSelected){
                    this._clearSelected();
                }
            }
            
            topic.publish('common/widget/dat/afterDelete', {instanceId: this.instanceId});
        },
        
        _clearSelected: function(){
            this.preSelect = null;
            topic.publish('common/widget/dat/select', {instanceId: this.instanceId});
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/dat/add', lang.hitch(this, function(data){
                this._addItem(data.isGroup);
            }));
            
            var sub2 = topic.subscribe('common/widget/dat/canceAdd', lang.hitch(this, function(data){
                this._cancelAdd(data.preRow, data.newRow);
            }));
            
            var sub3 = topic.subscribe('common/widget/dat/update', lang.hitch(this, function(data){
                this._updateItem(data);
            }));
            
            var sub4 = topic.subscribe('common/widget/dat/toggleDelete', lang.hitch(this, function(data){
                this._toggleDelete();
            }));
            
            var sub5 = topic.subscribe('common/widget/dat/delete', lang.hitch(this, function(data){
                this._deleteItem();
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
            this.own(sub4);
            this.own(sub5);
        }
    });
});
