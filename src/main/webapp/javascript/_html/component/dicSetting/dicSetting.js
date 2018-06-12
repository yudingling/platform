define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/jqwidgets/Jqx",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/dicSetting.html",
    "tool/css!./css/dicSetting.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             Spin,
             Jqx,
             CustomScrollBar,
             template) {

    return declare("component.dicSetting", [_Widget], {
        baseClass: "component_dicSetting",
        templateString: template,
        
        selfAuth: true,

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

            this.resizeBind = lang.hitch(this, function () {
                $(this.domNode).find('.gridContainer').jqxGrid('refresh');
            });
            $(window).resize(this.resizeBind);
            
            this.defer(lang.hitch(this, function () {
            	CustomScrollBar.init($(this.domNode).find(".content > .detail"));
                this._search();

            }), 500);
        },

        destroy: function () {
        	if(this.domNode){
        		$(this.domNode).find('.gridContainer').jqxGrid('destroy');
        	}

            this.inherited(arguments);

            if(this.resizeBind) {
                $(window).unbind('resize', this.resizeBind);
            }
        },

        _initDom: function () {
            $(this.domNode).find('.search button').click(lang.hitch(this, function () {
                this._search();
            }));

            $(this.domNode).find('.search .nameOrId').keydown(lang.hitch(this, function (event) {
                if(event.which == 13) {
                    this._search();
                }
            }));
            
            $(this.domNode).find('button.save').click(lang.hitch(this, function(){
                base.confirmSave('更新', '确定更新此设置?', lang.hitch(this, function(){
                    this._save();
                    
                }), function(){});
            }));
        },
        
        _save: function(){
            var dicNm = $(this.domNode).find('textarea.dicNm').val();
            if(dicNm.length <= 0){
                base.error('错误', 'name 不能为空');
                return;
            }

            var dicVal = $(this.domNode).find('textarea.dicVal').val();
            if(dicNm.length <= 0){
                base.error('错误', 'value 不能为空');
                return;
            }

            base.ajax({
                type: 'PUT',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/sysMgr/dic',
                data: {
                    dicId: this.current.dic_ID,
                    dicNm: dicNm,
                    dicVal: dicVal
                }
            }).success(lang.hitch(this, function () {
                var gridDom = $(this.domNode).find('.gridContainer');
                var rowId = gridDom.jqxGrid('getrowid', this.current.boundindex);
                $.extend(this.current, {dic_NM: dicNm, dic_VAL: dicVal});

                gridDom.jqxGrid('updaterow', rowId, this.current);
            }));
        },

        _search: function () {
            this._clearContent();
            
            var search = $(this.domNode).find('input.nameOrId').val();
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysMgr/dic',
                data: {
                    search: search
                }
            }).success(lang.hitch(this, function (ret) {
                this._refreshGird(ret.data);
            }));
        },

        _clearContent: function () {
            this.current = null;

            $(this.domNode).find('.gridContainer').jqxGrid('clearselection');
            $(this.domNode).find('.detailCC button.save').hide();
            $(this.domNode).find('.detailCC label.labelForVal').html(null);
            $(this.domNode).find('.detailCC input[type="text"], textarea').val('');
        },

        _refreshGird: function (data) {
            var source = {
                datatype: "array",
                localdata: data? data : [],
                datafields: [
                    { name: 'dic_ID', type: 'string'},
                    { name: 'dic_NM', type: 'string'},
                    { name: 'dic_VAL', type: 'string'},
                    { name: 'dic_EDIT', type: 'int'}
                ]
            };
            
            var gridDom = $(this.domNode).find('.gridContainer');
            
            if(!this.gridInited){
                this.gridInited = true;
                
                gridDom.jqxGridCN({
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
                    showtoolbar: false,
                    columns: [
                        { text: 'key', datafield: 'dic_ID', cellsalign: 'left', align: 'center'},
                        { text: 'name', datafield: 'dic_NM', cellsalign: 'left', align: 'center'}
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

        _showDetail: function (rowData) {
            this.current = rowData;
            
            var parent = $(this.domNode).find(".content>.detail  .detailCC>form");
            
            if(this.current.dic_EDIT == 0) {
                parent.find('button.save').hide();
            }else{
                parent.find('button.save').show();
            }
            
            parent.find('.dicId').text(this.current.dic_ID);
            parent.find('.dicNm').val(this.current.dic_NM);
            parent.find('.dicVal').val(this.current.dic_VAL);
            
        },

        _initEvents: function () {
        }
    });
});
