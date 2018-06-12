
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/dateTimePicker/DateTimePicker",
    "root/pageSwitch/pageSwitch",
    "root/customScrollbar/CustomScrollBar",
    "root/jqwidgets/Jqx",
    "common/widget/deviceActionTree/deviceActionTree",
    "dojo/text!./template/customCmd.html",
    "tool/css!./css/customCmd.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        DateTimePicker, 
        PageSwitch,
        CustomScrollBar,
        Jqx,
        DeviceActionTree,
        template){
    
    return declare("component.deviceMgr.widget.customCmd", [_Widget], {
        baseClass: "component_deviceMgr_widget_customCmd",
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
            
            this.resizeBind = lang.hitch(this, function(){
                $(this.domNode).find('.gridContainer').jqxGrid('refresh');
            });
            $(window).resize(this.resizeBind);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                this._search();
                
            }), 500);
        },
        
        destroy: function(){
            //jqxGrid need to be destroyed before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.gridContainer').jqxGrid('destroy');
        	}
            
        	this.inherited(arguments);
            
        	if(this.resizeBind){
        		$(window).unbind('resize', this.resizeBind);
        	}
        },
        
        _initDom: function(){
            this.ps = new PageSwitch($(this.domNode).find('.content')[0],{
        	    duration:600,
        	    direction:0,
        	    start:0,
        	    loop:false,
        	    ease:'ease',
        	    transition:'scrollX',
        	    freeze:false,
        	    mouse:false,
        	    mousewheel:false,
        	    arrowkey:false,
        	    autoplay:false,
        	    interval:0
        	});
            
            var sdp = new DateTimePicker($(this.domNode).find('.search .stm'), 'Y-m-d', (new Date()).add('d', -5).format('yyyy-MM-dd'));
            this.own(sdp);
            
            var edp = new DateTimePicker($(this.domNode).find('.search .etm'), 'Y-m-d', (new Date()).format('yyyy-MM-dd'));
            this.own(edp);
            
            $(this.domNode).find('.search button.search').click(lang.hitch(this, function(){
                this._search();
        	}));
            
            $(this.domNode).find('.search .nameOrId').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	this._search();
                }
            }));
            
            $(this.domNode).find('.search button.add').click(lang.hitch(this, function(){
                if(!this.cmdTree){
                    this.cmdTree = new DeviceActionTree({
                        groupSelect: false, 
                        ownedClients: true, 
                        showCheckBox: true
                    });
                    
                    $(this.domNode).find('.content .step2 .newTree').append($(this.cmdTree.domNode));
                    this.cmdTree.startup();
                    this.own(this.cmdTree);
                }
                
                $(this.domNode).find('.search').addClass('showAdd');
                this.ps.next();
        	}));
            
            $(this.domNode).find('.search button.cancel').click(lang.hitch(this, function(){
                this.ps.prev();
                $(this.domNode).find('.search').removeClass('showAdd');
        	}));
            
            $(this.domNode).find('.search button.save').click(lang.hitch(this, function(){
                this._save();
        	}));
            
            var parent = $(this.domNode).find(".content .grid > .svPage");

            parent.find('.currentPage').keydown(lang.hitch(this, function (event) {
                if (event.which == 13) {
                    this._search();
                }
            }));

            parent.find('i.fa-arrow-right').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var curPageNode = parent.find('.currentPage');

                    var cur = parseInt(curPageNode.val());
                    if (cur < this.totalPage) {
                        curPageNode.val(cur + 1);

                        this._search();
                    }
                }
            }));

            parent.find('i.fa-arrow-left').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var curPageNode = parent.find('.currentPage');
                    var cur = parseInt(curPageNode.val());
                    if (cur > 1) {
                        curPageNode.val(cur - 1);

                        this._search();
                    }
                }
            }));
        },
        
        _save: function(){
            var chkData = this.cmdTree.getCheckedNodes();
            if(chkData.clients.length == 0){
                base.info('输入错误', '请至少选择一个设备');
                return;
            }
            
            var cmdNode = $(this.domNode).find('.content .step2 .newContent textarea');
            var cmd = cmdNode.val();
            if(cmd.length == 0){
                base.info('输入错误', '命令不能为空');
                return;
            }

            var newRows = [], ts = (new Date()).format('yyyy/MM/dd HH:mm:ss');
            for(var i=0; i<chkData.chkNodes.length; i++){
                var sel = chkData.chkNodes[i];
                if(chkData.clients.indexOf(sel.dId) >= 0){
                    newRows.push({c_ID: sel.dId, c_NM: sel.name, ctcmd_CONTENT: cmd, ctcmd_RESP: null, ctcmd_RESP_TS: null, crt_TS: ts});
                }
            }

            base.ajax({
                hintOnSuccess: true,
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/command/customCmd',
                data: {
                    cids: JSON.stringify(chkData.clients),
                    cmd: cmd
                }
            }).success(lang.hitch(this, function(ret){
                this._appendCmd(newRows);

                this.cmdTree.clearSelect();
                cmdNode.val(null);

                this.ps.prev();
                $(this.domNode).find('.search').removeClass('showAdd');
            }));
        },
        
        _search: function () {
        	this._clearContent();
            
            var spin = new Spin($(this.domNode).find('.grid'));
            
            var search = $(this.domNode).find('input.nameOrId').val();
            var stm = $(this.domNode).find('.search .stm').val() + ' 00:00:00';
            var etm = $(this.domNode).find('.search .etm').val() + ' 23:59:59';
            var pageSize = 10;

            var curPageNode = $(this.domNode).find('.content .grid > .svPage > .currentPage');
         
            var curPage = parseInt(curPageNode.val());

            if (isNaN(curPage) || curPage < 1) {
                curPage = 1;
                curPageNode.val(curPage);
            }

            if (!base.isNull(this.totalPage) && this.totalPage > 0) {
                if (curPage > this.totalPage) {
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }

            base.ajax({
                url: base.getServerNM() + 'platformApi/own/client/normal/customCmdList',
                data: {
                	 search: search,
                     stm: stm,
                     etm: etm,
                     start: (curPage - 1) * pageSize,
                     length: pageSize
                }
            }).success(lang.hitch(this, function (ret) {
            	
                this._refreshGird(ret.data[1]);

                this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);

                $(this.domNode).find('.content .grid > .svPage > .totalPage').text(this.totalPage);

                if (this.totalPage == 0) {
                    curPageNode.val(0);
                }
                spin.destroy();
               
            })).fail(lang.hitch(this, function () {          	
                $(this.domNode).find('.content .grid > .svPage > .currentPage').val('0');
                $(this.domNode).find('.content .grid > .svPage > .totalPage').val('0');
                spin.destroy();
            }));
        },
        
        _clearContent: function(){
            $(this.domNode).find('.content .step1 .gridContainer').jqxGrid('clearselection');
            
            $(this.domNode).find('.content .step1 .detail form label.labelForVal').html(null);
            $(this.domNode).find('.content .step1 .detail form textarea').val(null);
        },
        
        _refreshGird: function(data){
            var source = {
                datatype: "array",
                localdata: data? data : [],
                datafields: [
                    { name: 'c_ID', type: 'string'},
                    { name: 'c_NM', type: 'string'},
                    { name: 'ctcmd_CONTENT', type: 'string'},
                    { name: 'ctcmd_RESP', type: 'string'},
                    { name: 'ctcmd_RESP_TS', type: 'string'},
                    { name: 'crt_TS', type: 'string'}
                ]
            };
            
            var gridDom = $(this.domNode).find('.content .step1 .gridContainer');
            
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
                        { text: '设备名称', datafield: 'c_NM', cellsalign: 'center', align: 'center', width: 150},
                        { text: '命令时间', datafield: 'crt_TS', cellsalign: 'center', align: 'center', width: 120},
                        { text: '命令内容', datafield: 'ctcmd_CONTENT',  cellsalign: 'left', align: 'center', cellsrenderer: function(index, columnfield, value, defaulthtml, columnproperties, rowdata){
                            var txt = base.encodeDescription(value);
                            return '<span style="line-height:29px; margin-left:5px">' + base.subDescription(txt, 35) + '</span>';
                        }}
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
            var parent = $(this.domNode).find('.content .step1 .detail form');
            
            parent.find('label.clientId').html(rowData.c_ID);
            parent.find('label.clientNm').html(rowData.c_NM);
            parent.find('label.crtTM').html(rowData.crt_TS);
            parent.find('textarea.cmdContent').val(rowData.ctcmd_CONTENT);
            parent.find('label.responseTM').html(rowData.ctcmd_RESP_TS);
            parent.find('textarea.responseContent').val(rowData.ctcmd_RESP);
        },
        
        _appendCmd: function(newRows){
            var gridDom = $(this.domNode).find('.content .step1 .gridContainer').jqxGrid('addrow', null, newRows, 'first');
            
            this._clearContent();
        },
        
        _initEvents: function () {
        },
    });
});
