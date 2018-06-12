define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/topic",
    "dojo/_base/lang",
    "tool/_BaseWidget",
    "root/jquery-nav/jqueryNav",
    "root/pageSwitch/pageSwitch",
    "dojo/text!./template/dataMonitor.html",
    "tool/css!./css/dataMonitor.css"
], function (base,
             declare,
             topic,
             lang,
             _Widget,
             JqueryNav,
             PageSwitch,
             template) {

    return declare("main.mobile.dataMonitor", [_Widget], {
        baseClass: "main_mobile_dataMonitor",
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
            
            this.defer(lang.hitch(this, function () {
                this._refreshConcernList();
                this._refreshDeviceList();
                this._getDetailInfo();
                
            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {
            var steps = $(this.domNode).find('.steps');
            this.pageSwitch = new PageSwitch(steps[0], {
                duration: 600,
                direction: 0,
                start: 0,
                loop: false,
                ease: 'ease',
                transition: 'scrollX',
                freeze: false,
                mouse: false,
                mousewheel: false,
                arrowkey: false,
                autoplay: false,
                interval: 1000
            });

            var nav = new JqueryNav($(this.domNode).find('.jqNav'), {
                onChange: lang.hitch(this, function (index) {
                    if (index == 1) {
                        if (!this.concernList) {
                            this._refreshConcernList();
                        }

                    } else if (index == 2) {
                        if (!this.deviceList) {
                            this._refreshDeviceList();
                        }
                    }
                })
            });

            this.own(nav);
        },

        _refreshDeviceList: function () {
            base.newDojo(
                "main/mobile/dataMonitor/widget/myDevice/myDevice",
                "deviceList",
                {parentWidth: $(this.domNode).width()}
            ).success(lang.hitch(this, function (obj) {
                this.deviceList = obj;
                $(this.domNode).find('.deviceList').append($(obj.domNode));
                this.deviceList.startup();
                this.own(this.deviceList);
            }));
        },

        _refreshConcernList: function () {
            base.newDojo(
                "main/mobile/dataMonitor/widget/concernList/concernList",
                "concernList",
                {parentWidth: $(this.domNode).width()}
            ).success(lang.hitch(this, function (obj) {
                this.concernList = obj;
                $(this.domNode).find('.concernList').append($(obj.domNode));
                this.concernList.startup();
                this.own(this.concernList);
            }));
        },

        _getDetailInfo: function () {
            base.newDojo(
                "main/mobile/dataMonitor/widget/commonDetail/commonDetail",
                "commonDetail",
                {parentWidth: $(this.domNode).width()}
            ).success(lang.hitch(this, function (obj) {
                this.commonDetail = obj;
                $(this.domNode).find('.commonDetail').append($(obj.domNode));
                this.commonDetail.startup();
                this.own(this.commonDetail);
            }));
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('main/mobile/dataMonitor/nextPage', lang.hitch(this, function () {
                this.pageSwitch.next();
            }));

            var sub2 = topic.subscribe('main/mobile/dataMonitor/prePage', lang.hitch(this, function () {

                this.pageSwitch.prev();
            }));

            this.own(sub1);
            this.own(sub2);
        }
    });
});
