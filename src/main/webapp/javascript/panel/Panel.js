/**
 * panel 组件
 * 
 */

define(["dojo/_base/declare", 
        "dojo/_base/lang", 
        'tool/css!./Panel.css'], 
        function(declare, lang){
    
	return declare('Panel', null, {
		constructor: function(containerIdOrObj, domObj, title){
			var obj = $('<div class="myPanel panel panel-default">'
					+ '<div class="panel-heading"><span class="title">' + title + "</span>"
					+ '<span class="close">&times;</span></div>'
				  	+ '<div class="panel-body"></div></div>');
            
            if(domObj){
                obj.find('.panel-body').append(domObj);
            }
            
            if(Object.prototype.toString.call(containerIdOrObj) == "[object String]")
                containerIdOrObj = $('#' + containerIdOrObj);
			
            containerIdOrObj.append(obj);
            
            obj.find('.panel-heading span.close').click(lang.hitch(this, function(){
				obj.hide();
                
                if(this.closeDef){
                    this.closeDef.resolve();
                    this.closeDef = null;
                }
			}));
            
			this.orgDom = obj;
		},
        
        destroy: function(){
            this.inherited(arguments);
            
            this.orgDom.remove();
        },
		
		toggle: function(pos){
            if(this.visible()){
                this.orgDom.find('.panel-heading span.close').click();
            }else{
            	this.show(pos);
            }
		},
		
		hide: function(){
            if(this.visible()){
                this.orgDom.find('.panel-heading span.close').click();
            }
		},
		
        /**
         * pos{width: '200px'(or 'auto'), height: '200px'(or 'auto'), left: '10px', top:'10px', bottom:'10px', right:'10px'}
         */
		show: function(pos){
            if(pos.width && pos.width != 'auto'){
                this.orgDom.css('width', pos.width);
                this.orgDom.find('.panel-body').removeClass('autoW');
            }else{
                this.orgDom.css('width', 'auto');
                this.orgDom.find('.panel-body').addClass('autoW');
            }
            
            if(pos.height && pos.height != 'auto'){
                this.orgDom.css('height', pos.height);
                this.orgDom.find('.panel-body').removeClass('autoH');
            }else{
                this.orgDom.css('height', 'auto');
                this.orgDom.find('.panel-body').addClass('autoH');
            }
            
            if(pos.left){
                this.orgDom.css('left', pos.left);
            }
            if(pos.top){
                this.orgDom.css('top', pos.top);
            }
            if(pos.bottom){
                this.orgDom.css('bottom', pos.bottom);
            }
            if(pos.right){
                this.orgDom.css('right', pos.right);
            }
            
			this.orgDom.show();
            
            this.closeDef = $.Deferred();
            
            return this.closeDef.promise();
		},
		
		visible: function(){
			return this.orgDom.is(':visible');
		},
		
		setTitle: function(title){
			this.orgDom.find('.panel-heading span.title').html(title);
		}
	});
});