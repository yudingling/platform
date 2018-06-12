
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "tool/validator",
    "dojo/text!./template/subUserVerify.html",
    "tool/css!./css/subUserVerify.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        Validator,
        template){
    
    return declare("static.subUserVerify", [_Widget], {
        baseClass: "static_subUserVerify",
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
            
            this._qaCheck();
        },
        
        destroy: function(){
        	this.inherited(arguments);
        	this._clearVerifyIntv(true);
        },
        
        _qaCheck: function(){
        	var qa = base.getQueryString('qa');
            if(base.isNull(qa) || qa.length == 0){
            	location.href = base.getServerNM();
            }else{
            	base.ajax({
                	type: 'GET',
                	url: base.getServerNM() + 'platformApi/open/qaExpire',
                	data: {
                		qa: qa
                	}
                }).fail(lang.hitch(this, function(ret){
                	location.href = base.getServerNM();
                }));
            }
        },
        
        _initDom: function(){
            var verifyBtn = $(this.domNode).find('.verifyDiv .btn');
        	
        	$(this.domNode).find('.phone').on("propertychange input",lang.hitch(this, function(event){
        		if(!this.onVerify){
        			if($(event.currentTarget).val().length > 0){
            			verifyBtn.removeAttr('disabled');
            		}else{
            			verifyBtn.attr('disabled', 'disabled');
            		}
        		}
			}));
        	
        	verifyBtn.click(lang.hitch(this, function(){
        		var phone = $(this.domNode).find('.phone').val();
        		
        		if(phone.length == 0 || !Validator.isMobile(phone)){
        			base.error('输入错误', '手机号输入错误');
        			return;
        		}
        		
        		this.onVerify = true;
        		
        		base.ajax({
                    type: 'POST',
                    url: base.getServerNM() + 'platformApi/open/msgverify/' + phone,
                    hintOnSuccess: true
                }).success(lang.hitch(this, function(){
                	verifyBtn.attr('disabled', 'disabled');
                	
                	var val = 60;
                	this.verifyIntv = setInterval(lang.hitch(this, function(){
                		verifyBtn.text(val--);
                		if(val < 0){
                			this._clearVerifyIntv();
                		}
                	}), 1000);
            		
                }));
        	}));
            
        	$(this.domNode).find('button.save').click(lang.hitch(this, function(){
                var pwd = $(this.domNode).find('.pwd').val();
                var pwd2 = $(this.domNode).find('.pwd2').val();
                var phone = $(this.domNode).find('.phone').val();
                var verifyCode = $(this.domNode).find('.verify').val();
                
                if(pwd.length == 0 || pwd2.length == 0 || pwd != pwd2){
                    base.error('输入错误', '密码不能为空且两次输入要一致');
                    return;
                }
                
        		if(phone.length == 0 || !Validator.isMobile(phone)){
        			base.error('输入错误', '手机号输入错误');
        			return;
        		}
                
                if(verifyCode.length == 0){
                    base.error('输入错误', '验证码不能为空');
        			return;
                }
                
                base.ajax({
                    type: 'PUT',
                    url: base.getServerNM() + 'platformApi/open/subUser/verify',
                    data: {
                        qa: base.getQueryString('qa'),
                        pwd: pwd,
                        phone: phone,
                        verifyCode: verifyCode
                    }
                }).success(lang.hitch(this, function(){
                    var showObj = $(this.domNode).find('form .finished').show();
                    $(this.domNode).find('form>*:not(:first-child)').not(showObj).hide();
                    
                    this.defer(function(){
                        location.href = base.getServerNM()  + "platformMain/index";
                    }, 3000);

                }));
            }));
            
            $(this.domNode).find('.finished a').click(function(){
        		location.href = base.getServerNM() + "platformMain/index";
        	});
        },
        
        _clearVerifyIntv: function(destroy){
        	if(this.verifyIntv){
        		clearInterval(this.verifyIntv);
        	}
        	
            if(!destroy){
                var verifyBtn = $(this.domNode).find('.verifyDiv .btn').text('获取');
                this.onVerify = false;
                
                if($(this.domNode).find('.phone').val().length > 0){
                    verifyBtn.removeAttr('disabled');
        	   }
            }
        }
    });
});
