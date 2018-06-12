/**
 * 通用的弹框文本选择组件
 * 
 */

define(["dojo/_base/declare", 
        'dojo/_base/lang',
        'panel/Panel',
        'tool/css!./TextSelector.css'], 
        function(declare, lang, Panel){
	
	return declare('TextSelector', null, {
		constructor: function(containerIdOrObj, title){
            
			var obj = $('<div class="textSelector">'
                       + '<div class="textContainer"><textarea class="txt"></textarea></div>'
                       + '<div><a class="btn btn-success btn-sm okTxt" href="javascript:void(0);">确 定</a></div></div>');
            
            this.panel = new Panel(containerIdOrObj, obj, title);
            this.panelDom = obj;
		},
        
        destroy: function(){
            this.inherited(arguments);
            
            this.panel.destroy();
        },
		
		toggle: function(){
			this.panel.toggle();
		},
		
		hide: function(){
			this.panel.hide();
		},
		
        /**
         * okEvent can return false to stop hiding when the okbtn is clicked
         */
		show: function(okEvent, pos){
            this.panelDom.find('.textContainer .txt').val('');
            
            this.panelDom.find('a.btn.okTxt').unbind().click(lang.hitch(this, function(){
                var txt = this.panelDom.find('.textContainer .txt');
                var ret = true;
                
                if(okEvent){
                    ret = okEvent(cti);
                }
                
                if(ret || base.isNull(ret)){
                    this.hide();
                }
            }));
            
			this.panel.show(pos);
		}
	});
});