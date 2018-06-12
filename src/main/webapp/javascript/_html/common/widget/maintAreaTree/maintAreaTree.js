
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    "root/ztree/jquery.ztree.all",
    "dojo/text!./template/maintAreaTree.html",
    "tool/css!root/ztree/zTreeStyle.css",
    "tool/css!./css/maintAreaTree.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        ztree,
        template){
    
    return declare("common.widget.maintAreaTree", [_Widget], {
        baseClass: "common_widget_maintAreaTree",
        templateString: template,
        
        /**
         * args: {
                areaData: [],   //set to null will make the tree load data from api automatically
        		groupEdit: false,
                expandFirst: false,
        		render: function, 
                showCheckBox: false,
                withUser: false,
                maxTitleAsciiLen: 35,
                canDrag: false,
        		beforeClick: function(treeNode){
        		}, 
        		click: function(treeNode){
        		},
                loaded: function(zTree){
                }
        	}
         * 
         */
        constructor: function(args){
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function(){
            this.inherited(arguments);
            
            this.chkShowed = this.showCheckBox? this.showCheckBox : false;
            
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
            
            if(this.myZTree){
        		this.myZTree.destroy();
        	}
        },
        
        refresh: function(searchStr){
            this._clearSelected();
            
            this._createZtree(searchStr);
        },
        
        addArea: function(){
            this._resetModalContent();
            
            $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
            
            $(this.domNode).find('.modal button.sure').unbind().click(lang.hitch(this, function(){
                this._saveOnAdd();
            }));
        },
        
        getCheckedNodes: function(){
            var chkIds = [], chkNodes = [];
            
        	var nodes = this.myZTree.getCheckedNodes(true);
        	for(var i=0; i<nodes.length; i++){
        		//check_Child_State == -1 means group has no child, check_Child_State == 2 means all children are checked
                if(!base.isNull(nodes[i].dId) && (nodes[i].check_Child_State == -1 || nodes[i].check_Child_State == 2)){
                    chkIds.push(nodes[i].dId);
                    chkNodes.push(nodes[i]);
                }
        	}
            
            return {chkIds: chkIds, chkNodes: chkNodes};
        },
        
        toggleDelete: function(){
            this._toggleDelete();
        },
        
        deleteChecked: function(){
            var chkData = this.getCheckedNodes();
            
            if(chkData.chkIds.length == 0){
                base.error('错误', '请选择要删除的区域');
                return;
            }
            
            var clearCurrent = this.currentNode? (chkData.chkIds.indexOf(this.currentNode.dId) >= 0) : false;
            
        	if(chkData.chkIds.length > 0){
        		base.ajax({
                    hintOnSuccess: true,
        			type: 'DELETE',
        			url: base.getServerNM() + 'platformApi/own/maint/normal/area',
        			data: {areas: JSON.stringify(chkData.chkIds)}
        		}).success(lang.hitch(this, function(ret){
                    this._afterDelete(chkData, clearCurrent);
                    
        		}));
        	}else{
                this._afterDelete(chkData, clearCurrent);
            }
        },
        
        getNode: function(id){
            return this.myZTree.getNodeByParam('id', id, null);
        },
        
        selectNode: function(node){
			/*neither $("#" + node.tId + "_a")[0].click() nor this.myZTree.selectNode(node) works well.
            the first situation cause error if the tree haven't been expanded and the 'node' is a child of some parent node 
            the second situation do not trigger the click event. 
            
            here we simulate the click action
            */
            if(this._beforeClick(this.myZTree.setting.treeId, node)){
                this.myZTree.selectNode(node);
                this._clickIt(node);
                
                return true;
            }
            
            return false;
		},
        
        updateNode: function(node){
			this.myZTree.updateNode(node, true);
            
            this._resetDiyDom(node);
		},
        
        clearSelect: function(){
            this.myZTree.cancelSelectedNode();
            
            this.myZTree.checkAllNodes(false);
        },
        
        _toggleDelete: function(){
            var nodes = this._getAllNodes();
            
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                
                //the default group can not be checked.
                if(node.dId == '-1'){
                    node.nocheck = true;
                    
                }else{
                    node.nocheck = this.chkShowed;
                    node.checked = false;
                }
                
                this.updateNode(node);
            }
            
            if(this.canDrag){
                this.myZTree.setEditable(this.chkShowed);
                
                //setEditable will clear the empty item
                this._checkEmpty();
                
                //setEditable will remove the selection status of the tree, reset it manually
                if(this.currentNode){
                    this.myZTree.selectNode(this.currentNode);
                }
            }
            
            this.chkShowed = !this.chkShowed;
        },
        
        _afterDelete: function(chkData, clearCurrent){
        	this._toggleDelete();
        	
            if(clearCurrent){
                this.currentNode = null;
            }
            
            if(chkData.chkNodes && chkData.chkNodes.length > 0){
                var havedSelected = this._removeNodes(chkData.chkNodes, true);
                
                //if nothing is selected after delete, we need to publish a msg to notice this situtation
                if(!havedSelected){
                    this._clearSelected();
                }
            }
            
            topic.publish('component/maintUser/areaTree/afterDelete', {instanceId: this.instanceId});
        },
        
        _clearSelected: function(){
            this.currentNode = null;
            topic.publish('component/maintUser/areaTree/select', {instanceId: this.instanceId});
        },
        
        _resetModalContent: function(node){
            var modal = $(this.domNode).find('.modal');
            
            if(node){
                modal.find('.modal-title').text('编辑运维区域');
                var parentNode = node.getParentNode();
                
                modal.find('.modal-body label.parentGpNm').text(parentNode? parentNode.name : '无');
                modal.find('.modal-body input.gpNm').val(node.name);
                modal.find('.modal-body input.maKey').val(node.nodeData.ma_KEY);
                
            }else{
                modal.find('.modal-title').text('添加运维区域');
                var parentNode = this.currentNode && (this.currentNode.dId != '-1') ? this.currentNode : null;           
                
                modal.find('.modal-body label.parentGpNm').text(parentNode? parentNode.name : '无');
                modal.find('.modal-body input.gpNm').val(null);
                modal.find('.modal-body input.maKey').val(null);
            }
        },
        
        _editArea: function(node){
            this._resetModalContent(node);
            
            $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
            
            $(this.domNode).find('.modal button.sure').unbind().click(lang.hitch(this, function(){
                this._saveOnEdit(node);
            }));
        },
        
        _saveOnAdd: function(){
            var modal = $(this.domNode).find('.modal .modal-body');
            
            var gpNm = modal.find('input.gpNm').val();
            var maKey = modal.find('input.maKey').val();
            var parentGpId = this.currentNode && this.currentNode.dId ? this.currentNode.dId : null;
            
            if(gpNm.length == 0 || maKey.length == 0){
                base.error('错误', '输入不完整');
                return;
            }
            
            base.ajax({
                hintOnSuccess: true,
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/maint/normal/area',
                data: {
                    parentGpId: parentGpId,
                    maName: gpNm,
                    maKey: maKey
                }
            }).success(lang.hitch(this, function(ret){
                var newNode = ret.data;
                
                this._removeEmptyDesc();
                
                var parentNode = this.currentNode && this.currentNode.dId != '-1' ? this.currentNode : null;
                var addedNodes = this.myZTree.addNodes(parentNode, [newNode], false);
                if(addedNodes.length > 0){
                    this.selectNode(addedNodes[0]);
                }
                
                this._closeModal();
            }));
        },
        
        _saveOnEdit: function(node){
            var modal = $(this.domNode).find('.modal .modal-body');
            
            var gpNm = modal.find('input.gpNm').val();
            var maKey = modal.find('input.maKey').val();
            
            if(gpNm.length == 0 || maKey.length == 0){
                base.error('错误', '输入不完整');
                return;
            }
            
            base.ajax({
                hintOnSuccess: true,
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/maint/normal/area',
                data: {
                    gpId: node.dId,
                    maName: gpNm,
                    maKey: maKey
                }
            }).success(lang.hitch(this, function(ret){
                node.nodeData.ma_KEY = maKey;
                node.name = gpNm;
                
                this.updateNode(node);
                
                this._closeModal();
            }));
        },
        
        _closeModal: function(){
            $(this.domNode).children('.modal').modal('hide');
        },
        
        _removeNodes: function(nodes, selectNextNode){
            //change the state to 'delete'
            this.deleteState = true;
            
            var selected = this.myZTree.getSelectedNodes();
            var nextNode = nodes.length == 1? nodes[0].getNextNode() : null;
            
            var selectedInDel = false;
			for(var i= 0; i<nodes.length; i++){
				this.myZTree.removeNode(nodes[i]);
                
                if(selected.length > 0 && selectNextNode && !selectedInDel){
                    for(var j=0; j<selected.length; j++){
                        if(selected[j].id == nodes[i].id){
                            selectedInDel = true;
                            break;
                        }
                    }
                }
			}
			
            var havedSelected = selected.length > 0 && !selectedInDel;
            if(selectNextNode){
            	if(selected.length == 0 || selectedInDel){
    				if(nextNode){
                        havedSelected = this.selectNode(nextNode);
    				}else{
    					havedSelected = this._expandFirstNode(true);
    				}
    			}
            }
            
            this.deleteState = false;
            
            return havedSelected;
		},
        
        _initDom: function(){
            this._createZtree();
        },
        
        _createZtree: function(searchStr){
            var treeObj = $(this.domNode).find('.areaTreeContainer ul.treeUl');
            
            if(this.myZTree){
        		this.myZTree.destroy();
                this.myZTree = null;
                
                treeObj.empty();
        	}
            
			if(!treeObj.attr('id')){
				treeObj.attr('id', 'zt_' + base.uuid());
			}
            
        	var opts = {
    			view: {
    				showLine: false,
    				showIcon: false,
    				selectedMulti: false
    			},
                data: {
    				simpleData: {
    					enable: true, 
    					idKey:"id", 
    					pIdKey:"pId", 
    					rootPId:null
                    }
    			},
    			check: {
    				enable: true
    			},
    			view: {
					addDiyDom: lang.hitch(this, this._addDiyDom)
				},
				callback: {
					beforeClick: lang.hitch(this, this._beforeClick),
                    beforeCheck: lang.hitch(this, this._beforeCheck),
                    onCheck: lang.hitch(this, this._onCheck),
                    beforeDrag: lang.hitch(this, this._beforeDrag),
                    beforeDrop: lang.hitch(this, this._onDrag),
                    onDrop: lang.hitch(this, this._afterDrag),
                    onClick: lang.hitch(this, function(event, treeId, treeNode){
                        this._clickIt(treeNode);
                    })
				}
    		};
            
            if(!this.withUser){
                //parent affect children, children don't affect parent
                opts.check.chkboxType = { "Y": "s", "N": "s" };
                
                opts.view.dblClickExpand = true;
                opts.callback.beforeDblClick = lang.hitch(this, this._beforeClick);
            }
            
            if(this.canDrag){
                opts.edit = {
                    drag: {
                        isCopy: false
                    },
                    enable: true,
                    showRemoveBtn: false,
                    showRenameBtn: false
                }
            }
            
            if(this.areaData){
				this.myZTree = $.fn.zTree.init(treeObj, opts, this.areaData);
				
				this._afterTreeLoaded();
                
            }else{
                var url = base.getServerNM() + "platformApi/own/maint/normal/areaTree?search=" + (searchStr? searchStr : "") + "&showCheck=" +  this.chkShowed + "&withUser=" + (this.withUser? this.withUser : false);
                
                opts.async = {
    				enable: true,
    				url: url,
    				type:'GET',
    				autoParam:["id", "name=n", "level=lv"]
    			};
                
                opts.callback.onAsyncSuccess = lang.hitch(this, this._afterTreeLoaded);
                
                this.myZTree = $.fn.zTree.init(treeObj, opts, null);
            }
            
			treeObj.hover(lang.hitch(this, function () {
				if (!treeObj.hasClass("showIcon")) {
					treeObj.addClass("showIcon");
				}
			}), lang.hitch(this, function() {
				treeObj.removeClass("showIcon");
			}));
        },
        
        _afterTreeLoaded: function(event, treeId, treeNode, msg){
            if(this.expandFirst){
               this._expandFirstNode();
            }

            if(this.loaded){
                this.loaded(this);
            }

            this._checkEmpty();
        },
        
        _beforeDrag: function(treeId, treeNodes){
            for(var i=0; i<treeNodes.length; i++){
                var tmpNode = treeNodes[i];
                
                if(!tmpNode.nocheck || tmpNode.dId == '-1'){
                    return false;
                }
            }
            
            return true;
        },
        
        _onDrag: function(treeId, treeNodes, targetNode, moveType){
            if(!targetNode){
                return false;
            }
            
            if(!treeNodes || treeNodes.length == 0){
                return false;
            }
            
            var needSave = false;
            var gpEditMap = {};
            
            for(var i=0; i<treeNodes.length; i++){
                var tmpNode = treeNodes[i];
                
                var parentDid = null;
                
                if(moveType == 'inner'){
                    if(targetNode.dId == '-1'){
                        return false;
                    }
                    
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

                gpEditMap[tmpNode.dId] = parentDid;

                needSave = true;
            }
            
            if(needSave){
                base.ajax({
                    hintOnSuccess: true,
                    type: 'PUT',
                    url: base.getServerNM() + 'platformApi/own/maint/normal/parentChange',
                    data: {
                        areas: JSON.stringify(gpEditMap)
                    }
                });
                
                return true;
            }else{
                return false;
            }
        },
        
        _afterDrag: function(event, treeId, treeNodes, targetNode, moveType, isCopy){
            if(targetNode && moveType && treeNodes && treeNodes.length > 0){
                for(var i=0; i<treeNodes.length; i++){
                    this._resetStyleAfterDrag(treeId, treeNodes[i]);
                }
                
                //reSelect without check
                this.currentNode = null;
                
                this._clickIt(treeNodes[0]);
            }
        },
        
        _clickIt: function(treeNode){
            if(!this.currentNode || treeNode.dId != this.currentNode.dId){
                this.currentNode = treeNode;
            
                if(this.click){
                    this.click(treeNode);  
                }
            } 
        },
        
        _resetStyleAfterDrag: function(treeId, tmpNode){
            //should not using $("#" + xxxx) to find the dom node, cause 'this.domNode' may haven't added to the document.
            $(this.domNode).find("#" + tmpNode.tId + "_a>span.spaceSpan").remove();

            var switchObj = $(this.domNode).find("#" + tmpNode.tId + "_switch"), 
                spanObj = $(this.domNode).find("#" + tmpNode.tId + "_span");

            var padLenVal = this._getPadLen(tmpNode);
            if (padLenVal.padLen > 0) {
                var spaceStr = "<span class='spaceSpan' style='display: inline-block;width:" + padLenVal.padLen+ "px'></span>";
                switchObj.before(spaceStr);
            }

            spanObj.html(this._getTitleTxt(tmpNode.name, padLenVal.titlePadLen));
            
            if(tmpNode.children && tmpNode.children.length > 0){
                for(var i=0; i<tmpNode.children.length; i++){
                    this._resetStyleAfterDrag(treeId, tmpNode.children[i]);
                }
            }
        },
        
        _checkEmpty: function(){
            if(this.myZTree.getNodes().length == 0){
                $(this.domNode).find('.areaTreeContainer ul.treeUl').append('<li style="text-align: center" class="empty">暂无更多数据!</li>');
            }else{
                this._removeEmptyDesc();
            }
        },
        
        _removeEmptyDesc: function(){
            $(this.domNode).find('.areaTreeContainer ul.treeUl>li.empty').remove();
        },
		
		_addDiyDom: function(treeId, treeNode) {
            //should not using $("#" + xxxx) to find the dom node, cause 'this.domNode' may haven't added to the document.
            var aNode = $(this.domNode).find("#" + treeNode.tId + "_a");
            
            if(!this.withUser || treeNode.isParent){
                aNode.css('font-weight', "bold");
			}
			
			var switchObj = $(this.domNode).find("#" + treeNode.tId + "_switch"), 
				icoObj = $(this.domNode).find("#" + treeNode.tId + "_ico"),
				spanObj = $(this.domNode).find("#" + treeNode.tId + "_span");
			
			switchObj.remove();
			icoObj.before(switchObj);
			spanObj.css('font-family', '"Helvetica Neue", Helvetica, Microsoft Yahei, Hiragino Sans GB, WenQuanYi Micro Hei, sans-serif');
			
            var padLenVal = this._getPadLen(treeNode);
			if (padLenVal.padLen > 0) {
				var spaceStr = "<span class='spaceSpan' style='display: inline-block;width:" + padLenVal.padLen+ "px'></span>";
				switchObj.before(spaceStr);
			}
            
            spanObj.html(this._getTitleTxt(treeNode.name, padLenVal.titlePadLen));
			
			var checkSpan = $(this.domNode).find("#" + treeNode.tId + "_check");
            if(checkSpan){
            	checkSpan.remove();
            	switchObj.before(checkSpan);
            }
            
            if(!this.groupEdit || treeNode.dId == '-1'){
            	icoObj.css('display', 'none');
            }
            
            this._setGroupEditIconClick(icoObj, treeNode);
            
			if(this.render){
				this.render(treeNode);
			}
		},
        
        _getPadLen: function(node){
            var padLen = 0, titlePadLen = 0;
			if (node.level > 0) {
                //space width is 20 pixels
                padLen = 20 * node.level;
            }
            titlePadLen = padLen;
            
            if(!node.nocheck){
                titlePadLen += 27;    
            }
            
            return {padLen: padLen, titlePadLen: titlePadLen};
        },
        
        _resetDiyDom: function(node){
            //reset the diyDom css
            $(this.domNode).find("#" + node.tId + "_span").html(this._getTitleTxt(node.name, this._getPadLen(node).titlePadLen));
            
            //groupEdit status
            var icoObj = $(this.domNode).find("#" + node.tId + "_ico");
            if(!this.groupEdit || node.dId == '-1'){
                icoObj.css('display', 'none');
            }
            
            //group status
            if(!this.withUser || node.isParent){
                $(this.domNode).find("#" + node.tId + "_a").css('font-weight', "bold");
			}
            
            this._setGroupEditIconClick(icoObj, node);
        },
        
        _setGroupEditIconClick: function(icoObj, treeNode){	
            if(this.groupEdit && treeNode.dId != '-1'){
                icoObj.unbind().click(lang.hitch(this, function(e){
                    e.stopPropagation();

                    //edit group
                    if(!this.chkShowed){
                        this._editArea(treeNode);
                    }
                }));
            }
        },
        
        _getTitleTxt: function(title, padLen){
            var maxAsciiLen = base.isNull(this.maxTitleAsciiLen)? 35 : this.maxTitleAsciiLen;
            
            //average 7 pixels for each ascii character
            return base.subDescription(title, maxAsciiLen - parseInt((padLen / 7)));
        },
		
		_beforeClick: function(treeId, treeNode) {
            //when the tree don't have child nodes, dblclick event still can be triggered, but 'treeNode' will be null
            if(!treeNode){
                return;
            }
            
			if((this.chkShowed && !this.deleteState) || (treeNode.isParent && this.withUser)){
                this.myZTree.expandNode(treeNode);
				return false;
                
			}else{
				if(this.beforeClick){
					return this.beforeClick(treeNode);
				}else{
					return true;
				}
			}
		},
        
        _beforeCheck: function(treeId, treeNode){
            if(!treeNode){
                return;
            }
            
            if(treeNode.checked){
                var unChkNodes = [];
                var nodes = this.myZTree.transformToArray(treeNode);
                
                for(var i=0; i<nodes.length; i++){
                    if(nodes[i].checked){
                        unChkNodes.push(nodes[i]);
                    }
                }
                
                topic.publish('component/maintUser/areaTree/unCheck', unChkNodes);
            }
            
            return true;
        },
        
        _onCheck: function(event, treeId, treeNode){
            if(!treeNode){
                return;
            }
            
            if(treeNode.checked){
                var chkNodes = [];
                var nodes = this.myZTree.transformToArray(treeNode);
                
                for(var i=0; i<nodes.length; i++){
                    if(nodes[i].checked){
                        chkNodes.push(nodes[i]);
                    }
                }
                
                topic.publish('component/maintUser/areaTree/check', chkNodes);
            }
        },
        
        _getAllNodes: function(){
			return this.myZTree.transformToArray(this.myZTree.getNodes());
		},
        
		_expandFirstNode: function(needSelect){
            var seled = false;
            
            var allNodes = this._getAllNodes();
            if(allNodes.length > 0){
                if(needSelect){
                    seled = this.selectNode(allNodes[0]);
                    
                }else{
                    this.myZTree.expandNode(allNodes[0]);
                }
            }
            
            return needSelect? seled : true;
		},
        
        _initEvents: function(){
        }
    });
});
