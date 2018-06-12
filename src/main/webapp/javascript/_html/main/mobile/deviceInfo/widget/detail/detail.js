define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/detail.html",
    "tool/css!./css/detail.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             CustomScrollBar,
             template) {

    return declare("main.mobile.deviceInfo.detail", [_Widget], {
        baseClass: "main_mobile_deviceInfo_detail",
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

            this.defer(lang.hitch(this, function () {
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {
            $(this.domNode).find(".prev").click(lang.hitch(this, function () {

                topic.publish('main/mobile/deviceInfo/prePage');
            }));
        },

        _setData: function (clientId) {
            if (!base.isNull(clientId)) {

                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/client/normal/mobile/clientInfo',
                    data: {clientId: clientId}
                }).success(lang.hitch(this, function (ret) {

                    var client = ret.data.client;

                    $(this.domNode).find('span.c_id').text(client.c_ID);

                    $(this.domNode).find('span.c_nm').text(client.c_NM);

                    $(this.domNode).find('span.u_nm').text(client.u_NM);

                    $(this.domNode).find('span.crt_ts').text((new Date(client.crt_TS)).format('yyyy-MM-dd HH:mm'));

                    $(this.domNode).find('span.mf_nm').text(client.mf_NM);

                    $(this.domNode).find('span.pd_nm').text(client.pd_NM);
                    
                    $(this.domNode).find('.svName').text(base.subDescription(client.c_NM, parseInt(($(this.domNode).width() - 50) / 7)));

                    if (client.c_PUBLIC == 1) {
                        $(this.domNode).find('span.c_public').text("是");
                    } else {
                        $(this.domNode).find('span.c_public').text("否");
                    }

                    var metaList = ret.data.metadata;

                    var ul = $(this.domNode).find('.matadata>ul');
                    var addNodes = [];

                    for (var i = 0; i < metaList.length; i++) {
                        var li = $('<li class="list-group-item"><span>' + metaList[i].meta_CID + '</span><span class="mdId label label-warning" style="float: right">' + metaList[i].sysmeta_NM + '</span></li>');
                        addNodes.push(li);
                    }

                    ul.children().remove();
                    ul.append(addNodes);
                }));

            } else {
                base.error("数据未选中", "未选中任何数据");
            }
        },

        _initEvents: function () {
            topic.subscribe("main/mobile/deviceInfo/widget/detailInfo", lang.hitch(this, function (clientId) {
                this._setData(clientId);
                topic.publish("main/mobile/deviceInfo/nextPage");
            }));
        }
    });
});
