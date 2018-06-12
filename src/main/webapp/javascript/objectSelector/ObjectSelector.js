/**
 * common object selector
 * 
 */

define(['tool/base',
        "dojo/_base/declare", 
        'dojo/_base/lang',
        'root/panel/Panel',
        'root/customScrollbar/CustomScrollBar',
        'tool/css!./ObjectSelector.css'], 
        function(base, declare, lang, Panel, CustomScrollBar){
	
	return declare('ObjectSelector', null, {
		constructor: function(containerIdOrObj, title, onShow, okTitle, noScrollBar){
            
			var obj = $('<div class="objectSelector">'
                       + '<div class="objectContainer"><div class="cti"></div></div>'
                       + '<div><a class="btn btn-success btn-sm objOk" href="javascript:void(0);">'+ (okTitle? okTitle : '确 定') +'</a></div></div>');
            
            this.panel = new Panel(containerIdOrObj, obj, title);
            this.panelDom = obj;
            
            this.onShow = onShow;
            
            if(noScrollBar){
                this.panelDom.find('.objectContainer div.cti').css('height', '100%');
            }else{
                CustomScrollBar.init(obj.find('.objectContainer'));
            }
		},
        
        destroy: function(){
            this.inherited(arguments);
            
            this.panel.destroy();
        },
		
		toggle: function(){
			this.panel.toggle();
            
            if(this.panel.visible() && this.onShow){
                this.onShow(this.panelDom.find('.objectContainer div.cti'));
            }
		},
		
		hide: function(){
			this.panel.hide();
		},
		
        /**
         * okEvent can return false to stop hiding when the okbtn is clicked
         */
		show: function(okEvent, pos){
            var cti = this.panelDom.find('.objectContainer div.cti');
            
            this.panelDom.find('a.btn.objOk').unbind().click(lang.hitch(this, function(){
                var ret = true;
                
                if(okEvent){
                    ret = okEvent(cti);
                }
                
                if(ret || base.isNull(ret)){
                    this.hide();
                }
            }));
            
			this.panel.show(pos);
            
            if(this.onShow){
                this.onShow(cti);
            }
		}
	});
});