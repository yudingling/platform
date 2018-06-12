//面包屑导航

define(['tool/css!./css/style.css'], 
       function(){

    return {
    	/**
    	 * styleClass 的用法可见demo ：http://www.htmleaf.com/Demo/201507242288.html
    	 */
        init: function(domObjOrId, styleClass){
            if(Object.prototype.toString.call(domObjOrId) == "[object String]"){
                domObjOrId = $('#' + domObjOrId);
            }
            
            var olObj = domObjOrId.children("ol");
            
            olObj.addClass('cd-breadcrumb');
            
            if(styleClass){
            	olObj.addClass(styleClass);
            }
        }
    };
});