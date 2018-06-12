define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/searchBox.html",
    "tool/css!./css/searchBox.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.dataMonitor.widget.searchBox", [_Widget], {
        baseClass: "component_dataMonitor_widget_searchBox",
        templateString: template,
        
        /*
         * consideration of the using scenarios (multi instance exist in one parent component/widget), we use callback rather than topic
         * args: {
               showMenu: true,
               emptySearch: true,
               placeholder: '搜索',
               search: function(txt){},
               remove: function(){},
               menuClick: function(){},
               txtChanged: function(txt){}
           }
        */
        constructor: function (args) {
            declare.safeMixin(this, $.extend({showMenu: true, placeholder: '搜索', emptySearch: true}, args));
            
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
            
            this._clearChangeTO();
            
            $(document).unbind('click', this.clickForBlur);
        },
        
        reset: function(){
            $(this.domNode).addClass('init');
        },
        
        finish: function(){
            $(this.domNode).find('.remove>div').removeClass("wait");
            $(this.domNode).find('.remove').click(lang.hitch(this, function(){
                $(this.domNode).addClass('init');
                
                $(this.domNode).find('input').val(null);
                
                if(this.remove){
                    this.remove();
                }
            }));
        },
        
        /* 
         * promptAsciiLen  //max name length of prompt string in ascii
         * promptSize      //max size of prompt item
        */
        prompt: function(data, promptAsciiLen, promptSize){
            var items = [];
            
            if(base.isNull(promptAsciiLen)){
                promptAsciiLen = 36;
            }
            if(base.isNull(promptSize)){
                promptSize = 5;
            }
            
            if(data && data.length > 0){
                $(this.domNode).addClass('showPrompt');
                
                for(var i=0; i<data.length && i<promptSize; i++){
                    var icon = "";
                    if(data[i].hasVideo){
                        icon = '<i class="fa fa-video-camera fa-image"></i>';
                    }else if(data[i].hasImage){
                        icon = '<i class="fa fa-image"></i>';
                    }else if(data[i].hasTsData){
                        icon = '<i class="fa fa-line-chart"></i>';
                    }else{
                        icon = '<i class="fa fa-map-marker" style="font-size: 19px; padding-left: 1px"></i>';
                    }
                    
                    var li = $('<li>'+ icon + '<div>' + base.subDescription(data[i].cnm, promptAsciiLen) +'</div></li>').click(lang.hitch(this, function(e){
                        $(this.domNode).find('input').val($(e.currentTarget).data('cnm'));
                        
                        $(this.domNode).find('.search').click();
                        
                    })).data('cnm', data[i].cnm);
                    
                    items.push(li);
                }
                $(this.domNode).find('ul').html(items);
                
            }else{
                this._clearPrompt();
            }
        },
        
        _clearPrompt: function(){
            this._clearChangeTO();
            
            if($(this.domNode).hasClass('showPrompt')){
                $(this.domNode).removeClass('showPrompt');
                $(this.domNode).find('ul').html(null);
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('.search').click(lang.hitch(this, function(){
                this._clearPrompt();
                
                var txt = $(this.domNode).find('input').val();
                if(txt.length == 0 && !this.emptySearch){
                    return;
                }
                
                $(this.domNode).find('.remove').unbind();
                $(this.domNode).find('.remove>div').addClass("wait");
                
                $(this.domNode).removeClass('init');
                
                if(this.search){
                    this.search(txt);
                }
            }));
            
            if(this.showMenu){
                $(this.domNode).find('.menu').click(lang.hitch(this, function(){
                    if(this.menuClick){
                        this.menuClick();
                    }
                }));
                
            }else{
                $(this.domNode).addClass('hideMenu');
            }
            
            var input = $(this.domNode).find('input');
            if(this.placeholder){
                input.attr('placeholder', this.placeholder);
            }
            
            input.keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	$(this.domNode).find('.search').click();
                }
            })).keyup(lang.hitch(this, function(event){
                if(event.which != 13){
                    if(this.txtChanged){
                        this._clearChangeTO();
                        
                        this.changeTO = setTimeout(lang.hitch(this, function(){
                            this.txtChanged(input.val());
                            this.changeTO = null;
                        }), 300);
                    }
                    
                    if(input.val().length == 0){
                        this._clearPrompt();
                    }
                }
            }));
            
            //you can not use input.blur to hide prompt, cause input.blur will stop the event of li.click
            this.clickForBlur = lang.hitch(this, function(e){
                if(!$(e.target.parentElement).hasClass('component_dataMonitor_widget_searchBox')){
                    this._clearPrompt();
                }
            });
            $(document).bind('click', this.clickForBlur);
        },
        
        _clearChangeTO: function(){
            if(this.changeTO){
                clearTimeout(this.changeTO);
                this.changeTO = null;
            }
        },
        
        _initEvents: function(){
        }
    });
});
