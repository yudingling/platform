define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/jqwidgets/Jqx",
    "dojo/text!./template/3rdAuth.html",
    "tool/css!./css/3rdAuth.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             CustomScrollBar,
             Jqx,
             template) {

    return declare("component.3rdAuth", [_Widget], {
        baseClass: "component_3rdAuth",
        templateString: template,
        
        selfAuth: true,
        
        constructor: function (args) {
            declare.safeMixin(this, args);

            this.cachedDetails = [];

            this._initEvents();
        },

        postCreate: function () {
            this.inherited(arguments);

            this._initDom();

            this._initAction();
        },

        startup: function () {
            this.inherited(arguments);

            this.resizeBind = lang.hitch(this, function () {
                $(this.domNode).find('.gridContainer').jqxGrid('refresh');
            });
            $(window).resize(this.resizeBind);

            this.defer(lang.hitch(this, function () {
                this._search();

                this._loadServiceInfo();

                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
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
            var parent = $(this.domNode).find(".content > .grid > .svPage");

            parent.find('.currentPage').keydown(lang.hitch(this, function (event) {
                if(event.which == 13) {
                    this._search();
                }
            }));

            parent.find('i.fa-arrow-right').click(lang.hitch(this, function (event) {

                if(!base.isNull(this.totalPage)) {
                    var curPageNode = parent.find('.currentPage');

                    var cur = parseInt(curPageNode.val());
                    if(cur < this.totalPage) {
                        curPageNode.val(cur + 1);

                        this._search();
                    }
                }
            }));

            parent.find('i.fa-arrow-left').click(lang.hitch(this, function (event) {

                if(!base.isNull(this.totalPage)) {
                    var curPageNode = parent.find('.currentPage');
                    var cur = parseInt(curPageNode.val());
                    if(cur > 1) {
                        curPageNode.val(cur - 1);

                        this._search();
                    }
                }
            }));
            
            $(this.domNode).find('.search input[name="check"]').change(lang.hitch(this, function (event) {
            	this._search();
            }));
        },
        
        _search: function () {

            this._clearContent();

            var rl_result = $(this.domNode).find('.search input[name="check"]:checked').val();
            var search = $(this.domNode).find('input.nameOrId').val();

            var pageSize = 15;

            var curPageNode = $(this.domNode).find('.content > .grid > .svPage > .currentPage');
            var curPage = parseInt(curPageNode.val());


            if(isNaN(curPage) || curPage < 1) {
                curPage = 1;
                curPageNode.val(curPage);
            }

            if(!base.isNull(this.totalPage) && this.totalPage > 0) {
                if(curPage > this.totalPage) {
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }

            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysCheck/thirdparty/serviceListAuth',
                data: {   
                    search: search,
                    rl_result: rl_result,
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function (ret) {
            	
                this.servceList = ret.data[1];
                this._refreshGird(this.servceList);

                this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);

                $(this.domNode).find('.content > .grid > .svPage > .totalPage').text(this.totalPage);

                if(this.totalPage == 0) {
                    curPageNode.val(0);
                }

            })).fail(lang.hitch(this, function () {
                $(this.domNode).find('.content > .grid > .svPage > .currentPage').val('0');
                $(this.domNode).find('.content > .grid > .svPage > .totalPage').val('0');
            }));
        },

        _clearContent: function () {
            this.current = null;
            $(this.domNode).find('.gridContainer').jqxGrid('clearselection');
            $(this.domNode).find('button.pass').attr('disabled', 'disabled').addClass('disabled');
            $(this.domNode).find('button.refuse').attr('disabled', 'disabled').addClass('disabled');
            $(this.domNode).find(".detail .serviceInfo").children().hide();
            $(this.domNode).find(".rlNameDiv").hide();
        },

        _refreshGird: function (data) {
            var source = {
                datatype: "array",
                localdata: data ? data : [],
                datafields: [
                	{name: 'tps_ID', type: 'string'},
                    {name: 'tps_NM', type: 'string'},
                    {name: 'u_NM', type: 'string'},
                    {name: 'crt_TS', type: 'string'},      
                    {name: 'rl_RESULT', type: 'string'},
                    {name: 'rl_NAME', type: 'string'}  
                ]
            };

            var gridDom = $(this.domNode).find('.gridContainer');

            if(!this.gridInited) {
                this.gridInited = true;

                gridDom.jqxGridCN({
                    width: '100%',
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
                        {text: '服务名称', datafield: 'tps_NM', width: 184, cellsalign: 'center', align: 'center'},
                        {text: '创建者', datafield: 'u_NM', width: 180, cellsalign: 'center', align: 'center'},
                        {text: '申请时间', datafield: 'crt_TS', width: 180, cellsalign: 'center', align: 'center'}
                    ]
                }).on('rowselect', lang.hitch(this, function (event) {
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

            if(this.current.rl_RESULT == 0) {             
                $(this.domNode).find('button.pass').removeAttr('disabled').removeClass('disabled');
                $(this.domNode).find('button.refuse').removeAttr('disabled').removeClass('disabled');
            }
            this._showService(rowData);
        },

        _loadServiceInfo: function () {
            if(!this.svInfo) {
                base.newDojo(
                    "component/3rdStore/widget/3rdServiceInfo/3rdServiceInfo",
                    "component_3rdStore_widget_3rdsinfo",
                    {isSysCheck: true}
                ).success(lang.hitch(this, function (obj) {

                    this.svInfo = obj;
                    this.svInfo.startup();
                    this.own(this.svInfo);
                    $(this.domNode).find(".detail .serviceInfo").append($(this.svInfo.domNode));
                    
                }));
            }
        },

        _showService: function (data) {

            var detailData = this.cachedDetails[data.tps_ID];

            if(detailData) {
                this.svInfo.refresh(detailData);
                $(this.domNode).find(".detail .serviceInfo").children().show();
                $(this.domNode).find(".detail .serviceInfo div.tip").hide();
                $(this.domNode).find(".rlNameDiv").show();
                $(this.domNode).find(".content > .detail > .outter .rlName").text(this.current.rl_NAME);
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/sysCheck/thirdparty/verifyServiceDetail',
                    data: {
                        tpsId: data.tps_ID
                    }
                }).success(lang.hitch(this, function (ret) {
                    detailData = ret.data;

                    if(base.isNull(detailData)) {

                        $(this.domNode).find(".detail .serviceInfo").children().hide();
                        $(this.domNode).find(".rlNameDiv").hide();
                        $(this.domNode).find(".detail .serviceInfo div.tip").show();
                    }else{

                        this.cachedDetails[data.tps_ID] = detailData;

                        $(this.domNode).find(".detail .serviceInfo").children().show();
                        $(this.domNode).find(".rlNameDiv").show();
                        $(this.domNode).find(".detail .serviceInfo div.tip").hide();
                        this.svInfo.refresh(detailData);
                    
                        $(this.domNode).find(".content > .detail > .outter .rlName").text(this.current.rl_NAME);
                    }
                }));
            }
        },

        _initEvents: function () {
        },
        
        _saveData: function(rl_result,rl_info, tps_reliable){
        	  base.ajax({
                  type: 'PUT',
                  hintOnSuccess: true,
                  url: base.getServerNM() + 'platformApi/own/sysCheck/thirdparty/serviceStatusAuth',
                  data: {
                      tps_id: this.current.tps_ID,
                      rl_result: rl_result,
                      rl_info: rl_info,
                      tps_reliable: this.current.rl_NAME
                  }
              }).success(lang.hitch(this, function () {
                  var gridDom = $(this.domNode).find('.gridContainer');

                  var rowId = gridDom.jqxGrid('getrowid', this.current.boundindex);
                  gridDom.jqxGrid('deleterow', rowId);

                  this._clearContent();

                  this._search();
                  
                  var reason = $(this.domNode).find("textarea.reason").val("");
                  $(this.domNode).find(".modal.failEdit").modal("hide");
              }));         
        },

        _initAction: function () {
            $(this.domNode).find('button.pass').data("type", 1);
            $(this.domNode).find('button.refuse').data("type", 2);

            $(this.domNode).find('.checkBtn button').click(lang.hitch(this, function (e) {
                var rl_result = $(e.currentTarget).data("type");

                if(this.current) {
                    if(rl_result == 1) {
                    	 base.confirmSave('确认', '通过该认证申请?', lang.hitch(this, function(){
                    		 this._saveData(rl_result);                           
                         }));                     
                    }else{

                        $(this.domNode).find(".modal.failEdit").modal("show");

                        $(this.domNode).find(".btn.sure").unbind().click(lang.hitch(this, function () {
                            var reason = $(this.domNode).find("textarea.reason");
                            var rl_info;
                            if(base.isNull(reason.val()) || reason.val().length == 0) {
                                reason.focus();
                                base.error("错误", "表单域未赋值");
                            }else{
                                var array = reason.val().split("\n");

                                rl_info = JSON.stringify(array);                                                               
                            }

                            this._saveData(rl_result,rl_info);
                        }));
                    }
                }
            }));

            $(this.domNode).find('.search button').click(lang.hitch(this, function () {
                this._search();
            }));

            $(this.domNode).find('.search .nameOrId').keydown(lang.hitch(this, function (event) {
                if(event.which == 13) {
                    this._search();
                }
            }));
        }
    });
});
