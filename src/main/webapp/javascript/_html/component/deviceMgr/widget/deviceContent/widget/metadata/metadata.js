
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "common/widget/zTree/zTree",
    "root/objectSelector/ObjectSelector",
    "dojo/text!./template/metadata.html",
    "tool/css!./css/metadata.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        ZTree,
        ObjectSelector,
        template){
    
    return declare("component.deviceMgr.widget.dc.metadata", [_Widget], {
        baseClass: "component_deviceMgr_widget_dc_md",
        templateString: template,
        
        authApi: {
            'clientInfo': '/platformApi/own/client/clientInfo'
        },
        
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
        	
        	if(this.mdTree){
        		this.mdTree.destroyRecursive();
        	}
        },
        
        bindAuthed: function(){
        	this.inherited(arguments);
        },
        
        getDataForSave: function(){
        	this._savePreSelectData();
            
            return this.mdTree? this.mdTree.getAllNodes() : [];
        },
        
        _getSysMetaData: function(callBack){
            if(this.sysMetasMap){
                callBack();
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/client/normal/sysMetadata'
                }).success(lang.hitch(this, function(ret){
                    this.sysMetasTreeData = ret.data;

                    this.sysMetasMap = {};
                    for(var i=0; i<ret.data.length; i++){
                        if(ret.data[i].type == 'client'){
                            this.sysMetasMap[ret.data[i].dId] = ret.data[i];
                        }
                    }
                    
                    callBack();
                }));
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('.setTop i.append').click(lang.hitch(this, function(e){
            	if(this.mdTree){
            		this._addMetadata();
            	}
            }));
            
            $(this.domNode).find('.setTop i.delete').click(lang.hitch(this, function(e){
            	if(this.mdTree){
            		this._toggleDeleteStatus(true);
            		
            		this.mdTree.toggleCheckMode();
            	}
            }));
            
            $(this.domNode).find('.setTop i.cancel').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        		this.mdTree.toggleCheckMode();
        	}));
        	
        	$(this.domNode).find('.setTop i.ok').click(lang.hitch(this, function(){
        		this._deleteMetadata();
        		this._toggleDeleteStatus(false);
        		this.mdTree.toggleCheckMode();
        	}));
            
            $(this.domNode).find('input.metaCid,input.metaNm').change(lang.hitch(this, function(){
                if(this.mdTree && this.preSelect){
                    var meta_CID = $(this.domNode).find('input.metaCid').val().trim();
                    var meta_NM = $(this.domNode).find('.metaNm').val().trim();
                    //instead of modify this.preSelect, we extend a new object to update the name of the selected treeNode
                    this.mdTree.updateNode($.extend({}, this.preSelect, {name: meta_NM.length>0? meta_NM : meta_CID}));
                }
            }));
            
            $(this.domNode).find('i.sysMetaList').click(lang.hitch(this, function(){
                if(this.preSelect && this.sysMetaSelector){
                    
                    this.sysMetaSelector.show(lang.hitch(this, function(objContainer){
                        return this._treeSelected(objContainer.data('data'));
                        
                    }), {width: '200px', height: '300px', top: '100px', right: '50px' });
                }
            }));
        },
        
        _treeSelected: function(sel){
            if(base.isNull(sel)){
                base.info('提醒', '请选择一个系统元数据');
                return false;
            }else{
                if(this.preSelect.sysmeta_ID != sel.dId){
                    $(this.domNode).find('.metaSysChgInfo').show();
                }else{
                    $(this.domNode).find('.metaSysChgInfo').hide();
                }

                $(this.domNode).find('.metaSysMetaID').val(sel.dId);
                $(this.domNode).find('.metaSysMetaNM').val(sel.name);
                
                return true;
            }
        },
        
        _initSysMetaSelector: function(){
            if(this.sysMetaSelector)
                return;
            
            this.sysMetaSelector = new ObjectSelector(
                $(this.domNode).find('.mdContent'), 
                '系统元数据映射', 
                lang.hitch(this, function(objContainer){
                    
                    if(this.sysMetaTree){
                        this.sysMetaTree.clearSelect();
                        objContainer.removeData('data');
                        
                    }else{
                        this.sysMetaTree = new ZTree({
                            treeObj: objContainer,
                            urlOrData: this.sysMetasTreeData,  //'this.sysMetasTreeData' has been required in  'this._setContent'
                            expandFirst: false,
                            render: null, 
                            beforeClick: null, 
                            click: function(treeNode){
                                //store the treeNode to somewhere that we can achieve from okevent passed in the 'show' method.
                                //here we assign the selected data to objContainer. also you may try an another way you like
                                objContainer.data('data', treeNode);
                            },
                            dblClick: lang.hitch(this, function(treeNode){
                                if(this._treeSelected(treeNode)){
                                    this.sysMetaSelector.hide();
                                }
                            })
                        });

                        this.sysMetaTree.startup();
                        this.own(this.sysMetaTree);
                    }
                    
                    //select the related sysmetadata. mind that 'selDId' defined below has the value of treeNode's dId rather than id. 
                    //  so you need to find the 'id' from sysMetasMap
                    var selDId = $(this.domNode).find('.metaSysMetaID').val();
                    if(selDId && selDId.length>0){
                        var nodeId = this.sysMetasMap[selDId].id;

                        this.sysMetaTree.selectNode(this.sysMetaTree.getNode(nodeId));
                    }
                })
            );
            
            this.own(this.sysMetaSelector);
        },
        
        _deleteMetadata: function(){
        	var nodes = this.mdTree.getCheckedNodes(true);
            
        	if(nodes.length > 0){
                //check the delete nodes contains the 'new node' or not
                for(var i=0; i<nodes.length; i++){
                    if(base.isNull(nodes[i].id)){
                        this.preSelect = null;
                        break;
                    }
                }
                
        		var havedSelected = this.mdTree.removeNodes(nodes, true);
                if(!havedSelected){
                    this._clearContent();
                }
        	}
        },
        
        _toggleDeleteStatus: function(isDelete, setUptoOtherClick){
        	var utNode = $(this.domNode).find('.setTop i.updateToOthers');
        	
        	if(isDelete){
        		$(this.domNode).find('.setTop i.delete').hide();
        		$(this.domNode).find('.setTop i.append').hide();
        		
        		utNode.hide();
        		
        		$(this.domNode).find('.setTop i.ok').show();
        		$(this.domNode).find('.setTop i.cancel').show();
        		
        	}else{
        		$(this.domNode).find('.setTop i.ok').hide();
        		$(this.domNode).find('.setTop i.cancel').hide();
        		
        		$(this.domNode).find('.setTop i.delete').show();
        		$(this.domNode).find('.setTop i.append').show();
        		
        		if(this._canUpdateToOthersVisible(utNode)){
        			utNode.show();
        		}else{
        			utNode.hide();
        		}
        	}
        	
        	if(setUptoOtherClick){
            	if(this._canUpdateToOthersVisible(utNode)){
            		utNode.unbind('click').click(lang.hitch(this, function(e){
                    	if(this.mdTree){
                    		this._updateToOthers();
                    	}
                    }));
            	}
        	}
        },
        
        _canUpdateToOthersVisible: function(utNode){
        	if(utNode.attr('bindAuthResult') && (base.isNull(this.uid) || this.uid == base.getUid())){
        		return true;
        	}else{
        		return false;
        	}
        },
        
        _addMetadata: function(){
            if(this._checkUnSave()){
                return;
            }
            
        	var newRow = {
				id: null, 
                pId: null,
				name: '[新元数据]', 
                nocheck: true,
                meta_ID: null,
                c_ID: this.clientId,  //clientId is null when the client is just created. the api should reset the clientId on saving
                meta_CID: null,
                meta_NM: null,
                sysMeta_ID: null,
                crt_TS: null,
                upt_TS: null
    		};
        	
        	var addedRow = this.mdTree.addNodes(null, [newRow]);
            if(addedRow.length > 0){
            	this.mdTree.selectNode(addedRow[0]);
            }
        },
        
        _updateToOthers: function(){
        	base.confirmSave('批量更新至其他设备', '将元数据名称、单位、数据映射信息更新至其他具有相同元数据"标识"的设备（更新前确保当前设备的信息已保存）?', lang.hitch(this, function(){
        		var spin = new Spin($(this.domNode));
        		
        		base.ajax({
        			type: 'PUT',
        			hintOnSuccess: true,
                    url: base.getServerNM() + 'platformApi/own/client/metadataSync',
                    data: {
                    	clientId: this.clientId
                    }
                }).success(function(ret){
                	spin.destroy();
                }).fail(function(){
                	spin.destroy();
                });
        		
        	}), function(){
        	});
        },
        
        _updateTree: function(metadata){
            var metaCIDMap = {};
            for(var i=0; i<metadata.length; i++){
                metaCIDMap[metadata[i].meta_CID] = metadata[i];
            }
            
            var nodes = this.mdTree.getAllNodes();
            for(var i=0; i<nodes.length; i++){
                var curNode = nodes[i];
                
                $.extend(curNode, metaCIDMap[curNode.meta_CID])
                
                this.mdTree.updateNode(curNode);
            }
        },
        
        _createTree: function(metadata){
        	this._clearContent();
            
            if(this.mdTree){
        		this.mdTree.destroyRecursive();
                this.mdTree = null;
        	}
            
            if(metadata){
                //cause mdTree will be create/destroy on search，so we use "destroyRecursive" instead of "this.own(this.mdTree)"
                this.mdTree = new ZTree({
                    treeObj: $(this.domNode).find('.mdList ul'),
                    urlOrData: metadata, 
                    expandFirst: true,
                    render: null, 
                    maxTitleAsciiLen: parseInt(($(this.domNode).find('.mdList').width() - 12) / 7),
                    beforeClick: lang.hitch(this, function(treeNode){
                        return !this._checkUnSave(treeNode);
                    }), 
                    click: lang.hitch(this, function(treeNode){
                        this._selectItem(treeNode);
                    })
                });

                this.mdTree.startup();
            }
        },
        
        _checkUnSave: function(treeNode){
            if(this.preSelect){
                if(treeNode && treeNode.tId == this.preSelect.tId){
                    return false;
                }
                
                var metaCId = $(this.domNode).find('input.metaCid').val().trim();
                
                if(metaCId.length == 0){
                    base.info('提醒', '元数据的标识不能为空');
                    return true;
                    
                }else{
                    //metaCid cann't be duplicate
                    var nodes = this.mdTree.getAllNodes();
                    for(var i=0; i<nodes.length; i++){
                        if(nodes[i].tId != this.preSelect.tId && nodes[i].meta_CID == metaCId){
                            base.info('提醒', '元数据的标识不能重复');
                            return true;
                        }
                    }
                }
            }
            
            return false;
        },
        
        _setDomOnSelect: function(){
            if(this.sysMetaSelector){
                this.sysMetaSelector.hide();
            }
            
            $(this.domNode).find('.mdContent .metaSysChgInfo').hide();
        },
        
        _selectItem: function(treeNode){
        	if(!this.preSelect || this.preSelect.tId != treeNode.tId){
                this._setDomOnSelect();
                
                //save the preNode data before change the selection, this action also happened on the getDataForSave method
                this._savePreSelectData();
                
        		this.preSelect = treeNode;
        		this._setContent(treeNode);
			}
        },
        
        _savePreSelectData: function(){
            if(this.preSelect){
                this.preSelect.meta_CID = $(this.domNode).find('input.metaCid').val().trim();
                this.preSelect.meta_NM = $(this.domNode).find('.metaNm').val().trim();
                this.preSelect.meta_UNIT = $(this.domNode).find('.metaUnit').val().trim();
                this.preSelect.sysmeta_ID = $(this.domNode).find('.metaSysMetaID').val().trim();
                
                this.preSelect.name = this.preSelect.meta_NM.length>0? this.preSelect.meta_NM : this.preSelect.meta_CID;
                
                this.mdTree.updateNode(this.preSelect);
            }
        },
        
        _setContent: function(row){
            var inputMetaCid = $(this.domNode).find('input.metaCid').val(row.meta_CID);
            var labelMetaCid = $(this.domNode).find('label.metaCid').text(row.meta_CID);
            
            if(base.isNull(row.meta_CID)){
                inputMetaCid.show();
                labelMetaCid.hide();
            }else{
                inputMetaCid.hide();
                labelMetaCid.show();
            }
            
            $(this.domNode).find('.metaNm').val(row.meta_NM);
            $(this.domNode).find('.metaSSMf').html(row.meta_MF_NM);
            $(this.domNode).find('.metaSSPd').html(row.meta_PD_NM);
            $(this.domNode).find('.metaSysMetaID').val(row.sysmeta_ID);
            $(this.domNode).find('.metaUnit').val(row.meta_UNIT);
            
            this._getSysMetaData(lang.hitch(this, function(){
                if(this.sysMetasMap && row.sysmeta_ID){
                    $(this.domNode).find('.metaSysMetaNM').val(this.sysMetasMap[row.sysmeta_ID].name);
                }else{
                    $(this.domNode).find('.metaSysMetaNM').val(null);
                }
                
                this._initSysMetaSelector();
            }));
        },
        
        _clearContent: function(){
            this._setDomOnSelect();
            
            this.preSelect = null;
            
        	$(this.domNode).find('.mdContent input:not([type="radio"])').val(null).text(null);
            $(this.domNode).find('.mdContent label.labelForVal').html('');
            $(this.domNode).find('.mdContent select').val(null);
            $(this.domNode).find('.mdContent .metaSysChgInfo').hide();
            
            this._toggleDeleteStatus(false, true);
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('component/deviceMgr/widget/dc/widget/metadata/refresh', lang.hitch(this, function(data){
                this.clientId = null;
                this.uid = null;
                
                if(data){
                    this.clientId = data.clientId;
                    this.uid = data.uid;
                    
                    if(data.isAfterSaved){
                        this._updateTree(data.metadata);
                        
                    }else{
                        this._createTree(data.metadata);
                    }
                    
                }else{
                    this._createTree(null);
                }
                
            }));
            var sub2 = topic.subscribe('component/deviceMgr/widget/dc/widget/metadata/saved', lang.hitch(this, function(data){
                var inputMetaCid = $(this.domNode).find('input.metaCid');
                var labelMetaCid = $(this.domNode).find('label.metaCid');
                
                inputMetaCid.hide();
                labelMetaCid.text(inputMetaCid.val()).show();
                
                this._toggleDeleteStatus(false);
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
