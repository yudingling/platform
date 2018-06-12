define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/star.html",
    "tool/css!./css/star.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        template){
    
    return declare("component.dataMonitor.widget.star", [_Widget], {
        baseClass: "component_dataMonitor_widget_star",
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
            
            this._setData();
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customscrollbar'));
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.list-group>.list-group-item i.fa-star').tooltip('destroy');
            
            //clear all clients
            topic.publish('component/dataMonitor/widget/monitorMap/refreshClients');
        },
        
        _initDom: function(){
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + "platformApi/own/client/normal/starList",
                type: 'GET'
            }).success(lang.hitch(this, function(ret){
                var dataList = ret.data.clients;
                var tsMap = ret.data.latestTM;
                
                var parent = $(this.domNode).find('.list-group');
                for(var i=0; i<dataList.length; i++){
                    this._createItem(parent, dataList[i], tsMap[dataList[i].c_ID]);
                }

                topic.publish('component/dataMonitor/widget/monitorMap/refreshClients', dataList);
                topic.publish('component/dataMonitor/menuResultShown');
            }));
        },
        
        _createItem: function(parent, data, latestTs){
            var tmStr = latestTs? (new Date(latestTs)).format('MM/dd HH:mm') : '';
            
            var item = $('<a href="javascript:void(0);" data="'+ data.c_ID +'" class="list-group-item"><span></span><i class="fa fa-star"></i><span><small>'+ tmStr +'</small></span></a>').data('data', data);
            
            var cNM = base.subDescription(data.c_NM, 32);
            if(cNM.length < data.c_NM.length){
                item.find('span:first-child').text(cNM);
                item.attr('title', data.c_NM);
            }else{
                item.find('span:first-child').text(data.c_NM);
            }
            
            item.hover(lang.hitch(this, function(){
                if(!base.isNull(data.c_LGTD) && !base.isNull(data.c_LTTD)){
                    topic.publish('component/dataMonitor/widget/monitorMap/position', data);
                }
            }), lang.hitch(this, function(){
                topic.publish('component/dataMonitor/widget/monitorMap/position');
                
            })).click(lang.hitch(this, function(e){
                var self = $(e.currentTarget);
                if(!self.hasClass('active')){
                    parent.find('a.list-group-item').removeClass('active');
                    self.addClass('active');
                    
                    if(!base.isNull(data.c_LGTD) && !base.isNull(data.c_LTTD)){
                        topic.publish('component/dataMonitor/widget/monitorMap/locate', data);
                    }
                }
            }));
            
            item.find('i.fa-star').click(lang.hitch(this, function(e){
                e.stopPropagation();
                
                base.ajax({
                    type: 'DELETE',
                    url: base.getServerNM() + "platformApi/own/client/normal/star",
                    data: {clientId: data.c_ID}
                }).success(lang.hitch(this, function(ret){
                    $(e.currentTarget).tooltip('destroy');
                    
                    this._afterStarDelete(item);
                    topic.publish('component/dataMonitor/widget/star/removeManual', $.extend(data, {star: false}));
                }));
                
            })).tooltip({
                container: 'body',
                placement: 'auto right',
                trigger: 'hover',
                title: '取消关注'
            });
            
            parent.append(item);
        },
        
        _afterStarDelete: function(item){
            item.addClass('fadeOutUp animated')
                .one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', lang.hitch(this, function(){
                    item.off('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend');
                    item.remove();
            }));

            topic.publish('component/dataMonitor/widget/monitorMap/removeClient', item.data('data'));
        },
        
        _starAdd: function(data){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + "platformApi/own/client/normal/latestTm",
                data: {clientId: data.c_ID}
            }).success(lang.hitch(this, function(ret){
                this._createItem($(this.domNode).find('.list-group'), data, ret.data);
                topic.publish('component/dataMonitor/widget/monitorMap/addClient', data);
            }));
        },

        _initEvents: function(){
            var sub1 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleStar', lang.hitch(this, function(data){
                var item = $(this.domNode).find('.list-group>.list-group-item[data="'+ data.c_ID +'"]');
                if(data.star){
                    if(item.length == 0){
                        this._starAdd(data);
                    }
                }else{
                    if(item.length > 0){
                        this._afterStarDelete(item);
                    }
                }
            }));
            var sub2 = topic.subscribe('component/dataMonitor/widget/monitorMap/discoveryLocated', lang.hitch(this, function(data){
                $(this.domNode).find('.list-group a.list-group-item.active').removeClass('active');
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
