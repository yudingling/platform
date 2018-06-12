
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/event",
    "tool/validator",
    "root/spin/Spin",
    'root/jqwidgets/Jqx',
    "root/dateTimePicker/DateTimePicker",
    "dojo/text!./template/editor.html",
    "tool/css!./css/editor.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        event,
        Validator,
        Spin,
        Jqx,
        DateTimePicker,
        template){
    
    return declare("common.widget.sysMetas.image.widget.editor", [_Widget], {
        baseClass: "common_widget_sysMetas_image_widget_editor",
        templateString: template,
        
        authApi: {
            imageData: '/platformApi/own/seriesUpdate/imageData'
        },
        
        /*
           args: {
              stm: '2015-12-10 08:00:00',
              etm: '2015-12-15 08:30:00',
              clientId: 'xxx',
              metaId: 'xxx'
           }
        */
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.delRowsId = [];
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.resizeBind = lang.hitch(this, function(){
                this._resizeManual();
            });
            $(window).resize(this.resizeBind);
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            this.canSave = Boolean($(this.domNode).find('form .save').attr('bindAuthResult'));
            this.canDelete = Boolean($(this.domNode).find('.cmdInfo .delete').attr('bindAuthResult'));
            
            this._hideOnInit();
            
            //we need 'this.canSave' in '_setData', so call this in bindAuthed rather than startup
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.grid>div.gridContainer').jqxGrid('destroy');
        	}
            
        	this.inherited(arguments);
            
            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
        },
        
        _initDom: function(){
            var dps = new DateTimePicker($(this.domNode).find('form .stm'), 'Y-m-d H:i:S', this.stm);
            this.own(dps);
            
            var dpe = new DateTimePicker($(this.domNode).find('form .etm'), 'Y-m-d H:i:S', this.etm);
            this.own(dpe);
            
            $(this.domNode).find('form .stm').val(this.stm);
            $(this.domNode).find('form .etm').val(this.etm);
            
            $(this.domNode).find('form button.search').click(lang.hitch(this, function(){
                this._setData();
            }));
            
            $(this.domNode).find('.cmdInfo li.delete i').click(lang.hitch(this, function(){
        		this._delete();
        	}));
        },
        
        _dataChanged: function(){
            var btnSave = $(this.domNode).find('form .save');
            if(this.canSave && !btnSave.is(':visible')){
                btnSave.show().unbind().click(lang.hitch(this, function(){
                    this._save();
                }));
            }
        },
        
        _save: function(closeOnSuccess){
            var spin = new Spin($(this.domNode));
            
            base.ajax({
                type: 'DELETE',
                url: base.getServerNM() + "platformApi/own/seriesUpdate/imageData",
                data: {
                    delIds: JSON.stringify(this.delRowsId),
                    clientId: this.clientId,
                    metaId: this.metaId
                }
            }).success(lang.hitch(this, function(ret){
                base.ok('成功', '数据保存成功');
                spin.destroy();
                
                if(closeOnSuccess){
                    this._closeSelf();
                }else{
                    this._hideOnInit();
                    this._search();
                }
                
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _delete: function(){
            var grid = $(this.domNode).find('.grid>div.gridContainer');
            var delIndexs = grid.jqxGrid('getselectedrowindexes');
            if(delIndexs && delIndexs.length > 0){
                var ids = [];
                var selDeleted = false;
                
                for(var i=0; i<delIndexs.length; i++){
                    var rowid = grid.jqxGrid('getrowid', delIndexs[i]);
                    if(!base.isNull(rowid)){
                        ids.push(rowid);
                        
                        var rowData = grid.jqxGrid('getrowdata', delIndexs[i]);
                        this.delRowsId.push(rowData.if_ID);
                        
                        if(this.selectedIFID == rowData.if_ID){
                            selDeleted = true;
                        }
                    }
                }
                
                if(ids.length > 0){
                    grid.jqxGrid('deleterow', ids);
                    
                    if(selDeleted){
                        this._removeImage();
                    }
                    
                    this._dataChanged();
                }
                
                $(this.domNode).find('.cmdInfo li.delete').hide();
                grid.jqxGrid('clearselection');
                
            }else{
                base.info('提示', '请选中要删除的行');
            }
        },
        
        _removeImage: function(){
            this.selectedIFID = null;
            
            $(this.domNode).find('img').attr('src', null);
        },
        
        _setImage: function(rowData){
            if(this.selectedIFID && this.selectedIFID == rowData.if_ID){
                return;
            }
            
            this.selectedIFID = rowData.if_ID;
            $(this.domNode).find('img').attr('src', rowData.url);
        },
        
        _refreshGrid: function(data){
            var source = {
                datatype: "array",
                localdata: data? data : [],
                id: 'if_ID',
                datafields: [
                    { name: 'if_ID', type: 'string'},
                    { name: 'if_COLTS', type: 'string'},
                    { name: 'crt_TS', type: 'string'},
                    { name: 'url', type: 'string'}
                ]
            };
            
            var grid = $(this.domNode).find('.grid>div.gridContainer');
            
            if(!this.gridInited){
                this.gridInited = true;
                
                grid.jqxGridCN({
                    width:'100%',
                    height: '100%',
                    source: new $.jqx.dataAdapter(source),
                    pageable: false,
                    autoheight: false,
                    sortable: false,
                    altrows: false,
                    enabletooltips: false,
                    editable: false,
                    theme: 'custom-zd',
                    showheader: true,
                    columnsresize: true,
                    selectionmode: 'checkbox',
                    columns: [
                        { text: '采集时间', datafield: 'if_COLTS', cellsalign: 'center', align: 'center', width: 170,
                            cellsrenderer: function(rowIndex, columnfield, value, defaulthtml, columnproperties){
                                var tmDiv = $(defaulthtml).text((new Date(parseInt(value))).format('yyyy/MM/dd HH:mm:ss.fff'));
                                tmDiv.addClass('ifId');
                                
                                return tmDiv[0].outerHTML;
                            }
                        }
                    ]
                }).on('cellclick', lang.hitch(this, function(event){
                    if(event.args.datafield == 'if_COLTS'){
                        this._setImage(event.args.row.bounddata);
                    }
                    
                })).on('rowselect', lang.hitch(this, function(event){
                    this._rowChecked(event);
                })).on('rowunselect', lang.hitch(this, function(event){
                    this._rowChecked(event);
                }));
                
            }else{
                grid.jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
            }
        },
        
        _rowChecked: function(){
            if(this.canDelete){
                var selRows = $(this.domNode).find('.grid>div.gridContainer').jqxGrid('getselectedrowindexes');
                if(selRows && selRows.length > 0){
                    $(this.domNode).find('.cmdInfo li.delete').show();
                }else{
                    $(this.domNode).find('.cmdInfo li.delete').hide();
                }
            }
        },
        
        _resizeManual: function(){
            $(this.domNode).find('.grid>div.gridContainer').jqxGrid('refresh');
        },
        
        _setData: function(){
            if($(this.domNode).find('form .save').is(':visible')){
                base.confirmSave('提示', '数据已修改，是否保存?', lang.hitch(this, function(){
                    this._save();
                    this._search();

                }), lang.hitch(this, function(){
                    this._search();
                }));
                
            }else{
                this._search();
            }
        },
        
        _search: function(){
            var spin = new Spin($(this.domNode));
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + "platformApi/own/series/imageData",
                data: {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    stm: $(this.domNode).find('form .stm').val(),
                    etm: $(this.domNode).find('form .etm').val()
                }
            }).success(lang.hitch(this, function(ret){
                this._refreshGrid(ret.data);
                
                this._hideOnInit();
                $(this.domNode).find('.grid>div.gridContainer').jqxGrid('clearselection');
                
                spin.destroy();
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _hideOnInit: function(){
            $(this.domNode).find('form .save').hide();
            $(this.domNode).find('.cmdInfo .delete').hide();
            
            this.delRowsId = [];
            
            this._removeImage();
        },
        
        _closeSelf: function(){
            topic.publish('common/widget/sysMetas/image/closeModal');
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/sysMetas/image/modalClosing', lang.hitch(this, function(){
                if($(this.domNode).find('form .save').is(':visible')){
                    base.confirmSave('提示', '数据已修改，是否保存?', lang.hitch(this, function(){
                        this._save(true);
                        
                    }), lang.hitch(this, function(){
                        this._closeSelf();
                    }));
                }else{
                    this._closeSelf();
                }
            }));
            
            this.own(sub1);
        }
    });
});
