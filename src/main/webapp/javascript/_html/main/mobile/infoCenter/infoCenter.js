
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    'component/infoBrief/widget/warnAndNote/warnAndNote',
    "dojo/text!./template/infoCenter.html",
    "tool/css!./css/infoCenter.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        WarnAndNote,
        template){
    
    return declare("main.mobile.infoCenter", [_Widget], {
        baseClass: "main_mobile_infoCenter",
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
                CustomScrollBar.init($(this.domNode).find('.infocc.customScrollBar'));
            }), 500);
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            this.warnAndNote = new WarnAndNote();
            $(this.domNode).find('.infocc').append($(this.warnAndNote.domNode));
            this.warnAndNote.startup();
            this.own(this.warnAndNote);
            
            var navs = $(this.domNode).find('nav .nav>li');
            navs.click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                
                if(!cur.hasClass('active')){
                    navs.not(cur).removeClass('active');
                    cur.addClass('active');
                    
                    this.warnAndNote.changeSelect(cur.attr('data'));
                }
            }));
        },
        
        _updateNotesTitle: function(total, current){
            var liTitle = '通知消息';
            if(total > 0){
                liTitle += '(<span>'+ total +'</span>)';
            }
            $(this.domNode).find('nav .nav>li[data="notes"]>a').html(liTitle);
        },
        
        _updateWarnsTitle: function(total){
            var liTitle = '设备告警';
            if(total > 0){
                liTitle += '(<span>'+ total +'</span>)';
            }
            $(this.domNode).find('nav .nav>li[data="warns"]>a').html(liTitle);
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/infoBrief/warnAndNote/refreshTotalSize', lang.hitch(this, function(data){
                if(data.selType == 'warns'){
                    this._updateWarnsTitle(data.total);
                    
                }else if(data.selType == 'notes'){
                    this._updateNotesTitle(data.total);
                }
            }));
            var sub2 = topic.subscribe('component/infoBrief/warnAndNote/selTypeChange', lang.hitch(this, function(data){
                $(this.domNode).find('nav .nav>li[data="'+ data.selType +'"]').click();
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});