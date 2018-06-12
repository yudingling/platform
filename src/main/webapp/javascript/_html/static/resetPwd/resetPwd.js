
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    'root/spin/Spin',
    "dojo/text!./template/resetPwd.html",
    "tool/css!./css/resetPwd.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        Spin,
        template){
    
    return declare("static.resetPwd", [_Widget], {
        baseClass: "static_resetPwd",
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
        	$(this.domNode).find('button').click(lang.hitch(this, function(){
                
                var pwd = $(this.domNode).find('.pwd').val();
                var pwd2 = $(this.domNode).find('.pwd2').val();
                
                if(pwd.length > 0 && pwd2.length > 0 && pwd == pwd2){
                	var spin = new Spin($(this.domNode).find('form'));
                	
                	base.ajax({
                        type: 'PUT',
                        data: {'qa': base.getQueryString('qa'), 'pwd': pwd},
                        url: base.getServerNM() + 'platformApi/open/resetpassword'
                    }).success(lang.hitch(this, function(){
                        var showObj = $(this.domNode).find('form .finished').show();
                        $(this.domNode).find('form>*:not(:first-child)').not(showObj).hide();
                        
                        spin.destroy();
                        
                        this.defer(function(){
                        	location.href = base.getServerNM()  + "platformMain/index";
                        }, 3000);
                        
                    })).fail(function(){
                        spin.destroy();
                    });
                }else{
                	base.error('输入错误', '密码不能为空且两次输入要一致');
                }
                
            }));
            
        	$(this.domNode).find('.pwd').keydown(lang.hitch(this, function(event){
                if(event.which == 13){
                	$(this.domNode).find('button').click();
                }
            }));
            
            $(this.domNode).find('.finished a').click(function(){
        		location.href = base.getServerNM() + "platformMain/index";
        	});
        }
    });
});
