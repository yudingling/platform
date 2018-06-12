
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'component/my3rd/widget/myUsed/myUsed',
    'component/my3rd/widget/myCreated/myCreated',
    "dojo/text!./template/my3rd.html",
    "tool/css!./css/my3rd.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        MyUsed,
        MyCreated,
        template){
    
    return declare("main.mobile.service3rd.my3rd", [_Widget], {
        baseClass: "main_mobile_service3rd_my3rd",
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
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            var myUsed = new MyUsed();
            $(this.domNode).find('.infocc>.cc.used').append($(myUsed.domNode));
            myUsed.startup();
            this.own(myUsed);
            
            var myCreated = new MyCreated();
            $(this.domNode).find('.infocc>.cc.created').append($(myCreated.domNode));
            myCreated.startup();
            this.own(myCreated);
            
            var navs = $(this.domNode).find('nav .nav>li');
            navs.click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                
                if(!cur.hasClass('active')){
                    navs.not(cur).removeClass('active');
                    cur.addClass('active');
                    
                    $(this.domNode).find('.infocc>.cc').hide();
                    $(this.domNode).find('.infocc>.cc.' + cur.attr('data')).show();
                }
            }));
            
            this._initServiceLoader();
        },
        
        _initServiceLoader: function(){
            var span = $(this.domNode).find('.iframeContainer>.iframeNav>div>span');
            
            $(this.domNode).find('.iframeContainer>.iframeNav>i').click(lang.hitch(this, function(){
                if(!span.is(':visible') || parseInt(span.css('margin-left')) < 0){
                    span.show().css('margin-left', '0px');
                }else{
                    span.hide().css('margin-left', '-' + (span.outerWidth() + 20) + 'px');
                    $(this.domNode).removeClass('iframeShow');
                }
            }));
            
            span.on('webkitTransitionEnd transitionend', lang.hitch(this, function(e){
                if(parseInt(span.css('margin-left')) < 0){
                    span.hide();
                }
            }));
            
            $(this.domNode).find('.iframeContainer>.iframeNav').hover(lang.hitch(this, function(){
                //
            }),lang.hitch(this, function(){
                span.css('margin-left', '-' + (span.outerWidth() + 20) + 'px');
            }));
        },
        
        _loadService: function(data){
            base.ajax({
                url: base.getServerNM() + data.api_URL.substr(1) + '?tokenId=' + data.usp_TOKEN
            }).success(lang.hitch(this, function(ret){
                $(this.domNode).addClass('iframeShow');
                    
                $(this.domNode).find('.iframeContainer>.iframeNav .title').text(data.tps_NM);
                var iframe = $(this.domNode).find('.iframeContainer>iframe').unbind().one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                    $(this).removeClass('animated fadeInDown');
                }).addClass('animated fadeInDown').attr('src', ret.data);
                
                topic.publish('component/my3rd/loadService/success', data);
            }));
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/my3rd/loadService', lang.hitch(this, function(data){
                this._loadService(data);
            }));
            
            this.own(sub1);
        }
    });
});