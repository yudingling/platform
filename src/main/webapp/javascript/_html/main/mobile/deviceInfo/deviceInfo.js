define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/pageSwitch/pageSwitch",
    "dojo/text!./template/deviceInfo.html",
    "tool/css!./css/deviceInfo.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             PageSwitch,
             template) {

    return declare("main.mobile.deviceInfo", [_Widget], {
        baseClass: "main_mobile_deviceInfo",
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
            
            this._refreshtreeView();
        },

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {
        
            this._getDetailInfo();

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
                interval: 0
            });

            var input = $(this.domNode).find('.searchAll>.input-group');
            var search = $(this.domNode).find('.searchAll>button');
            var switchBtn = $(this.domNode).find('.switchBtn');
            var cover = $(this.domNode).find(".cover");

            search.click(lang.hitch(this, function () {
                if (input.is(':visible')) {
                    input.hide();
                    search.show();
                    cover.css({"opacity": "0", "z-index": "-1"});
                    switchBtn.css("opacity", "1");
                    
                } else {
                    search.hide();
                    input.width(10).css('display', 'table').animate({'width': '100%'}, 300);
                    input.find('input').val(null).focus();
                    
                    cover.css({"opacity": "0.3", "z-index": "4000"});
                    switchBtn.css("opacity", "0");
                }
            }));

            input.find('input').keydown(lang.hitch(this, function (event) {
                if (event.which == 13) {
                    event.preventDefault();
                    
                    var txtSearch = $(event.currentTarget).val();
                    
                    var icon = switchBtn.find('i');
                    if (icon.hasClass('fa-map-marker')) {
                        if (this.mapView) {
                            this.mapView.search(txtSearch);
                        } else {
                            this._refreshMapView();
                            this.mapView.search(txtSearch);
                        }
                    } else {
                        if (this.treeView) {
                            this.treeView.search(txtSearch);
                        } else {
                            this._refreshtreeView();
                            this.treeView.search(txtSearch);
                        }
                    }
                    search.click();
                }

            })).blur(lang.hitch(this, function (event) {
                if (input.is(':visible')) {
                    search.click();
                }
            }));

            switchBtn.click(lang.hitch(this, function () {
                var icon = switchBtn.find('i');
                if (icon.hasClass('fa-map-marker')) {
                    icon.removeClass("fa-map-marker").addClass("fa-bars");
                    switchBtn.removeClass("btn-warning").addClass("btn-primary");
                    
                    if (this.treeView) {
                        $(this.domNode).find(".mapView").hide();
                        $(this.domNode).find(".treeView").show();
                    } else {
                        this._refreshtreeView();
                    }
                } else {
                    icon.removeClass("fa-bars").addClass("fa-map-marker");
                    switchBtn.removeClass("btn-primary").addClass("btn-warning");
                    
                    if (this.mapView) {
                        $(this.domNode).find(".treeView").hide();
                        $(this.domNode).find(".mapView").show();
                    } else {
                        this._refreshMapView();
                    }
                }
            }));
        },

        _refreshtreeView: function () {
            $(this.domNode).find(".mapView").hide();
            $(this.domNode).find(".treeView").show();

            if (!this.treeView) {
                base.newDojo(
                    "main/mobile/deviceInfo/widget/treeView/treeView",
                    "main_mobile_deviceInfo_treeView",
                    null
                ).success(lang.hitch(this, function (obj) {
                    this.treeView = obj;
                    $(this.domNode).find(".treeView").append($(this.treeView.domNode));
                    this.treeView.startup();
                    this.own(this.treeView);
                }));
            }
        },

        _refreshMapView: function () {

            $(this.domNode).find(".treeView").hide();
            $(this.domNode).find(".mapView").show();
            if (!this.mapView) {
                base.newDojo(
                    "main/mobile/deviceInfo/widget/mapView/mapView",
                    "main_mobile_deviceInfo_mapView",
                    {center: [108.216, 37.159], zoom: 5}
                ).success(lang.hitch(this, function (obj) {
                    this.mapView = obj
                    $(this.domNode).find(".mapView").append($(this.mapView.domNode));
                    this.mapView.startup();
                    this.own(this.mapView);
                }));
            }
        },

        _getDetailInfo: function () {
            base.newDojo("main/mobile/deviceInfo/widget/detail/detail", "detail", null).success(lang.hitch(this, function (obj) {
                this.detail = obj;
                $(this.domNode).find('.steps>.detail>div:last-child').append($(obj.domNode));
                this.detail.startup();
                this.own(this.detail);
            }));
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('main/mobile/deviceInfo/nextPage', lang.hitch(this, function () {
                this.pageSwitch.next();
            }));

            var sub2 = topic.subscribe('main/mobile/deviceInfo/prePage', lang.hitch(this, function () {
                this.pageSwitch.prev();
            }));

            this.own(sub1);
            this.own(sub2);
        }
    });
});
