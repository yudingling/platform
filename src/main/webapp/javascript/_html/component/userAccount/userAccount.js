
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    './widget/accountInfo/accountInfo',
    "dojo/text!./template/userAccount.html",
    "tool/css!./css/userAccount.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        AccountInfo,
        template){
    
    return declare("component.userAccount", [_Widget], {
        baseClass: "component_userAccount",
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
            
            this._setData();
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.infoRight>.content'));
                
                this._newContent($(this.domNode).find('.infoRight>nav .nav>li:first-child').attr('data'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._destroyContent();
        },
        
        _initDom: function(){
            var navs = $(this.domNode).find('.infoRight>nav .nav>li');
            navs.click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                
                if(!cur.hasClass('active')){
                    navs.not(cur).removeClass('active');
                    cur.addClass('active');
                    
                    this._newContent(cur.attr('data'));
                }
            }));
            
            var acInfo = new AccountInfo();
            $(this.domNode).find('.infoLeft').append($(acInfo.domNode));
            acInfo.startup();
            this.own(acInfo);
        },
        
        _newContent: function(objnm){
            this._destroyContent();
            
            var path = 'component/userAccount/widget/' + objnm + '/' + objnm;
            var cls = 'component.userAccount.widget.' + objnm;

            base.newDojo(path, cls, null).success(lang.hitch(this, function(retObj){
                this.preObject = retObj;

                $(this.domNode).find('.infoRight>.content div.contentInner').append($(this.preObject.domNode));
                this.preObject.startup();
            }));
        },
        
        _destroyContent: function(){
            if(this.preObject){
                this.preObject.destroyRecursive();
                this.preObject = null;
            }
        },
        
        _setData: function(){
            this._getResource();
            this.ts = setTimeout(lang.hitch(this, function(){
                this._getResource();
            }), 60000);
        },
        
        _getResource: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/resourceStatus',
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
                var parent = $(this.domNode).find('.infoRight>.resourceInfo');
                parent.find('h3.sms').text(this._getLimitedStr(data.sms));
                parent.find('h3.img').text(this._getLimitedStr(data.image));
                parent.find('h3.video').text(this._getLimitedStr(data.video));
            }));
        },
        
        _getLimitedStr: function(statusVal){
            var str = parseInt(statusVal.total) < 0? '--' : statusVal.total;
            
            return statusVal.current + '/' + str;
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/resource/changed', lang.hitch(this, function(data){
                this._getResource();
            }));
            
            this.own(sub1);
        }
    });
});
