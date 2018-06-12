/**
 * popovermenu
 * 
 */
define(["tool/base",
        "dojo/_base/declare", 
        "dojo/_base/lang",
        'tool/css!./PopoverMenu.css'], 
        function(base, declare, lang){
    
	return declare('PopoverMenu', null, {
		
		/**
		 *  aObj must be a 'a' tag, that is mandatory,  popoverObj can be some other dom type. like: "<a><i></i></a>"
		 *  menus: [{name: 'xxx', value='xxx'}, {...}]
		 */
		constructor: function(aObj, popoverObj, menus, callback){
			this.popoverObj = popoverObj;
			this.cls = 'cls_' + base.uuid();
			
			this.popoverObj.popover({
            	container: 'body', 
            	content: this._createMenu(menus, callback),
            	html: true,
            	placement: 'bottom',
            	trigger: 'manual',
            	template: '<div class="popover popovermenu '+ this.cls +'" role="tooltip"><div class="arrow"></div><div class="popover-content"></div></div>',
            	animation: false
            }).on('inserted.bs.popover', lang.hitch(this, function () {
            	  $('.' + this.cls).find('li').click(function(){
            		  popoverObj.popover('hide');
            		  if(callback){
            			  callback($(this).attr('data'));
            		  }
            	  });
            	  
            	  $('.' + this.cls).mouseenter(function(){
            		  aObj.unbind('blur');
            		  
      			  }).mouseleave(function(){
      				  aObj.unbind('blur').blur(function(){
      	            	  popoverObj.popover('hide');
      	              });
      			  });
            }));
            
			aObj.blur(function(){
            	popoverObj.popover('hide');
            }).click(function(){
            	popoverObj.popover('toggle');
            });
		},
		
        destroy: function(){
        	this.popoverObj.popover('destroy');
        },
        
        _createMenu: function(menus, callback){
        	var menuStr = "<ul class='list-unstyled'>";
        	for(var i=0; i<menus.length; i++){
        		menuStr += "<li data='"+ menus[i].value +"'>" + menus[i].name + "</li>";
        	}
        	
        	menuStr += "</ul>";
        	
        	return menuStr;
        }
	});
});