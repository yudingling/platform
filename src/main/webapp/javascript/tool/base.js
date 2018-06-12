
define(['dojo/_base/lang',
        'root/spin/Spin',
        'root/notification/Notice',
        'root/jquery-md5/jquery.md5',
        'root/jquery-confirm/jquery-confirm',
        './css!root/jquery-confirm/jquery-confirm.min.css'], 
        function(lang, Spin, Notice){
	
	String.prototype.trim=function(){
　　 		return this.replace(/(^\s*)|(\s*$)/g, "");
　　 };
 
	String.prototype.endsWith = function(searchString, position) {
	    var subjectString = this.toString();
	    if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
	        position = subjectString.length;
	    }
	    position -= searchString.length;
	    var lastIndex = subjectString.lastIndexOf(searchString, position);
	    return lastIndex !== -1 && lastIndex === position;
	};
    
    Array.prototype.indexOf = function(val) {
        for (var i = 0; i < this.length; i++) {
            if (this[i] == val) return i;
        }
        return -1;
    };
    
    Array.prototype.remove = function(val) {
        var index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };
	
	Date.prototype.format = function(formatStr)   
	{   
	    var str = formatStr;   
	    var Week = ['日', '一', '二', '三', '四', '五', '六'];  
	  
	    str=str.replace(/yyyy|YYYY/, this.getFullYear());   
	    str=str.replace(/yy|YY/, (this.getYear() % 100)>9 ? (this.getYear() % 100).toString() : ('0' + (this.getYear() % 100)));   
	  
        var mon = this.getMonth() + 1;
	    str=str.replace(/MM/, mon>9 ? mon.toString() : ('0' + mon));   
	    str=str.replace(/M/g, mon);   
	  
	    str=str.replace(/w|W/g, Week[this.getDay()]);   
	  
	    str=str.replace(/dd|DD/, this.getDate()>9 ? this.getDate().toString() : ('0' + this.getDate()));   
	    str=str.replace(/d|D/g, this.getDate());   
	  
	    str=str.replace(/hh|HH/, this.getHours()>9 ? this.getHours().toString() : ('0' + this.getHours()));   
	    str=str.replace(/h|H/g, this.getHours());   
	    str=str.replace(/mm/, this.getMinutes()>9 ? this.getMinutes().toString() : ('0' + this.getMinutes()));   
	    str=str.replace(/m/g, this.getMinutes());   
	  
	    str=str.replace(/ss|SS/, this.getSeconds()>9 ? this.getSeconds().toString() : ('0' + this.getSeconds()));   
	    str=str.replace(/s|S/g, this.getSeconds());   
        
        var millisec = this.getMilliseconds().toString();
        if(millisec < 10){
            millisec = '00' + millisec;
        }else if(millisec < 100){
            millisec = '0' + millisec;
        }else
            millisec = millisec.toString();
        
        str=str.replace(/fff|FFF/, millisec);
        
	    return str;   
	};
	
	var browser = {
		versions:function(){
			var u = navigator.userAgent;
	        return {
	        	trident: u.indexOf('Trident') > -1, //IE内核
                presto: u.indexOf('Presto') > -1, //opera内核
                webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核
                gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核
                mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端
                ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端
                android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器
                iPhone: u.indexOf('iPhone') > -1 || u.indexOf('Mac') > -1, //是否为iPhone或者QQHD浏览器
                iPad: u.indexOf('iPad') > -1, //是否iPad
                webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部
            };
        }(),
	    language:(navigator.browserLanguage || navigator.language).toLowerCase()
	};
	
	Date.prototype.add = function(strInterval, Number) {   
	    var dtTmp = this;  
	    switch (strInterval) {
            case 'f' :return new Date(dtTmp.getTime() + Number); 
	        case 's' :return new Date(dtTmp.getTime() + (1000 * Number));  
	        case 'n' :return new Date(dtTmp.getTime() + (60000 * Number));  
	        case 'h' :return new Date(dtTmp.getTime() + (3600000 * Number));  
	        case 'd' :return new Date(dtTmp.getTime() + (86400000 * Number));  
	        case 'w' :return new Date(dtTmp.getTime() + ((86400000 * 7) * Number));  
	        case 'q' :return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + Number*3, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());  
	        case 'm' :return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + Number, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());  
	        case 'y' :return new Date((dtTmp.getFullYear() + Number), dtTmp.getMonth(), dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());  
	    }  
	};
	
	var evalJson_in = function(value) {
	    if (Object.prototype.toString.call(value) === "[object String]")
	        return eval('(' + value + ')');
	    else
	        return value;
	};
    
    //ajax return: {success:true, data:myData, message:myMessages, stackTrace:myStackTrace}
    var handleAjaxSuccess = function(that, ret, def, hintOnSuccess){
        ret = evalJson_in(ret);
        
        var msg = that.isNull(ret.message)? '' : ret.message;
        var trace = that.isNull(ret.stackTrace)? '' : ret.stackTrace;

        if(hintOnSuccess && ret.success){
            Notice.ok("请求成功", msg);
        }else if(!ret.success){
            if(ret.message == 'not logged in'){
                location.href = serverName;
                
            }else{
                Notice.error("请求错误", msg + " " + trace);
            }
        }

        if(ret.success){
            def.resolve(ret);
        }else{
            def.reject(ret.message);
        }
    };
    
    var handleAjaxFail = function(that, error, def){
        var errMsg = "Status: " + error.status + "<br/>StatusText: " + error.statusText + "<br/>ResponseText: " + error.responseText;
        Notice.error("请求错误!", errMsg);

        def.reject(error);
    };
    
    //load cfg setting
    var cfg = {};
    $(function(){
    	$.ajax({
    		type: 'GET',
    		url: serverName + "platformApi/open/cfg"
    	}).done(function(ret){
    		ret = evalJson_in(ret);
    		if(ret.success){
    			cfg = ret.data;
    		}else{
    			Notice.error("请求错误", "未获取到初始配置");
    		}
    		
		}).fail(function(error){
			Notice.error("请求错误", "未获取到初始配置");
		});
    });
	
	return {
		/**
		 * ajax request wrap   
		 */
		ajax: function (ajaxParams){
			ajaxParams = $.extend({cache: false, hintOnSuccess: false}, ajaxParams, {async: true});
			var def = $.Deferred();
			
			$.ajax(ajaxParams).done(lang.hitch(this, function(ret){
                handleAjaxSuccess(this, ret, def, ajaxParams.hintOnSuccess);
                
			})).fail(lang.hitch(this, function(error){
                handleAjaxFail(this, error, def);
			}));
			
            var defPromise = def.promise();
			return {
				success: function(callBack){
					defPromise.done(callBack);
					return this;
				},
				fail: function(callBack){
					defPromise.fail(callBack);
					return this;
				}
			};
		},
        
        /**
         * file upload.
         *   {url: '....', inputFileObj: xxxObj, data: {..}, fileParamNm: 'file', hintOnSuccess: true}
         */
        upload: function(uploadParams) {
            uploadParams = $.extend({hintOnSuccess: false, data: null, fileParamNm: 'file'}, uploadParams);
            var def = $.Deferred();
            
            var fd = new FormData();
            fd.append(uploadParams.fileParamNm, uploadParams.inputFileObj[0].files[0]);
            
            if(uploadParams.data){
                for(var key in uploadParams.data){
                    fd.append(key, uploadParams.data[key]);
                }
            }
            
            //cause the request url may cross domain, some traditional way to upload file ajax like 'post in iframe' doesn't work, even the cors is enabled. 
            $.ajax({
                url: uploadParams.url,
                type: 'POST',
                data: fd,
                processData: false,
                contentType: false,
                xhrFields:{
                    withCredentials: true  //send the cookie in cors
                },
                success: lang.hitch(this, function(ret){
                    handleAjaxSuccess(this, ret, def, uploadParams.hintOnSuccess);
				}),
                fail: lang.hitch(this, function(error){
                    handleAjaxFail(this, error, def);
				})
            });
            
            var defPromise = def.promise();
            return {
				success: function(callBack){
					defPromise.done(callBack);
					return this;
				},
				fail: function(callBack){
					defPromise.fail(callBack);
					return this;
				}
			};
        },
		
		/**
		 * get serverName.  serverTP can be as follow:
         *      file
         *      .....
		 */
		getServerNM: function(serverTp){
            switch(serverTp){
                case 'file':
                    return cfg['serverNM_file'];
                case 'platform':
                    return cfg['serverNM_platform'];
                default:
                    //serverName define in cfg.jsp
                    return serverName;
            }
		},
		
		getUid: function(){
			return cfg['uId'];
		},
        
        getQueryString: function(name){
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i"); 
            var r = window.location.search.substr(1).match(reg); 
            if (r != null) 
                return unescape(r[2]); 
            else
                return null; 
        },
		
		evalJson: function(value) {
			return evalJson_in(value);
		},
        
        ok: function(title, msg){
            Notice.ok(title, msg);
        },
        
        error: function(title, msg){
            Notice.error(title, msg);
        },
        
        info: function(title, msg){
            Notice.info(title, msg);
        },
        
        uuid: function(){
            var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
            var uuid = [];
            var radix = 12 || chars.length;
            
            for (var i = 0; i < 32; i++) 
                uuid[i] = chars[0 | Math.random()*radix];

            return uuid.join('');
        },
        
        isNull: function(obj){
            return (!obj && typeof(obj)!="undefined" && obj!=0 && obj != false) || typeof(obj)=="undefined";
        },
        
        md5: function(val){
        	return $.md5(val);
        },
        
        confirm: function(title, content, confirmed, canceled){
            $.confirm({
                title: title,
                content: content,
                backgroundDismiss: false,
                confirmButton: '确定',
                cancelButton: '取消',
                confirmButtonClass: 'btn-danger',
                columnClass: 'col-md-4 col-md-offset-4',
                confirm: confirmed,
                cancel: canceled
            });
        },
        
        confirmSave: function(title, content, confirmed, canceled){
            $.confirm({
                title: title,
                content: content,
                backgroundDismiss: false,
                confirmButton: '确定',
                cancelButton: '取消',
                confirmButtonClass: 'btn-primary',
                columnClass: 'col-md-4 col-md-offset-4',
                confirm: confirmed,
                cancel: canceled
            });
        },
        
        /**
         * instantiate dojo object dynamic
         */
        newDojo: function(path, className, args){
            var spin = new Spin($('body'));
            
        	var def = $.Deferred();
            
            try {
                require([path], function(ObjClass){
                	try{
                		var obj = new ObjClass(args);
                		
                		def.resolve(obj);
                        
                        spin.destroy();
                        
                	}catch (e){
                        spin.destroy();
                        
                        var msg = "Could not instantiate "+ path + " " + className + ": " + e.message;
                        Notice.error('错误', msg);
                		def.reject(msg);
                	}
                });
                
            } catch (e){
                spin.destroy();
                
                var msg = "Could not instantiate "+ path + " " + className + ": " + e.message;
                Notice.error('错误', msg);
            	def.reject(msg);
            }
            
            var defPromise = def.promise();
            return {
				success: function(callBack){
					defPromise.done(callBack);
					return this;
				},
				fail: function(callBack){
					defPromise.fail(callBack);
					return this;
				}
			};
        },
        
        isMobileDevice: function(){
        	return browser.versions.mobile || browser.versions.ios || browser.versions.android || browser.versions.iPhone || browser.versions.iPad;
        },
        
        /**
         * convert utc time format string to local tm.   yyyy-MM-ddTHH:mm:ss.fffZ
         */
        utcToLocal: function(utcTMStr){
            var utcTM = this.parseDate(utcTMStr);
            
            var offset = utcTM.getTimezoneOffset() * 60000; //offset millisecond
            return utcTM.add('f', offset * -1);
        },
        
        /**
         * tmStr: yyyy-MM-ddTHH:mm:ss.fffZ or yyyy/MM/dd HH:mm:ss.fff
         */
        parseDate: function(tmStr){
            //don't work in firefox (milliseconds)
            //var utcTM = new Date(utcTMStr.replace(/-/g, '/').replace(/T|t|Z|z/g, ' ').trim());
            
            var tmArr = tmStr.split(/\/|\.|-|T|t|Z|z|:|\s/g);
            //milliseconds of utcTMStr was format in fff, but '0' in end will be omitted
            var milliSec = '000';
            if(tmArr.length >= 7){
                milliSec = tmArr[6];
                while(milliSec.length < 3){
                    milliSec += '0';
                }
            }
            
            return new Date(parseInt(tmArr[0]), parseInt(tmArr[1])-1, parseInt(tmArr[2]), parseInt(tmArr[3]), parseInt(tmArr[4]), parseInt(tmArr[5]), parseInt(milliSec));
        },
        
        /*
         * calculate string length in single-byte
        */
        asciiLength: function(str){
            return str? str.replace(/[^\x00-\xff]/g, "01").length : 0;
        },
        
        /*
         * substring in ascii length
        */
        subDescription: function(desc, wantLength){
            if(wantLength > 0){
                if(this.asciiLength(desc) > wantLength){
                    do{
                        desc = desc.substr(0, desc.length - 1);
                    }while(wantLength > 4 && (this.asciiLength(desc) > wantLength-4));

                    desc += '..';
                }
            }
            
            return desc;
        },
        
        /*
         * get an escape string for description (shown in string, not html) 
        */
        encodeDescription: function(desc){
            //replace: < >
            return desc.replace(/[<>]/g, function(c){
                return {'<':'&lt;','>':'&gt;'}[c];
            });
        },
        
        getTMDesc: function(timestamp){
            var tmCrt = new Date(timestamp);
            var tmCrtYMD = tmCrt.format('yyyy-MM-dd');
            var now = new Date();
            
            var diffMs = now - tmCrt;
            if(diffMs < 3600000){
                //less than one hour
                var minutes = parseInt(diffMs / 60000);
                return (minutes < 1 ? 1 : minutes) + '分钟';
                
            }else if(tmCrtYMD == now.format('yyyy-MM-dd')){
                //same day
                return tmCrt.format('HH:mm');
            }else if(tmCrtYMD == now.add('d', -1).format('yyyy-MM-dd')){
                //yestoday
                return '昨天 ' + tmCrt.format('HH:mm');
            }else if(tmCrt.getYear() == now.getYear()){
                //same year
                return tmCrt.format('M月d日');
            }else{
                return tmCrtYMD
            }
        }
	};
});
