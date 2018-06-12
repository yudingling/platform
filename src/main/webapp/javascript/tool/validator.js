
define(['./base'], function(base){
	
	return {
		
		isEmail: function (value){
            if(Object.prototype.toString.call(value) === "[object String]"){
                var reg = /^([a-z0-9A-Z_\.\-])+\@([a-z0-9A-Z]+(-[a-z0-9A-Z]+)?\.)+[a-zA-Z]{2,}$/;
                return reg.test(value);
            }else{
                return false;
            }
		},
        
        isMobile: function (value){
            if(Object.prototype.toString.call(value) === "[object String]"){
                var reg = /^((13[0-9])|(15[0-9])|(17[0-9])|(18[0-9]))\d{8}$/;
                return reg.test(value);
            }else{
                return false;
            }
		},
		
		isCardNo: function(value){  
		   var reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;  
		   if(reg.test(value)){		    
		       return  true;  
		   }else{
			   return false;
		   }  
		}, 
        
        isDouble:function (value) {
            var typeStr = Object.prototype.toString.call(value);
            
            if(typeStr === "[object String]"){
                var regex = /^-?(([1-9]+\d*)|0)(\.\d+)?$/
                if(value.length == 0){
                    return false;
                }
                if(base.isNull(value.match(regex))){
                    return false;
                }

                return true;
            }else if(typeStr === "[object Number]"){
                return true;
            }else{
                return false;
            }
        },
        
        isInt:function (value) {
            var typeStr = Object.prototype.toString.call(value);
            
            if(typeStr === "[object String]" || typeStr === "[object Number]"){
                value = value + '';
                
                var regex = /^(([1-9]+\d*)|0)$/
                if(value.length == 0){
                    return false;
                }
                if(base.isNull(value.match(regex))){
                    return false;
                }
                return true;
                
            }else{
                return false;
            }
        },
        
        /* simple check, need improve */
        isUrl: function(value){
            if(Object.prototype.toString.call(value) === "[object String]"){
                var reg = /^((http|https):\/\/)(([a-zA-Z0-9\._-]+\.[a-zA-Z]{2,6})|([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}))(:[0-9]{1,4})*(\/[a-zA-Z0-9\&%_\.\/-~-]*)?$/;
                return reg.test(value);
            }else{
                return false;
            }
        },
        
        /* yyyy-MM-dd HH:mm:ss yyyy-MM-dd HH:mm:ss.fff yyyy/MM/dd HH:mm:ss  yyyy/MM/dd HH:mm:ss.fff */
        isDateTime: function(value){
            var typeStr = Object.prototype.toString.call(value);
            
            if(typeStr === "[object String]"){
                var reDateTime = /^(?:19|20)[0-9][0-9](-|\/)(?:(?:0[1-9])|(?:1[0-2]))(-|\/)(?:(?:[0-2][1-9])|(?:[1-3][0-1])) (?:(?:[0-2][0-3])|(?:[0-1][0-9])):[0-5][0-9]:[0-5][0-9](.[0-9][0-9][0-9])?$/;
                return reDateTime.test(value);
                
            }else if(typeStr === "[object Date]"){
                return true;
            }else{
                return false;
            }
        }
	};
});
