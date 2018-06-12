define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/concernList.html",
    "tool/css!./css/concernList.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             CustomScrollBar,
             template) {

    return declare("main.mobile.dataMonitor.concernList", [_Widget], {
        baseClass: "main_mobile_dataMonitor_concernList",
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
                CustomScrollBar.init($(this.domNode));
                
            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {
            this._setData();
        },

        _setData: function () {
            base.ajax({
                url: base.getServerNM() + "platformApi/own/client/normal/starList",
                type: 'GET'
            }).success(lang.hitch(this, function (ret) {

                var dataList = ret.data.clients;
                
                if(base.isNull(dataList) || dataList.length == 0){
                	              
                	$(this.domNode).find('.tip').show();
                }else{     
               
                	$(this.domNode).find('.tip').hide();
                	
	                var tsMap = ret.data.latestTM;
	                var len = parseInt((this.parentWidth - 160) / 7);
	                
	                var addList = [];
	                for (var i = 0; i < dataList.length; i++) {
	                    addList.push(this._createItem(dataList[i], tsMap[dataList[i].c_ID], len));
	                }
	                
	                $(this.domNode).find('.list-group').append(addList);
                }
            }));
        },

        _createItem: function (data, latestTs, len) {
            var tmStr = latestTs ? (new Date(latestTs)).format('MM/dd HH:mm') : '';

            var item = $('<a href="javascript:void(0);" data="' + data.c_ID + '" class="list-group-item"><span></span><i class="fa fa-star"></i><span><small>' + tmStr + '</small></span></a>').data('data', data);
            item.find('span:first-child').data("cNM", data.c_NM);

            var cNM = base.subDescription(data.c_NM, len);
            if (cNM.length < data.c_NM.length) {
                item.find('span:first-child').text(cNM);
                item.attr('title', data.c_NM);
            } else {
                item.find('span:first-child').text(data.c_NM);
            }

            item.click(lang.hitch(this, function (e) {
                topic.publish('main/mobile/dataMonitor/commonDetail/select', data);
            }));

            item.find('i.fa-star').click(lang.hitch(this, function (e) {
                e.stopPropagation();

                base.ajax({
                    type: 'DELETE',
                    url: base.getServerNM() + "platformApi/own/client/normal/star",
                    data: {clientId: data.c_ID}
                }).success(lang.hitch(this, function (ret) {
                    this._afterStarDelete(item);
                }));

            }));

            return item;
        },

        _afterStarDelete: function (item) {
            item.addClass('fadeOutUp animated')
                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', lang.hitch(this, function () {
                    item.off('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend');
                    item.remove();
                }));
        },

        _starAdd: function (data) {
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + "platformApi/own/client/normal/latestTm",
                data: {clientId: data.c_ID}
            }).success(lang.hitch(this, function (ret) {
            	$(this.domNode).find('.tip').hide();
            	
                $(this.domNode).find('.list-group').append(this._createItem(data, ret.data, parseInt((this.parentWidth - 160) / 7)));
            }));
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('main/mobile/dataMonitor/commonDetail/toggleStar', lang.hitch(this, function (data) {
                var item = $(this.domNode).find('.list-group>.list-group-item[data="' + data.c_ID + '"]');
                if (data.star) {
                    if (item.length == 0) {
                        this._starAdd(data);
                    }
                } else {
                    if (item.length > 0) {
                        this._afterStarDelete(item);
                    }
                }
            }));

            this.own(sub1);
        }
    });
});
