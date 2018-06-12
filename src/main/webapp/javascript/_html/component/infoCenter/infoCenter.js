
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    './widget/note/note',
    './widget/warn/warn',
    "dojo/text!./template/infoCenter.html",
    "tool/css!./css/infoCenter.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        Note,
        Warn,
        template){
    
    return declare("component.infoCenter", [_Widget], {
        baseClass: "component_infoCenter",
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
        },
        
        _initDom: function(){
            this.showDef1 = $.Deferred();
            this.showDef2 = $.Deferred();
            
            //wait for badge to refresh
            $.when(this.showDef1, this.showDef2).done(lang.hitch(this, function(noteCount, warnCount){
                if(noteCount > 0 || warnCount <= 0){
                    $(this.domNode).find('.navbar ul.nav>li[data="notes"]').click();
                }else{
                    $(this.domNode).find('.navbar ul.nav>li[data="warns"]').click();
                }
                
            })).fail(lang.hitch(this, function(){
                $(this.domNode).find('.navbar ul.nav>li[data="notes"]').click();
            }));
            
            var navs = $(this.domNode).find('.navbar ul.nav>li[data]');
        	navs.click(lang.hitch(this, function(e){
                var cur = $(e.currentTarget);
                if(!cur.hasClass('active')){
                    navs.not(cur).removeClass('active');
                    cur.addClass('active');

                    var curPage = $(this.domNode).find('div.content>.' + cur.attr('data'));
                    $(this.domNode).find('div.content>div').not(curPage).hide();
                    curPage.css('display', 'block');
                }
            }));
            
            var notes = new Note();
            $(this.domNode).find('.content>.notes').append($(notes.domNode));
            notes.startup();
            this.own(notes);
            
            var warns = new Warn();
            $(this.domNode).find('.content>.warns').append($(warns.domNode));
            warns.startup();
            this.own(warns);
            
            $(this.domNode).find('.navbar i.fa-refresh').click(function(){
                topic.publish('component/infoCenter/refresh');
            });
        },
        
        _updateBadge: function(parent, count){
            var badge = parent.find('span.badge');
            if(count > 0){
                if(badge.length>0){
                    badge.html(count);
                }else{
                    parent.append($('<span class="badge">'+ count +'</span>'));
                }
            }else{
                badge.remove();
            }
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('component/infoCenter/refreshInfoCount', lang.hitch(this, function(data){
                if(!base.isNull(data.noteCount)){
                    this._updateBadge($(this.domNode).find('.navbar ul.nav>li[data="notes"]>a'), data.noteCount);
                    this.showDef1.resolve(data.noteCount);
                    
                }else if(!base.isNull(data.wrnCount)){
                    this._updateBadge($(this.domNode).find('.navbar ul.nav>li[data="warns"]>a'), data.wrnCount);
                    this.showDef2.resolve(data.wrnCount);
                }
            }));
            
            this.own(sub1);
        }
    });
});
