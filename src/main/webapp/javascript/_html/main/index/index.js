
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/slider/Slider",
    "root/customScrollbar/CustomScrollBar",
    "component/topInfo/topInfo",
    "component/infoBrief/infoBrief",
    "dojo/text!./template/index.html",
    "tool/css!./css/index.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Slider,
        CustomScrollBar,
        TopInfo,
        InfoBrief,
        template){
    
    return declare("main.index", [_Widget], {
        baseClass: "main_index",
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
        	this.infoBriefSlider = new Slider($(this.domNode).find('.infoBrief'), {
                dependObj: $(this.domNode).find('.content'),
                position: {top: '50px', right: '0px', bottom: '0px'},
                direction: 'left',
                animateWhenHide: true,
                easing: 'easeOutCirc',
                opacity: 0.45,
                backgroundColor: '#306e8c',
                width: 302,
                zindex: null,
                showOnInit: false,
                retainSize: 0,
                pullBtn: false});
        	
            this.own(this.infoBriefSlider);
            
            this._appendToDiv($(this.domNode).children('.top'), new TopInfo());
        },
        
        _appendToDiv: function(selObj, obj, animateCls){
            if(obj){
                if(animateCls){
                    selObj.append($(obj.domNode).addClass(animateCls).one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                        $(this).removeClass(animateCls);
                    }));
                }else{
                    selObj.append($(obj.domNode));
                }
                
                obj.startup();
                this.own(obj);
            }
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('index/create', lang.hitch(this, function(data){
            	base.newDojo(data.path, data.cls, base.evalJson(data.args)).success(lang.hitch(this, function(contentObj){
            		this.infoBriefSlider.hide(true, false);
                    
            		if(this.preActionObj){
                        this.preActionObj.destroyRecursive();
                        this.preActionObj = null;
                    }
            		
            		this._appendToDiv($(this.domNode).children('.content').children('.contentInner'), contentObj, 'animated fadeInLeft');
                    
                    this.preActionObj = contentObj;
            		
            	}));
            }));
            
            var sub2 = topic.subscribe('index/infoBrief', lang.hitch(this, function(data){
            	if(data.kind == 'show'){
            		this.infoBriefSlider.show();
            		
            		if(this.infoBrief){
            			this.infoBrief.refresh();
            			
            		}else{
            			this.infoBrief = new InfoBrief();
                        //the slider will be shown in 500 miliseconds, and we defer this action to ensure the animation fires once.
                        //  400ms works fine.. the less the better
                        this.defer(lang.hitch(this, function(){
                            this._appendToDiv($(this.domNode).find('.infoBriefInner'), this.infoBrief, 'animated flipInY'); //bounceInDown  
                        }), 400);
            		}
            		
            	}else{
            		this.infoBriefSlider.hide();
            	}
            }));
            
            var sub3 = topic.subscribe('index/infoBrief/disableScroll', lang.hitch(this, function(data){
                var scrollObj = this.infoBriefSlider.getScroll();
                if(scrollObj){
                    if(data.disabled){
                        CustomScrollBar.disable(scrollObj);
                    }else{
                        CustomScrollBar.update(scrollObj);
                    }
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});