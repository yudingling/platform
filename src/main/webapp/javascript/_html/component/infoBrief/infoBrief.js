
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    './widget/warnAndNote/warnAndNote',
    "dojo/text!./template/infoBrief.html",
    "tool/css!./css/infoBrief.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        WarnAndNote,
        template){
    
    return declare("component.infoBrief", [_Widget], {
        baseClass: "component_infoBrief",
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
        
        refresh: function(){
            this.warnAndNote.refresh();
        },
        
        _initDom: function(){
            this.warnAndNote = new WarnAndNote();
            $(this.domNode).find('.wnCC').append($(this.warnAndNote.domNode));
            this.warnAndNote.startup();
            this.own(this.warnAndNote);
            
        	$(this.domNode).find('ul>li[data]').click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(!cur.hasClass('active')){
                    $(this.domNode).find('ul>li').not(cur).removeClass('active');
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
            $(this.domNode).find('ul>li[data="notes"]').html(liTitle);
        },
        
        _updateWarnsTitle: function(total){
            var liTitle = '设备告警';
            if(total > 0){
                liTitle += '(<span>'+ total +'</span>)';
            }
            $(this.domNode).find('ul>li[data="warns"]').html(liTitle);
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
                $(this.domNode).find('ul>li[data="'+ data.selType +'"]').click();
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
