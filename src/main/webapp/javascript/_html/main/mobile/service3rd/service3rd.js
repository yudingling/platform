
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/jquery-nav/jqueryNav",
    './widget/my3rd/my3rd',
    './widget/store/store',
    "dojo/text!./template/service3rd.html",
    "tool/css!./css/service3rd.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        JqueryNav,
        My3rd,
        Store,
        template){
    
    return declare("main.mobile.service3rd", [_Widget], {
        baseClass: "main_mobile_service3rd",
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
            
            this.defer(lang.hitch(this, function(){
                this._createStore();
                
            }), 500);
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            this._createMy3rd();
            
            var nav = new JqueryNav($(this.domNode).find('.jqNav'), {
                onChange: lang.hitch(this, function (index) {
                    if (index == 1) {
                        if (!this.my3rd) {
                            this._createMy3rd();
                        }

                    } else if (index == 2) {
                        if (!this.store) {
                            this._createStore();
                        }
                    }
                })
            });

            this.own(nav);
        },
        
        _createMy3rd: function(){
            this.my3rd = new My3rd();
            $(this.domNode).find('.my3rd').append($(this.my3rd.domNode));
            this.my3rd.startup();
            this.own(this.my3rd);
        },
        
        _createStore: function(){
            this.store = new Store();
            $(this.domNode).find('.store').append($(this.store.domNode));
            this.store.startup();
            this.own(this.store);
        },
        
        _initEvents: function () {
        }
    });
});