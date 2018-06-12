
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/jqwidgets/Jqx",
    "dojo/text!./template/deviceRecover.html",
    "tool/css!./css/deviceRecover.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        Jqx,
        template){
    
    return declare("component.deviceMgr.widget.dataRecover", [_Widget], {
        baseClass: "component_deviceMgr_widget_dataRecover",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);

            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
            
            this._initAction();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.resizeBind = lang.hitch(this, function(){
                $(this.domNode).find('.gridContainer').jqxGrid('refresh');
            });
            $(window).resize(this.resizeBind);
            
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.gridContainer').jqxGrid('destroy');
        	}
            
        	this.inherited(arguments);
            
        	if(this.resizeBind){
        		$(window).unbind('resize', this.resizeBind);
        	}
        },
        
        _initDom: function(){
        },
        
        _setData: function(){
            this._clearContent();
            
            var spin = new Spin($(this.domNode));
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/client/normal/deletedClientList',
                data: {search: $(this.domNode).find('input.nameOrId').val()}
            }).success(lang.hitch(this, function(ret){
                this._refreshGird(ret.data);
                
                spin.destroy();
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _clearContent: function(){
            this.current = null;
            
            $(this.domNode).find('.gridContainer').jqxGrid('clearselection');
            
            $(this.domNode).find('button.recover').attr('disabled', 'disabled').addClass('disabled');
            
            $(this.domNode).find('label.labelForVal').html(null);
        },
        
        _refreshGird: function(data){
            var source = {
                datatype: "array",
                localdata: data? data : [],
                datafields: [
                    { name: 'c_ID', type: 'string'},
                    { name: 'c_NM', type: 'string'},
                    { name: 'crt_TS', type: 'string'},
                    { name: 'upt_TS', type: 'string'}
                ]
            };
            
            var gridDom = $(this.domNode).find('.gridContainer');
            
            if(!this.gridInited){
                this.gridInited = true;
                
                gridDom.jqxGridCN({
                    width:'100%',
                    height: '100%',
                    source: new $.jqx.dataAdapter(source),
                    pageable: true,
                    autoheight: false,
                    sortable: false,
                    altrows: false,
                    enabletooltips: false,
                    editable: false,
                    theme: 'custom-zd',
                    showheader: true,
                    columnsresize: true,
                    showtoolbar: false,
                    columns: [
                        { text: '名称', datafield: 'c_NM', cellsalign: 'center', align: 'center'},
                        { text: '创建日期', datafield: 'crt_TS', cellsalign: 'center', align: 'center'},
                        { text: '删除日期', datafield: 'upt_TS', cellsalign: 'center', align: 'center'}
                    ]
                }).on('rowselect', lang.hitch(this, function (event){ 
                    this._showDetail(event.args.row);
                }));
                
            }else{
                gridDom.jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
            }
            
            gridDom.jqxGrid('refresh');
        },
        
        _showDetail: function(rowData){
            this.current = rowData;
            
            $(this.domNode).find('button.recover').removeAttr('disabled').removeClass('disabled');
            
            base.ajax({
            	url: base.getServerNM() + 'platformApi/own/client/normal/deletedClientInfo',
            	data: {clientId: rowData.c_ID}
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
            	$(this.domNode).find("label.clientId").html(data.c_ID);
            	$(this.domNode).find("label.clientNm").html(data.c_NM);
            	$(this.domNode).find("label.mfNm").html(data.mf_NM);
                $(this.domNode).find("label.pdNm").html(data.pd_NM);
                $(this.domNode).find("label.fwNm").html(data.fw_V);
            	$(this.domNode).find("label.crtTs").html((new Date(data.crt_TS)).format("yyyy年MM月dd日"));
            	$(this.domNode).find("label.uptTs").html((new Date(data.upt_TS)).format("yyyy年MM月dd日"));
            }));
        },
        
        _initEvents: function () {
        },
        
        _initAction: function(){
        	$(this.domNode).find('button.recover').click(lang.hitch(this, function(){
                if(this.current){
                    base.ajax({
                        type: 'PUT',
                        hintOnSuccess: true,
                        url: base.getServerNM() + 'platformApi/own/client/normal/clientRecovery',
                        data: {clientId: this.current.c_ID}
                    }).success(lang.hitch(this, function(){
                        var gridDom = $(this.domNode).find('.gridContainer');
                        
                        var rowId = gridDom.jqxGrid('getrowid', this.current.boundindex);
                        gridDom.jqxGrid('deleterow', rowId);
                        
                        this._clearContent();
                    }));
                }
        	}));
        	
        	$(this.domNode).find('.search button').click(lang.hitch(this, function(){
                this._setData();
        	}));
            
            $(this.domNode).find('.search .nameOrId').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._setData();
                }
            }));
        }
    });
});
