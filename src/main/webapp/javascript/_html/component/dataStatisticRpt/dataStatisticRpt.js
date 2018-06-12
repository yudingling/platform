define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/dataStatisticRpt.html",
    "tool/css!./css/dataStatisticRpt.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             Spin,
             CustomScrollBar,
             template) {

    return declare("component.dataStatisticRpt", [_Widget], {
        baseClass: "component_dataStatisticRpt",
        templateString: template,
        
        selfAuth: true,
        
        constructor: function(args){
            declare.safeMixin(this, args);
            
            this.childMap = {};
            
            this._initEvents();
        },
        
        postCreate: function(){
            this.inherited(arguments);

            this._initDom();
        },
        
        startup: function(){
            this.inherited(arguments);
            
            $(this.domNode).find('.navbar ul.nav>li[data="userRpt"]').click();
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            var navs = $(this.domNode).find('.navbar ul.nav>li[data]');
        	navs.click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(!cur.hasClass('active')){
                    navs.not(cur).removeClass('active');
                    cur.addClass('active');
                    
                    this._showItem(cur.attr('data'));
                }
            }));
        },
        
        _showItem: function(name){
            var curPage = $(this.domNode).find('div.content>.' + name);
            $(this.domNode).find('div.content>div').not(curPage).hide();
            curPage.css('display', 'block');
            
            var curChild = this.childMap[name];
            if(!curChild){
                base.newDojo('component/dataStatisticRpt/widget/' + name + '/' + name, 'component.dataStatisticRpt.' + name, null).success(lang.hitch(this, function(obj){
                    this.childMap[name] = obj;
                    
                    curPage.append($(obj.domNode));
                    obj.startup();
                    this.own(obj);
                }));
            }
        },
        
        _initEvents: function(){
        }
    });
});
