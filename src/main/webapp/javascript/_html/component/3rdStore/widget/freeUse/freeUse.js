
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/pageSwitch/pageSwitch",
    "root/breadcrumb/BreadCrumb",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/freeUse.html",
    "tool/css!./css/freeUse.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        PageSwitch,
        BreadCrumb,
        CustomScrollBar,
        template){
    
    return declare("component.3rdStore.widget.freeUse", [_Widget], {
        baseClass: "component_3rdStore_widget_freeUse",
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
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            this.ps = new PageSwitch($(this.domNode).find('.steps')[0],{
        	    duration:600,
        	    direction:0,
        	    start:0,
        	    loop:false,
        	    ease:'ease',
        	    transition:'scrollX',
        	    freeze:false,
        	    mouse:false,
        	    mousewheel:false,
        	    arrowkey:false,
        	    autoplay:false,
        	    interval:0
        	});
        	
        	BreadCrumb.init($(this.domNode).find('.navSteps'), "cd-multi-steps text-top");
            
            $(this.domNode).find('.steps .svNm').text(this.tps_NM);
            
            this._initDomStep1();
            this._initDomStep2();
        },
        
        _initDomStep1: function(){
            var chk = $(this.domNode).find('.steps .step1 input[type="checkbox"]');
            var btnNext = $(this.domNode).find('.steps .step1 .next');
            
            chk.change(lang.hitch(this, function(){
                if(chk.is(':checked')){
                    btnNext.removeAttr('disabled');
                }else{
                    btnNext.attr('disabled', 'disabled');
                }
        	}));
            
        	btnNext.click(lang.hitch(this, function(){
                if(!chk.is(':checked')){
                    base.error('错误', '请确认授权');
        			return;
                }
                
                this._addService();
            }));
            
            var authList = $(this.domNode).find('.steps .step1 .authList');
            authList.children().remove();
            
            var lilist = [];
            for(var i=0; i<this.auth_API.length; i++){
                lilist.push($('<li>' + this.auth_API[i].api_NM + '</li>'));
            }
            authList.append(lilist);
        },
        
        _initDomStep2: function(){
            $(this.domNode).find('.steps .step2 .btn').click(lang.hitch(this, function(){
                topic.publish('component/3rdStore/closeModal');
            }));
        },
        
        _addService: function(){
            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/freeUse',
                data: {
                    tpsId: this.tps_ID
                }
            }).success(lang.hitch(this, function(ret){
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');
                
                topic.publish('component/3rdStore/purchased', {tps_ID: this.tps_ID});
                
                this.ps.next();
            }));
        },
        
        _initEvents: function () {
        }
    });
});
