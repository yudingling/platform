
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "root/jquery-qrcode/QRCode",
    "dojo/text!./template/signin.html",
    "tool/css!./css/signin.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        QrCode,
        template){
    
    return declare("static.signin", [_Widget], {
        baseClass: "static_signin",
        templateString: template,
        constructor: function (args) {
            declare.safeMixin(this, args);
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
        },
        
        _initDom: function(){
            
        	var mobileId = base.getQueryString("mobileId");
        	var state = base.getQueryString("state");
        	
        	$(this.domNode).find('button').click(lang.hitch(this, function(){
        		                
                var uid = $(this.domNode).find('.uid').val();
                var pwd = $(this.domNode).find('.pwd').val();
                var keep = $(this.domNode).find('div.checkbox input').is(':checked');
                
                if(uid.length>0 && pwd.length>0){
                    this._startProgress();
                    
                	base.ajax({
                        type: 'POST',
                        data: {uid: uid, pwd: pwd, keep: keep},
                        url: base.getServerNM() + 'platformApi/open/signin'
                    }).success(lang.hitch(this, function(){
                        this._endProgress(true);
                        
                        $(this.domNode).find('form>.btnDiv>.progress>div').css('width', '99.5%');                                        
                        this._bindMobileToUser(mobileId, state);
                        
                    })).fail(lang.hitch(this, function(){
                        this._endProgress();
                    }));
                    
                }else{
                	base.error('输入错误', '用户名及密码不能为空');
                }               
            }));
            
        	$(this.domNode).find('.pwd').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	$(this.domNode).find('button').click();
                }
            }));
        	
        	$(this.domNode).find('.forgotPwd').click(function(){
        		location.href = base.getServerNM() + "static/forgotPassword.jsp";
        	});
        	
        	$(this.domNode).find('.signup a').click(function(){
        		if(!base.isNull(mobileId) && base.isMobileDevice()){
        			location.href = base.getServerNM() + "static/signup.jsp?mobileId="+mobileId+"&state="+state;			
        		}else{      			
       		    	location.href = base.getServerNM() + "static/signup.jsp";			
        		}        		
        	});
            
        	QrCode.init($(this.domNode).find('.copyright .qrCode>div'), {
                width: 80, 
                height: 80, 
                foreground: '#505050',
                text: "http://weixin.qq.com/q/02cgSJIHqse1010000g079"             
            });
        },

        _bindMobileToUser: function(mobileId, state){
            if(!base.isNull(mobileId) && base.isMobileDevice()){
                base.ajax({
                    type: 'POST',
                    data: {mobileId: mobileId},
                    url: base.getServerNM() + 'platformApi/own/user/normal/appBind'
                }).success(lang.hitch(this,function(){
                    //state is a full url
                	if(base.isNull(state)){
                		location.href = base.getServerNM()  + "platformMain/index";
                	}else{
                		location.href = state;
                	}
                    
                })).fail(lang.hitch(this, function(){
                    this._endProgress();
                }));
            }else{
            	if(base.isMobileDevice() && !base.isNull(state)){
            		location.href = state;
            	}else{
            		location.href = base.getServerNM()  + "platformMain/index";
            	}
            }
        },
        
        _startProgress: function(){
            var pg = $(this.domNode).find('form>.btnDiv>.progress').show();
            var pgIn = pg.children('div').css('width', '10%');
            this.current = 0;
            
            this.ts = setInterval(lang.hitch(this, function(){
                this.current += 30;
                var setWidth = this.current;
                
                if(this.current >= 100){
                    setWidth = 100;
                }
                
                if(this.current >= 200){
                    this._endProgress();
                }
                
                pgIn.css('width', this.current + '%');   
            }), 300);
        },
        
        _endProgress: function(show){
            if(this.ts){
                clearInterval(this.ts);
                this.ts = null;
            }
            
            if(!show){
                $(this.domNode).find('form>.btnDiv>.progress').hide();
            }
        }
    });
});
