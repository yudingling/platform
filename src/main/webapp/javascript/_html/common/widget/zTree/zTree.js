/**
 * yet jquery.ztree cann't support mobile browers
 */

define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/ztree/jquery.ztree.all",
    "tool/css!root/ztree/zTreeStyle.css",
    "tool/css!./css/zTree.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        ztree){
	
    return declare("common.widget.zTree", [_Widget], {
        baseClass: "common_widget_zTree",
        templateString: null,
        
        /**
         * args: {
        		treeObj: obj,
        		urlOrData: obj, 
        		groupSelect: false,
                expandFirst: false,
        		render: function, 
                showCheckBox: false,
                maxTitleAsciiLen: 35,
                canDrag: false,
        		beforeClick: function(treeNode){
        		}, 
        		click: function(treeNode){
        		},
                dblClick: function(treeNode){
        		},
                beforeDrag: function(treeNodes){
                },
                onDrag: function(moveType, targetNode, treeNodes){
                },
                afterDrag: function(targetNode, treeNodes){
                },
                loaded: function(zTree){
                },
                hover: {
                    inFunc: function(treeNode){
                    },
                    outFunc: function(treeNode){
                    }
                }
        	}
         * 
         */
        constructor: function (args) {
        	declare.safeMixin(this, args);
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
        	
        	if(this.myZTree){
        		this.myZTree.destroy();
        	}
        },
        
        
        /******public methods extend for zTree begin ******/
        
        /* if forceNoCheck not null, the 'noCheck' value will set to 'forceNoCheck', otherwise will toggle it */
		toggleCheckMode: function(forceNoCheck){
			var nodes = this.getAllNodes();
			
			var curMode = nodes.length>0? nodes[0].nocheck : false;
            if(!base.isNull(forceNoCheck) && curMode == forceNoCheck){
                return;
            }
            
            for (var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                node.nocheck = !curMode;
                node.checked = false;
                this.updateNode(node);
            }
            
            if(this.canDrag){
                this.myZTree.setEditable(!curMode);
                
                //setEditable will clear the empty item
                this._checkEmpty();
                
                //setEditable will remove the selection status of the tree, reset it manually
                if(this.currentNode){
                    this.myZTree.selectNode(this.currentNode);
                }
            }
		},
		
		getCheckedNodes: function(checked){
			return this.myZTree.getCheckedNodes(checked);
		},
		
		addNodes: function(parentNode, newNodes){
			if(newNodes && newNodes.length>0){
                this._removeEmptyDesc();
                
				return this.myZTree.addNodes(parentNode, newNodes, false);
			}
		},
		
		getAllNodes: function(){
			return this.myZTree.transformToArray(this.myZTree.getNodes());
		},
		
		getNode: function(id){
			return this.myZTree.getNodeByParam('id', id, null);
		},
		
		selectNode: function(node, isGroup){
			/*neither $("#" + node.tId + "_a")[0].click() nor this.myZTree.selectNode(node) works well.
            the first situation cause error if the tree haven't been expanded and the 'node' is a child of some parent node 
            the second situation do not trigger the click event. 
            
            here we simulate the click action
            */
            if(isGroup){
                this.editGroup = node;
            }
            
            if(this._beforeClick(this.myZTree.setting.treeId, node)){
                this.myZTree.selectNode(node);
                this._clickIt(node);
                
                return true;
            }
            
            return false;
		},
		
		selectNodeSilent: function(node){
			this.myZTree.selectNode(node);
		},
        
        checkNode: function(node, checked, ignoreCallBack){
            this.myZTree.checkNode(node, checked, true, ignoreCallBack? false : true);
        },
		
		updateNode: function(node){
			this.myZTree.updateNode(node, true);
            
            this._resetDiyDom(node);
		},
		
        //return the selected status after delete. false means nothing was selected
		removeNodes: function(nodes, selectNextNode){
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
        
        clearSelect: function(){
            this.myZTree.cancelSelectedNode();
            
            this.myZTree.checkAllNodes(false);
        },
		
		/******public methods extend for zTree end ******/
		
		_initDom: function(){
			this._createZtree(this.urlOrData); 
		},
        
		_createZtree: function(urlOrData){
            if(this.myZTree){
        		this.myZTree.destroy();
                this.myZTree = null;
                
                this.treeObj.empty();
        	}
            
			if(!this.treeObj.attr('id')){
				this.treeObj.attr('id', 'zt_' + base.uuid());
			}
			
        	this.treeObj.addClass('ztree');
        	
        	var opts = {
    			view: {
    				showLine: false,
    				showIcon: false,
    				selectedMulti: false,
    				dblClickExpand: false
    			},
    			data: {
    				simpleData: {
    					enable: true, 
    					idKey:"id", 
    					pIdKey:"pId", 
    					rootPId:null}
    			},
    			async: {
    				enable: true,
    				url:"",
    				type:'GET',
    				autoParam:["id", "name=n", "level=lv"]
    			},
    			check: {
    				enable: true
    			},
    			view: {
					addDiyDom: lang.hitch(this, this._addDiyDom)
				},
				callback: {
					beforeClick: lang.hitch(this, this._beforeClick),
                    beforeDblClick: lang.hitch(this, this._beforeClick),
                    beforeCheck: lang.hitch(this, this._beforeCheck),
                    onCheck: lang.hitch(this, this._onCheck)
				}
    		};
            
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
        	
            opts.callback.onClick = lang.hitch(this, function(event, treeId, treeNode){
                this._clickIt(treeNode);
            });
            
            opts.callback.onDblClick = lang.hitch(this, function(event, treeId, treeNode){
                this._dblClickIt(treeNode);
            });
            
            if(this.beforeDrag){
                opts.callback.beforeDrag = lang.hitch(this, function(treeId, treeNodes){
					return this.beforeDrag(treeNodes);
				});
            }
            if(this.onDrag){
                opts.callback.beforeDrop = lang.hitch(this, function(treeId, treeNodes, targetNode, moveType){
					return this.onDrag(moveType, targetNode, treeNodes);
				});
                
                opts.callback.onDrop = lang.hitch(this, function(event, treeId, treeNodes, targetNode, moveType, isCopy){
                    if(targetNode && moveType && treeNodes && treeNodes.length > 0){
                        for(var i=0; i<treeNodes.length; i++){
                            this._resetStyleAfterDrag(treeId, treeNodes[i]);
                        }
                        
                        if(this.afterDrag){
                            this.afterDrag(targetNode, treeNodes);
                        }
                    }
                });
            }
            
			if(Object.prototype.toString.call(urlOrData) == "[object String]"){
				opts.async = $.extend({}, opts.async, {enable: true, url: urlOrData});
                opts.callback["onAsyncSuccess"] = lang.hitch(this, function(event, treeId, treeNode, msg){
                    if(this.expandFirst){
					   this._expandFirstNode();
				    }
                    
                    if(!base.isNull(this.showCheckBox)){
                        this.toggleCheckMode(false);
                    }
                    
                    if(this.loaded){
                        this.loaded(this);
                    }
                    
                    this._checkEmpty();
                });
				
				this.myZTree = $.fn.zTree.init(this.treeObj, opts, null);
				
			}else{
				opts.data.simpleData.enable = true;
				this.myZTree = $.fn.zTree.init(this.treeObj, opts, urlOrData);
				
				if(this.expandFirst){
					this._expandFirstNode();
				}
                
                if(!base.isNull(this.showCheckBox)){
                    this.toggleCheckMode(false);
                }
                
                if(this.loaded){
                    this.loaded(this);
                }
                
                this._checkEmpty();
			}
			
			this.treeObj.hover(lang.hitch(this, function () {
				if (!this.treeObj.hasClass("showIcon")) {
					this.treeObj.addClass("showIcon");
				}
			}), lang.hitch(this, function() {
				this.treeObj.removeClass("showIcon");
			}));
        },
        
        _clickIt: function(treeNode){
            this.currentNode = treeNode;
            
            if(this.click){
                this.click(treeNode);  
            }
        },
        
        _dblClickIt: function(treeNode){
            this.currentNode = treeNode;
            
            if(this.dblClick){
                this.dblClick(treeNode);
            }
        },
        
        _resetStyleAfterDrag: function(treeId, tmpNode){
            $("#" + tmpNode.tId + "_a>span.spaceSpan").remove();

            var switchObj = $("#" + tmpNode.tId + "_switch"), 
                spanObj = $("#" + tmpNode.tId + "_span");

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
                this.treeObj.append('<li style="text-align: center" class="empty">暂无更多数据!</li>');
            }else{
                this._removeEmptyDesc();
            }
        },
        
        _removeEmptyDesc: function(){
            this.treeObj.children('li.empty').remove();
        },
		
		_addDiyDom: function(treeId, treeNode) {
            var aNode = $("#" + treeNode.tId + "_a");
            
			if(treeNode.isParent){
				aNode.css('font-weight', "bold");
			}
            if(this.hover){
                aNode.hover(lang.hitch(this, function(){
                    if(this.hover.inFunc){
                        this.hover.inFunc(treeNode);
                    }
                }), lang.hitch(this, function(){
                    if(this.hover.outFunc){
                        this.hover.outFunc(treeNode);
                    }
                }));
            }
			
			var switchObj = $("#" + treeNode.tId + "_switch"), 
				icoObj = $("#" + treeNode.tId + "_ico"),
				spanObj = $("#" + treeNode.tId + "_span");
			
			switchObj.remove();
			icoObj.before(switchObj);
			spanObj.css('font-family', '"Helvetica Neue", Helvetica, Microsoft Yahei, Hiragino Sans GB, WenQuanYi Micro Hei, sans-serif');
			
            var padLenVal = this._getPadLen(treeNode);
			if (padLenVal.padLen > 0) {
				var spaceStr = "<span class='spaceSpan' style='display: inline-block;width:" + padLenVal.padLen+ "px'></span>";
				switchObj.before(spaceStr);
			}
            
            spanObj.html(this._getTitleTxt(treeNode.name, padLenVal.titlePadLen));
			
			var checkSpan = $("#" + treeNode.tId + "_check");
            if(checkSpan){
            	checkSpan.remove();
            	switchObj.before(checkSpan);
            }
            
            if(!this.groupSelect){
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
            $("#" + node.tId + "_span").html(this._getTitleTxt(node.name, this._getPadLen(node).titlePadLen));
            
            //groupSelect status
            var icoObj = $("#" + node.tId + "_ico");
            if(!this.groupSelect){
                icoObj.css('display', 'none');
            }
            
            //group status
            //cause the 'isParent' property will be changed dynamic(initial value on add is 'false'), we need to reset its style and event
            if(node.isParent){
				$("#" + node.tId + "_a").css('font-weight', "bold");
			}
            this._setGroupEditIconClick(icoObj, node);
        },
        
        _setGroupEditIconClick: function(icoObj, treeNode){	
            if(treeNode.isParent && this.groupSelect){
                icoObj.unbind().click(lang.hitch(this, function(e){
                    e.stopPropagation();
                    
                    //edit group
                    if(base.isNull(this.beforeClick) || this.beforeClick(treeNode)){
                        this.selectNode(treeNode, true);
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
            
			if(!treeNode.nocheck && !this.deleteState){
				if(treeNode.isParent){
					this.myZTree.expandNode(treeNode);
				}
				return false;
                
			}else if(treeNode.isParent){
				if(this.editGroup && this.editGroup.tId == treeNode.tId){
					return true;
				}else{
					this.myZTree.expandNode(treeNode);
					return false;
				}
                
			}else{
				//if the client node was clicked, clear editgroup status
				this.editGroup = null;
				
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
                
                topic.publish('common/widget/ztree/unCheck', $.extend(unChkNodes, {instanceId: this.instanceId}));
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
                
                topic.publish('common/widget/ztree/check', $.extend(chkNodes, {instanceId: this.instanceId}));
            }
        },
		
        //return the select status. if needSelect is false, always return true, otherwise the result is 'whether we have select an non-parent node'.
		_expandFirstNode: function(needSelect){
            var seled = false;
            
            var allNodes = this.getAllNodes();
            if(allNodes.length > 0){
                if(needSelect){
                    for(var i=0; i<allNodes.length; i++){
                        if(!allNodes[i].isParent){
                            seled = this.selectNode(allNodes[i]);
                            break;
                        }
                    }
                }else{
                    seled = this.selectNode(allNodes[0]);
                }
            }
            
            if(needSelect){
                return seled;
            }else
                return true;
		}
    });
});
