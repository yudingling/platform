
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/jqwidgets/Jqx",
    "root/fileSelector/FileSelector",
    "root/excelParser/ExcelParser",
    "dojo/text!./template/linearinterpolation.html",
    "tool/css!./css/linearinterpolation.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Jqx,
        FileSelector,
        ExcelParser,
        template){
    
    return declare("component.ruleMgr.widget.lip", [_Widget], {
        baseClass: "component_ruleMgr_widget_lip",
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
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find("div.table").jqxGrid('destroy');
        	}
        	
        	this.inherited(arguments);
        },
        
        _initDom: function(){
        	//the refMetadata can not be the metadata itself in linearInterpolation. filter the select options
        	var sel = $(this.domNode).find('.refMetaId');
        	for(var i=0; i<this.metadatas.length; i++){
                if(this.metadatas[i].meta_ID != this.ruleObj.meta_ID){
                    if(this.metadatas[i].meta_ID == this.ruleObj.meta_ID_REF){
                        sel.append($('<option value="'+ this.metadatas[i].meta_ID +'" selected = "selected">'+ this.metadatas[i].meta_NM +'</option>'));
                    }else{
                        sel.append($('<option value="'+ this.metadatas[i].meta_ID +'">'+ this.metadatas[i].meta_NM +'</option>'));
                    }
        		}
        	}

        	if(this.isAdd){
        		this._initGrid();
        		
        	}else{
        		var spin = new Spin($(this.domNode));

        		base.ajax({
        			type: 'GET',
        			url: base.getServerNM() + 'platformApi/own/rule/normal/ruleDetail',
        			data: {clientId: this.ruleObj.c_ID, ruleUnionID: this.ruleObj.ucr_ID, ruleID: this.ruleObj.rule_ID}
                }).success(lang.hitch(this, function(ret){
                    this._initGrid(ret.data);
                    
                    spin.destroy();
                })).fail(function(){
                    spin.destroy();
                });
        	}
        },
        
        _initGrid: function(data){
        	var source = {
                datatype: "array",
                localdata: data? data : [],
                datafields: [
                    { name: 'li_KEY', type: 'string'},
                    { name: 'li_VAL', type: 'string'}
                ]
            };

        	$(this.domNode).find("div.table").jqxGridCN({
                width:'100%',
                height: '100%',
                source: new $.jqx.dataAdapter(source),
                pageable: false,
                autoheight: false,
                sortable: false,
                altrows: false,
                enabletooltips: false,
                editable: true,
                theme: 'custom-zd',
                showheader: true,
                columnsresize: true,
                selectionmode: 'singlecell',
                showtoolbar: true,
                rendertoolbar: lang.hitch(this, function (toolbar){
                    var container = $("<div></div>");
                    toolbar.html('').append(container);
                    container.append('<i class="fa fa-minus-circle fa-lg delete" title="删除"></i>');
                    container.append('<i class="fa fa-plus-circle fa-lg add" title="增加"></i>');
                    container.append('<i class="fa fa-file-excel-o fa-lg excel" title="excel导入,列名为: li_KEY、li_VAL"></i>');
                    
                    container.find('i.fa.add').click(lang.hitch(this, function(){
                        this._addNewLi();  
                    }));
                    container.find('i.fa.delete').click(lang.hitch(this, function(){
                        this._deleteSelectLi();  
                    }));
                    
                    var fs = new FileSelector(container.find('i.fa.excel'), ".xlsx", lang.hitch(this, function(e){
                    	this._loadExcel(e);
                    }));
                    this.own(fs);
                }),
                columns: [
                    { text: '键', datafield: 'li_KEY', cellsalign: 'center', align: 'center'},
                    { text: '值', datafield: 'li_VAL', cellsalign: 'center', align: 'center'}
                ]
            });
        },
        
        _addNewLi: function(){
            $(this.domNode).find("div.table").jqxGrid('addrow', null, {li_KEY: null, li_VAL: null}, 'first');
        },
        
        _deleteSelectLi: function(){
            var grid = $(this.domNode).find("div.table");
            
            var cell = grid.jqxGrid('getselectedcell');
            if(cell){
                var rowid = grid.jqxGrid('getrowid', cell.rowindex);
                if(!base.isNull(rowid) && rowid>=0){
                    grid.jqxGrid('deleterow', rowid);
                    return;
                }
            }
            
            base.info('提示', '请选中要删除的行');
        },
        
        _loadExcel: function(e){
        	var spin = new Spin($(this.domNode));
        	
        	ExcelParser.parse(e.currentTarget.files[0]).success(lang.hitch(this, function(data) {
                //sheet. fetch the first sheet
        		var sheet = null;
        		for(var snm in data){
        			sheet = data[snm];
        			break;
        		}
        		
        		$(this.domNode).find("div.table").jqxGrid('clear');
        		this._initGrid(sheet);
        		
        		spin.destroy();
        		
            })).fail(function(err) {
                base.error('错误', err);
                
                spin.destroy();
            });
        },
        
        _save: function(){
        	var saveData = this._getSaveData();
        	
        	if(!base.isNull(saveData)){
        		base.ajax({
            		hintOnSuccess: true,
            		type: this.isAdd? 'POST' : 'PUT',
            		data: {'info': JSON.stringify(saveData)},
        			url: base.getServerNM() + 'platformApi/own/rule/ruleInfo',
            	}).success(lang.hitch(this, function(ret){
            		topic.publish('component/ruleMgr/save/success', {ruleType: this.ruleType, isAdd: this.isAdd,  ruleObj: $.extend(saveData, ret.data)});
            	}));
        	}
        },
        
        _getSaveData: function(){
        	var refMetaId = $(this.domNode).find('.refMetaId').val();
        	var rows = $(this.domNode).find("div.table").jqxGrid('getrows');
        	
        	if(!refMetaId || refMetaId.length == 0){
        		base.error('提醒', '关联元数据不能为空');
        		return null;
        	}
        	
        	if(!rows || rows.length < 2){
        		base.error('提醒', '曲线数据至少两条');
        		return null;
        	}
        	//get the save data. should not modify "this.ruleObj.meta_ID_REF" directly, save request could be fail on some case, like unauth
        	return $.extend({}, this.ruleObj, {meta_ID_REF: refMetaId, li_ROWS: JSON.stringify(rows)})
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('component/ruleMgr/save', lang.hitch(this, function(data){
                this._save();
            }));
            
            this.own(sub1);
        }
    });
});
