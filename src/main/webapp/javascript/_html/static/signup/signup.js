
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    'root/spin/Spin',
    "tool/validator",
    'root/pageSwitch/pageSwitch',
    'root/breadcrumb/BreadCrumb',
    "dojo/text!./template/signup.html",
    "tool/css!./css/signup.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        Spin,
        Validator,
        PageSwitch,
        BreadCrumb,
        template){
    
    return declare("static.signup", [_Widget], {
        baseClass: "static_signup",
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
        
        destroy: function(){
        	this.inherited(arguments);
        	this._clearVerifyIntv(true);
        },
        
        _initDom: function(){
        	var ps = new PageSwitch($(this.domNode).find('.steps')[0],{
        	    duration:600,           //int 页面过渡时间
        	    direction:0,            //int 页面切换方向，0横向，1纵向
        	    start:0,                //int 默认显示页面
        	    loop:false,             //bool 是否循环切换
        	    ease:'ease',            //string|function 过渡曲线动画，详见下方说明
        	    transition:'scrollX',     //string|function转场方式，详见下方说明
        	    freeze:false,           //bool 是否冻结页面（冻结后不可响应用户操作，可以通过 `.freeze(false)` 方法来解冻）
        	    mouse:false,             //bool 是否启用鼠标拖拽
        	    mousewheel:false,       //bool 是否启用鼠标滚轮切换
        	    arrowkey:false,         //bool 是否启用键盘方向切换
        	    autoplay:false,         //bool 是否自动播放幻灯 新增
        	    interval:0            //bool 幻灯播放时间间隔 新增
        	});
        	
        	BreadCrumb.init($(this.domNode).find('.navSteps'), "cd-multi-steps text-bottom count");
        	
        	this._initDomStep1(ps);
        	this._initDomStep2(ps);
        },
        
        _initDomStep1: function(ps){
        	$(this.domNode).find('.steps .step1 .next').click(lang.hitch(this, function(){
        		var email = $(this.domNode).find('.uid').val();
        		var pwd = $(this.domNode).find('.pwd').val();
        		var pwd2 = $(this.domNode).find('.pwd2').val();
        		
        		if(email.length == 0 || !Validator.isEmail(email)){
        			base.error('输入错误', '邮箱格式不正确');
        			return;
        		}
        		
        		if(pwd.length == 0 || pwd2.length == 0 || pwd != pwd2 ){
        			base.error('输入错误', '密码不能为空，且两次输入需一致');
        			return;
        		}
        		
        		var spin = new Spin($(this.domNode).find('form'));
        		
        		base.ajax({
                    type: 'POST',
                    data: {'email': email},
                    url: base.getServerNM() + 'platformApi/open/emailverify'
                }).success(lang.hitch(this, function(){
                    
                    spin.destroy();
                    
                    $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
            		$(this.domNode).find('.navSteps .step2').addClass('current');
            		
            		ps.next();
            		
                })).fail(function(){
                    spin.destroy();
                });
            }));
        },
        
        _initDomStep2: function(ps){
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
        	
        	$(this.domNode).find('.steps .step2 .next').click(lang.hitch(this, function(){
        		
        		var email = $(this.domNode).find('.uid').val();
        		var pwd = $(this.domNode).find('.pwd').val();
        		var pwd2 = $(this.domNode).find('.pwd2').val();
        		var name = $(this.domNode).find('.name').val().trim();
        		var phone = $(this.domNode).find('.phone').val();
        		var verifyCode = $(this.domNode).find('.verify').val();
        		
        		if(email.length == 0 || !Validator.isEmail(email)){
        			base.error('输入错误', '邮箱格式不正确');
        			return;
        		}
        		
        		if(pwd.length == 0 || pwd2.length == 0 || pwd != pwd2 ){
        			base.error('输入错误', '密码不能为空，且两次输入需一致');
        			return;
        		}
        		
        		if(name.length == 0){
        			base.error('输入错误', '用户名称不能为空');
        			return;
        		}
        		
        		if(phone.length == 0 || !Validator.isMobile(phone)){
        			base.error('输入错误', '手机号不能为空');
        			return;
        		}
        		
        		if(verifyCode.length == 0){
        			base.error('输入错误', '验证码不能为空');
        			return;
        		}
        		
        		var spin = new Spin($(this.domNode).find('form'));
        		
        		base.ajax({
                    type: 'POST',
                    data: {'email': email, 'name': name, 'pwd': pwd, 'phone': phone, 'verifyCode': verifyCode},
                    url: base.getServerNM() + 'platformApi/open/signup',
                    hintOnSuccess: true
                }).success(lang.hitch(this, function(){
                    
                    spin.destroy();
                    
                    this._initDomStep3(ps);
                    
                })).fail(function(){
                    spin.destroy();
                });
            }));
        	
        	$(this.domNode).find('.steps .step2 .prev').click(lang.hitch(this, function(){
        		$(this.domNode).find('.navSteps .step1').removeClass('visited').addClass('current');
        		$(this.domNode).find('.navSteps .step2').removeClass('current');
        		
        		ps.prev();
            }));
        },
        
        _initDomStep3: function(ps){
        	var mobileId = base.getQueryString("mobileId");
        	var state = base.getQueryString("state");
        	
            this._bindMobileToUser(ps, mobileId, state);
        },
        
        _bindMobileToUser: function(ps, mobileId, state){
            if(!base.isNull(mobileId) && base.isMobileDevice()){
                base.ajax({
                    type: 'POST',
                    data: {mobileId: mobileId},
                    url: base.getServerNM() + 'platformApi/own/user/normal/appBind'
                }).success(lang.hitch(this,function(){
                    //state is a full url
                    var href = base.isNull(state)? (base.getServerNM()  + "platformMain/index") : state;
                    this._step3Show(ps, href);
                }));
            }else{
                var href = (base.isMobileDevice() && !base.isNull(state))? state : (base.getServerNM()  + "platformMain/index");
                this._step3Show(ps, href);
            }
        },
        
        _step3Show: function(ps, href){
            $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
            $(this.domNode).find('.navSteps .step3').addClass('current');
            ps.next();
            
            var hrefNode = $(this.domNode).find('.steps .step3 a');
            hrefNode.click(lang.hitch(this, function(){
                location.href = href;
            }));

            this.defer(lang.hitch(this, function(){
                hrefNode[0].click();
            }), 5000);
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
