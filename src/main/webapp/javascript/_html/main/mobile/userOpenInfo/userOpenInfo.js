
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/pageSwitch/pageSwitch",
    "main/mobile/dataMonitor/widget/commonDetail/commonDetail",
    "dojo/text!./template/userOpenInfo.html",
    "tool/css!./css/userOpenInfo.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        PageSwitch,
        CommonDetail,
        template){
    
    return declare("main.mobile.userOpenInfo", [_Widget], {
        baseClass: "main_mobile_userOpenInfo",
        templateString: template,
        
        selfAuth: true,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.starMap = {};
            
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
                CustomScrollBar.init($(this.domNode).find('.steps>.customScrollbar'));
            }), 500);
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            this.pageSwitch = new PageSwitch($(this.domNode).find('.steps')[0], {
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
            
            this.commonDetail = new CommonDetail();
            $(this.domNode).find('.commonDetail').append($(this.commonDetail.domNode));
            this.commonDetail.startup();
            this.own(this.commonDetail);
        },
        
        _getImgUrl: function(uIcon){
            return base.isNull(uIcon)? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + uIcon);
        },
        
        _getLimitedStr: function(statusVal){
            var str = parseInt(statusVal.total) < 0? '--' : statusVal.total;
            
            return statusVal.current + '/' + str;
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/mobile/userOpenInfo',
                data: {
                    uid: base.getQueryString('uid')
                }
            }).success(lang.hitch(this, function(ret){
                this.currentObj = ret.data;
                
                $(this.domNode).find('.unm').text(this.currentObj.u_NM);
                $(this.domNode).find('.uid').text(this.currentObj.u_ID);
                
                var imgUrl = this._getImgUrl(this.currentObj.u_ICON);
                $(this.domNode).find('.icon img').attr('src', imgUrl);
                
                $(this.domNode).find('.openCount').text(Object.keys(this.currentObj.publicClients).length + ' 公开设备');
                $(this.domNode).find('.crtTs').text((new Date(this.currentObj.crt_TS)).format('yyyy-MM-dd') + ' 加入');
                
                this._createOpenItems(this.currentObj.publicClients, this.currentObj.latestTs, this.currentObj.stars);
                
            }));
        },
        
        _createOpenItems: function(publicClients, latestTs, stars){
            for(var i=0; i<stars.length; i++){
                this.starMap[stars[i]] = stars[i];
            }
            
            var parent = $(this.domNode).find('table');
            
            var list = [], keys = Object.keys(publicClients);
            for(var i=0; i< keys.length; i++){
                list.push(this._createItem(keys[i], publicClients[keys[i]], latestTs[keys[i]]));
            }
            
            parent.append(list);
        },
        
        _createItem: function(cid, cnm, latestTs){
            var tmStr = latestTs? (new Date(latestTs)).format('MM/dd HH:mm') : '';
            
            var item = $('<tr data="'+ cid +'"><td>'+ cnm +'</td><td><small>'+ tmStr +'</small></td></tr>');
            
            item.click(lang.hitch(this, function(e){
                var self = $(e.currentTarget);
                if(!self.hasClass('active')){
                    $(this.domNode).find('table tr.active').removeClass('active');
                    self.addClass('active');
                    
                    topic.publish('main/mobile/dataMonitor/commonDetail/select', {c_ID: cid, c_NM: cnm, star: (this.starMap[cid]? true : false)});
                    
                    this.pageSwitch.next();
                }
            }));
            
            return item;
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('main/mobile/dataMonitor/commonDetail/clearOuterSelect', lang.hitch(this, function () {
                $(this.domNode).find('table tr.active').removeClass('active');
            }));
            var sub2 = topic.subscribe('main/mobile/dataMonitor/commonDetail/toggleStar', lang.hitch(this, function (data) {
                if(data.star){
                    this.starMap[data.c_ID] = data.c_ID;
                }else{
                    delete this.starMap[data.c_ID];
                }
            }));
            var sub3 = topic.subscribe('main/mobile/dataMonitor/prePage', lang.hitch(this, function () {
                this.pageSwitch.prev();
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});