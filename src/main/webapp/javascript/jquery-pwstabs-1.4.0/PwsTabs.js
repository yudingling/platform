define(['./jquery.pwstabs',
        'tool/css!./jquery.pwstabs.css'], function(){
	
    return {
        init: function(domIdOrObj, options){
        	if(Object.prototype.toString.call(domIdOrObj) == "[object String]")
                domIdOrObj = $('#'+domIdOrObj);
        	
            return domIdOrObj.pwstabs(options);
        }
    };
    
});