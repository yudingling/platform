define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dijit/_TemplatedMixin",
    "tool/_BaseWidget",
    "root/customScrollbar/CustomScrollBar",
    "root/spin/Spin",
    "root/pageSwitch/pageSwitch",
    "component/dataMonitor/widget/clientPrevCard/clientPrevCard",
    "dojo/text!./template/latestData.html",
    "tool/css!./css/latestData.css"
], function (base,
             declare,
             lang,
             topic,
             _TemplatedMixin,
             _Widget,
             CustomScrollBar,
             Spin,
             PageSwitch,
             ClientPrevCard,
             template) {

    return declare("main.mobile.latestData", [_Widget, _TemplatedMixin], {
        'baseClass': "main_mobile_latestData",
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
                CustomScrollBar.init($(this.domNode).find('.reportContainer>.cc'));

                this._refreshView();

                this._getDetailInfo();
            }), 500);
        },

        destroy: function () {
            this._destroyPrevCardPlugins();

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

            $(this.domNode).find('.searchNav button.search').click(lang.hitch(this, function () {

                this._refreshView();
            }));

            $(this.domNode).find('.searchNav input').keydown(lang.hitch(this, function (event) {
                if(event.which == 13) {
                    $(this.domNode).find('.searchNav button.search').click();
                    return false;
                }
            }));
        },

        _destroyPrevCardPlugins: function () {
            if(this.destroyPrevCardArray) {
                for (var i = 0; i < this.destroyPrevCardArray.length; i++) {
                    this.destroyPrevCardArray[i].destroyRecursive();
                }
                this.destroyPrevCardArray = null;
            }
        },

        _createPrevCard: function (spin, parent, data, totalSize) {
            this.prevCardPlugin = new ClientPrevCard({hideStar: true, hideTooltip: true});
            this.prevCardPlugin.startup();

            this.destroyPrevCardArray.push(this.prevCardPlugin);

            parent.append($(this.prevCardPlugin.domNode).hide());
            this.prevCardPlugin.refresh(data);

            this.curSize++;
            if(this.curSize == totalSize) {
                parent.children().show();

                spin.destroy();
                this.widgetView = true;
            }
        },

        _showWidgetData: function (spin, data) {
            this._destroyPrevCardPlugins();

            this.destroyPrevCardArray = [];

            this.curSize = 0;

            var parent = $(this.domNode).find('.reportContainer .widgetCC');
            parent.empty();
                     
            var tip = $("<div class='tip'>暂无更多数据!</div>");
            
            if(base.isNull(data) || data.length == 0){
	              
            	parent.append(tip);  
            	spin.destroy();  
            }else{     
            	for (var i = 0; i < data.length; i++) {
                     this._createPrevCard(spin, parent, data[i], data.length);
                }            	
            }               
        },

        _refreshView: function () {
            var spin = new Spin($(this.domNode));

            base.ajax({
                url: base.getServerNM() + 'platformApi/own/client/normal/latestDataReport',
                data: {
                    search: $(this.domNode).find('.searchNav .nameOrId').val().trim()
                }
            }).success(lang.hitch(this, function (ret) {
            	
                this.latestClientMetaData = ret.data;
               
                this._showWidgetData(spin, this.latestClientMetaData);
            })).fail(function () {
                spin.destroy();
            });
        },

        _getDetailInfo: function () {
            base.newDojo(
                "main/mobile/dataMonitor/widget/commonDetail/commonDetail",
                "detail",
                {parentWidth: $(this.domNode).width()}
            ).success(lang.hitch(this, function (obj) {
                this.detail = obj;
                $(this.domNode).find('.steps>.detail').append($(obj.domNode));
                this.detail.startup();
                this.own(this.detail);
            }));
        },

        _initEvents: function () {
            var sub1 = topic.subscribe("main/mobile/dataMonitor/nextPage", lang.hitch(this, function (data) {

                this.pageSwitch.next();
            }));

            var sub2 = topic.subscribe("main/mobile/dataMonitor/prePage", lang.hitch(this, function (data) {

                this.pageSwitch.prev();
            }));

            this.own(sub1);
            this.own(sub2);           
        }
    });
});