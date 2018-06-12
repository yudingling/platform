define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/jqwidgets/Jqx",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/userRNAuth.html",
    "tool/css!./css/userRNAuth.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             Spin,
             Jqx,
             CustomScrollBar,
             template) {

    return declare("component.userRNAuth", [_Widget], {
        baseClass: "component_userRNAuth",
        templateString: template,
        
        selfAuth: true,
        
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
            var parent = $(this.domNode).find(".content > .grid > .svPage");

            parent.find('.currentPage').keydown(lang.hitch(this, function (event) {
                if(event.which == 13) {
                    this._search();
                }
            }));

            parent.find('i.fa-arrow-right').click(lang.hitch(this, function (event) {

                if(!base.isNull(this.totalPage)) {
                    var curPageNode = $(this.domNode).find('.content > .grid > .svPage > .currentPage');

                    var cur = parseInt(curPageNode.val());
                    if(cur < this.totalPage) {
                        curPageNode.val(cur + 1);

                        this._search();
                    }
                }
            }));

            parent.find('i.fa-arrow-left').click(lang.hitch(this, function (event) {

                if(!base.isNull(this.totalPage)) {
                    var curPageNode = $(this.domNode).find('.content > .grid > .svPage > .currentPage');
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

            var result = $(this.domNode).find('.search input[name="check"]:checked').val();
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
                url: base.getServerNM() + 'platformApi/own/sysCheck/user/rNAuthInfoList',
                data: {
                    search: search,
                    result: result,
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function (ret) {

                this.userRnauthInfo = ret.data[1];
                this._refreshGird(this.userRnauthInfo);

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
            $(this.domNode).find('label.labelForVal').html(null);
            $(this.domNode).find("div.idPhotoA>img").removeAttr("src");
            $(this.domNode).find("div.idPhotoB>img").removeAttr("src");
        },

        _refreshGird: function (data) {
            var source = {
                datatype: "array",
                localdata: data ? data : [],
                datafields: [
                    {name: 'u_ID', type: 'string'},
                    {name: 'rna_NM', type: 'string'},
                    {name: 'rna_ID', type: 'string'},
                    {name: 'phone', type: 'string'},
                    {name: 'upt_TS', type: 'string'},
                    {name: 'rna_RESULT', type: 'int'}
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
                        {text: '账号', datafield: 'u_ID', width: 184, cellsalign: 'center', align: 'center'},
                        {text: '姓名', datafield: 'rna_NM', width: 180, cellsalign: 'center', align: 'center'},
                        {text: '申请时间', datafield: 'upt_TS', width: 180, cellsalign: 'center', align: 'center'}
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

            if(this.current.rna_RESULT == 0) {
                $(this.domNode).find('button.pass').removeAttr('disabled').removeClass('disabled');
                $(this.domNode).find('button.refuse').removeAttr('disabled').removeClass('disabled');
            }

            if(this.userRnauthInfo) {
                var parent = $(this.domNode).find(".content > .detail  .detailCC> form > div");
                var currentObj = this.userRnauthInfo[this.current.boundindex];

                parent.find("label.name").html(currentObj.rna_NM);

                if(currentObj.rna_RESULT == 0) {
                    parent.find("label.result").html("待审核");
                } else if(currentObj.rna_RESULT == 1) {
                    parent.find("label.result").html("已认证");
                }else{
                    parent.find("label.result").html("审核未通过");
                }

                parent.find("label.phone").html(currentObj.rna_PHONE);

                var urlA = this._getUserRnauthPhotoUrl(currentObj.rna_IDPIC_0);
                $(this.domNode).find("div.idPhotoA>img").attr("src", urlA);

                var urlB = this._getUserRnauthPhotoUrl(currentObj.rna_IDPIC_1);
                $(this.domNode).find("div.idPhotoB>img").attr("src", urlB);

                parent.find("label.idNumber").html(currentObj.rna_ID);
                parent.find("label.phone").html(currentObj.u_PHONE);
                parent.find("label.upt_ts").html((new Date(currentObj.upt_TS)).format("yyyy年MM月dd日"));
            }
        },

        _getUserRnauthPhotoUrl: function (fileId) {
            return base.getServerNM('file') + 'fileApi/own/rnauth?fileId=' + fileId;
        },

        _initEvents: function () {
        },

        _initAction: function () {
            $(this.domNode).find('button.pass').data("type", 1);
            $(this.domNode).find('button.refuse').data("type", 2);

            $(this.domNode).find('.checkBtn button').click(lang.hitch(this, function (e) {
                var rna_RESULT = $(e.currentTarget).data("type");

                if(this.current) {
                    if(rna_RESULT == 1) {
                        base.ajax({
                            type: 'PUT',
                            hintOnSuccess: true,
                            url: base.getServerNM() + 'platformApi/own/sysCheck/user/rNAuthInfoVerify',
                            data: {
                                uid: this.current.u_ID,
                                rna_result: rna_RESULT
                            }
                        }).success(lang.hitch(this, function () {
                            var gridDom = $(this.domNode).find('.gridContainer');

                            var rowId = gridDom.jqxGrid('getrowid', this.current.boundindex);
                            gridDom.jqxGrid('deleterow', rowId);

                            this._clearContent();

                            this._search();
                        }));
                    }else{
                        $(this.domNode).find(".modal.failEdit").modal("show");

                        $(this.domNode).find(".btn.sure").unbind().click(lang.hitch(this, function () {
                            var reasonObj = $(this.domNode).find("textarea.reason");
                            var reasonStr = reasonObj.val();

                            if(base.isNull(reasonStr) || reasonStr.length == 0) {
                                reasonObj.focus();
                                base.error("错误", "表单域未赋值");
                            }else{
                                var array = reasonStr.split("\n");

                                rna_INFO = JSON.stringify(array);
                            }

                            base.ajax({
                                type: 'PUT',
                                hintOnSuccess: true,
                                url: base.getServerNM() + 'platformApi/own/sysCheck/user/rNAuthInfoVerify',
                                data: {
                                    uid: this.current.u_ID,
                                    rna_result: rna_RESULT,
                                    rna_info: rna_INFO
                                }
                            }).success(lang.hitch(this, function () {
                                var gridDom = $(this.domNode).find('.gridContainer');

                                var rowId = gridDom.jqxGrid('getrowid', this.current.boundindex);
                                gridDom.jqxGrid('deleterow', rowId);

                                this._clearContent();

                                this._search();

                                $(this.domNode).find("textarea.reason").val("");
                                $(this.domNode).find(".modal.failEdit").modal("hide");
                            }));
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
