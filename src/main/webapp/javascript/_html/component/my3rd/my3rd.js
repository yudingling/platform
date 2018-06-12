
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "./widget/myUsed/myUsed",
    "./widget/myCreated/myCreated",
    "./widget/createService/createService",
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
        CreateService,
        template){
    
    return declare("component.my3rd", [_Widget], {
        baseClass: "component_my3rd",
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
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.my3rdMain .created3rd>.ibox-title i').tooltip('destroy');
            
            this._destroyServiceCreator();
        },
        
        _initDom: function(){
            var create3rd = $(this.domNode).find('.my3rdMain .created3rd>.ibox-title i');
            create3rd.tooltip({
                container: 'body',
                placement: 'auto left',
                trigger: 'hover'
            });
            create3rd.click(lang.hitch(this, function(){
                this._createService();
            }));
            
            var myUsed = new MyUsed();
            $(this.domNode).find('.my3rdMain .used3rd>.ibox-content').append($(myUsed.domNode));
            myUsed.startup();
            this.own(myUsed);
            
            var myCreated = new MyCreated();
            $(this.domNode).find('.my3rdMain .created3rd>.ibox-content').append($(myCreated.domNode));
            myCreated.startup();
            this.own(myCreated);
            
            this._initServiceLoader();
        },
        
        _initServiceLoader: function(){
            var span = $(this.domNode).find('.iframeContainer>.iframeNav>div>span');
            
            $(this.domNode).find('.iframeContainer>.iframeNav>i').click(lang.hitch(this, function(){
                span.hide().css('margin-left', '-' + (span.outerWidth() + 20) + 'px');
                
                $(this.domNode).removeClass('iframeShow');
            }));
            
            span.on('webkitTransitionEnd transitionend', lang.hitch(this, function(e){
                if(parseInt(span.css('margin-left')) < 0){
                    span.hide();
                }
            }));
            
            $(this.domNode).find('.iframeContainer>.iframeNav').hover(lang.hitch(this, function(){
                span.show().css('margin-left', '0px');

            }),lang.hitch(this, function(){
                span.css('margin-left', '-' + (span.outerWidth() + 20) + 'px');
            }));
        },
        
        _createService: function(){
            this._destroyServiceCreator();
            
            var modal = $(this.domNode).children('.modal');
            
            this.serviceCreator = new CreateService();
            modal.find('.modal-body').append($(this.serviceCreator.domNode));
            this.serviceCreator.startup();
            
            modal.modal({backdrop: 'static', keyboard: false});
        },
        
        _destroyServiceCreator: function(){
            if(this.serviceCreator){
                this.serviceCreator.destroyRecursive();
                this.serviceCreator = null;
            }
        },
        
        _loadService: function(data){
            base.ajax({
                url: base.getServerNM() + data.api_URL.substr(1) + '?tokenId=' + data.usp_TOKEN
            }).success(lang.hitch(this, function(ret){
                $(this.domNode).addClass('iframeShow');
                
                var spanTitle = $(this.domNode).find('.iframeContainer>.iframeNav span.title').text(data.tps_NM);
                spanTitle.css('margin-left', '-' + (spanTitle.outerWidth() + 20) + 'px');
                
                var iframe = $(this.domNode).find('.iframeContainer>iframe').unbind().one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                    $(this).removeClass('animated fadeInRight');
                }).addClass('animated fadeInRight').attr('src', ret.data);
                
                topic.publish('component/my3rd/loadService/success', data);
            }));
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/my3rd/loadService', lang.hitch(this, function(data){
                this._loadService(data);
            }));
            var sub2 = topic.subscribe('component/my3rd/widget/createService/closeModal', lang.hitch(this, function(data){
                $(this.domNode).children('.modal').modal('hide');
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
