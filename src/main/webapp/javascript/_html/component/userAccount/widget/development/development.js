
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/jquery-pwstabs-1.4.0/PwsTabs",
    "dojo/text!./template/development.html",
    "tool/css!./css/development.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        PwsTabs,
        template){
    
    return declare("component.userAccount.widget.development", [_Widget], {
        baseClass: "component_userAccount_widget_development",
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
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.sslDiv .wait').tooltip('destroy');
        },
        
        _initDom: function(){
            this.tabs = PwsTabs.init($(this.domNode).find('.tabs'), {
                effect: 'none'
            });
            
            $(this.domNode).find('.sslDiv .ca').click(lang.hitch(this, function(){
                window.location = base.getServerNM() + 'ca.crt';
            }));
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/self'
            }).success(lang.hitch(this, function(ret){
                var key = ret.data.self.u_SSL_KEY;
                var crt = ret.data.self.u_SSL_CRT;
                
                var keyDiv = $(this.domNode).find('.sslDiv .key');
                var crtDiv = $(this.domNode).find('.sslDiv .crt');
                
                if(!base.isNull(key)){
                    keyDiv.click(lang.hitch(this, function(){
                        window.location = base.getServerNM('file') + 'fileApi/own/ssl?fileId=' + key;
                    }));
                }else{
                    keyDiv.addClass('wait').tooltip({
                        container: 'body',
                        placement: 'auto bottom',
                        trigger: 'hover',
                        title: '审核中..'
                    });
                }
                
                if(!base.isNull(crt)){
                    crtDiv.click(lang.hitch(this, function(){
                        window.location = base.getServerNM('file') + 'fileApi/own/ssl?fileId=' + crt;
                    }));
                }else{
                    crtDiv.addClass('wait').tooltip({
                        container: 'body',
                        placement: 'auto bottom',
                        trigger: 'hover',
                        title: '审核中..'
                    });
                }
            }));
        },
        
        _initEvents: function(){
        }
    });
});
