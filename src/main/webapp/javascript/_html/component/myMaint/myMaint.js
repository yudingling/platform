
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    './widget/broadcastList/broadcastList',
    './widget/broadcastDetail/broadcastDetail',
    './widget/actedList/actedList',
    "dojo/text!./template/myMaint.html",
    "tool/css!./css/myMaint.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        BroadcastList,
        BroadcastDetail,
        ActedList,
        template){
    
    return declare("component.myMaint", [_Widget], {
        baseClass: "component_myMaint",
        templateString: template,
        
        selfAuth: true,
        
        constructor: function(args){
            declare.safeMixin(this, args);
            
            this._initEvents();
        },

        postCreate: function(){
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function(){
            this.inherited(arguments);
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            var obj = new BroadcastList();
            $(this.domNode).children('.left').append($(obj.domNode));
            obj.startup();
            this.own(obj);
            
            obj = new BroadcastDetail();
            $(this.domNode).find('.right>.desc').append($(obj.domNode));
            obj.startup();
            this.own(obj);
            
            obj = new ActedList();
            $(this.domNode).find('.right>.exec').append($(obj.domNode));
            obj.startup();
            this.own(obj);
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/myMaint/clearSelect', lang.hitch(this, function(data){
                $(this.domNode).children('.right').removeClass('down');
            }));
            var sub2 = topic.subscribe('component/myMaint/selected', lang.hitch(this, function(data){
                $(this.domNode).children('.right').addClass('down');
            }));
            var sub3 = topic.subscribe('component/myMaint/padLeft', lang.hitch(this, function(data){
                if(data){
                    $(this.domNode).addClass('padLeft');
                }else{
                    $(this.domNode).removeClass('padLeft');
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});
