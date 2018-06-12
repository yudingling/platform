
define(["tool/base",
        'dojo/_base/declare',
        'dojo/_base/lang',
        'tool/css!./FileSelector.css'
        ], function(base, declare, lang){
    
	return declare('FileSelector', null, {
		constructor: function(domIdOrObj, accept, onchange){
			
			if(Object.prototype.toString.call(domIdOrObj) == "[object String]"){
                this.domIdOrObj = $('#'+domIdOrObj);
            }else{
                this.domIdOrObj = domIdOrObj;
            }
			
			this.input = $('<input type="file" accept="'+ accept +'" />').change(function(e){
				if(onchange && e.currentTarget.files.length > 0){
					onchange(e);
				}
				
                //show file name
                /*var fileName = $(this).val();
                fileName = fileName.length>0? fileName.substring(fileName.lastIndexOf('\\')+1) : title;
                if(fileName.length>title.length){
                    var subLen = fileName.length - title.length;
                    fileName = fileName.substring(0, title.length / 2) + '...' + fileName.substring(title.length / 2 + subLen + 1);
                }
                
                $(this).parent().find('span').html(fileName);*/
            });
			
			this.domIdOrObj.addClass('fileSelector').append(this.input);
		},
        
        multiSelect: function(){
            this.input.attr('multiple', 'multiple');
        },
        
        getSelector: function(){
            return this.input;
        },
        
        destroy: function(){
            this.inherited(arguments);
            
            this.domIdOrObj.removeClass('fileSelector');
            this.input.remove();
        }
	});
});
