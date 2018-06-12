
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/spin/Spin",
    "common/widget/zTree/zTree",
    "dojo/text!./template/pushUserTree.html",
    "tool/css!./css/pushUserTree.css"
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
    
    return declare("component.userAccount.widget.notificationSet.widget.pushUserMgr.pushUserTree", [_Widget], {
        baseClass: "component_userAccount_widget_ntfSet_pushUserMgr_pushUserTree",
        templateString: template,
        
        /**
         * args: {
                maxTitleAsciiLen: 47
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
        	
        	if(this.userTree){
        		this.userTree.destroyRecursive();
        	}
        },
        
        getCheckedNodes: function(){
            var groups = [], groups_hasId = [], clients = [], clients_hasId = [], chkNodes = [];
        	
        	var nodes = this.userTree.getCheckedNodes(true);
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
        	if(this.userTree){
        		this.userTree.destroyRecursive();
        	}
        	
        	this._clearSelected();
        	
        	//cause userTree will be create/destroy on search，so we use "destroyRecursive" instead of "this.own(this.userTree)"
        	this.userTree = new ZTree({
        		treeObj: $(this.domNode).find('.treeContainer ul.treeUl'),
        		urlOrData: base.getServerNM() + "platformApi/own/warn/normal/pushUser?search=" + $(this.domNode).find('.nameOrId').val().trim(), 
        		groupSelect: true,
                maxTitleAsciiLen: this.maxTitleAsciiLen,
        		render: null, 
        		beforeClick: lang.hitch(this, function(treeNode){
        			return !this._checkUnSave(treeNode);
        		}), 
        		click: lang.hitch(this, function(treeNode){
        			return this._selectItem(treeNode);
        		})
        	});
        	
        	this.userTree.startup();
        },
        
        _checkUnSave: function(treeNode){
            if(this.preSelect && base.isNull(this.preSelect.id) && (!treeNode || treeNode.id != this.preSelect.id)){
                base.info('提醒', '存在新增数据未保存');
                return true;
            }else{
                return false;
            }
        },
        
        _selectItem: function(treeNode){
        	if(!this.preSelect || this.preSelect.id != treeNode.id || this.preSelect.type != treeNode.type){
        		var pubData = {preRow: this.preSelect, newRow: treeNode};
        		
				this.preSelect = treeNode;
				
        		topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/select', pubData);
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
    				parentRow = this.preSelect.getParentNode();  //this.userTree.getNode(this.preSelect.pId);
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
                    name: '[新增人员]', 
                    isParent: false, 
                    nocheck: true, 
                    type: 'client',
                    nodeData: {
                        pu_ID: null,
                        pu_NM: '[新增人员]',
                        pu_PHONE: null,
                        pu_EMAIL: null
                    }
        		};
        	}
        	
        	//parentRow = null, means append to root
        	var addedRow = this.userTree.addNodes(parentRow, [newRow]);
            if(addedRow.length > 0){
            	this.userTree.selectNode(addedRow[0], newRow.isParent);
            }
        },
        
        _cancelAdd: function(preRow, newRow){
        	//remove the newRow but do not select the nextNode. we select the preRow here
        	this.userTree.removeNodes([newRow], false);
        	
            if(preRow && preRow.type != 'group'){
                this.preSelect = null;
                this.userTree.selectNode(preRow);
            }else{
                this._clearSelected();
            }
        },
        
        _updateItem: function(row){
            //change 'isParent' after 'new group' action was finished
            if(row.type == 'group'){
                row.isParent = true;
            }
            
            this.userTree.updateNode(row);
        },
        
        _toggleDelete: function(){
        	this.userTree.toggleCheckMode();
            
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
        			url: base.getServerNM() + 'platformApi/own/warn/normal/pushUser',
        			data: {ids: JSON.stringify(chkData.clients_hasId)}
        		}).success(lang.hitch(this, function(ret){
                    this._afterDelete(chkData, clearCurrent);
        		}));
        	}else{
                this._afterDelete(chkData, clearCurrent);
            }
        },
        
        _afterDelete: function(chkData, clearCurrent){
            if(clearCurrent){
                this.preSelect = null;
            }
            var havedSelected = this.userTree.removeNodes(chkData.chkNodes, true);
            
            this._toggleDelete();

            topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/afterDelete');

            //if nothing is selected after delete, we need to publish a msg to notice this situtation
            if(!havedSelected){
                this._clearSelected();
            }
        },
        
        _clearSelected: function(){
            this.preSelect = null;
            topic.publish('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/select', null);
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/add', lang.hitch(this, function(data){
                this._addItem(data.isGroup);
            }));
            
            var sub2 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/canceAdd', lang.hitch(this, function(data){
                this._cancelAdd(data.preRow, data.newRow);
            }));
            
            var sub3 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/update', lang.hitch(this, function(data){
                this._updateItem(data);
            }));
            
            var sub4 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/toggleDelete', lang.hitch(this, function(data){
                this._toggleDelete();
            }));
            
            var sub5 = topic.subscribe('component/userAccount/widget/notificationSet/widget/pushUserMgr/pushUserTree/delete', lang.hitch(this, function(data){
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
