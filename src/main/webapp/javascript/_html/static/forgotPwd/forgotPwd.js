
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    'root/spin/Spin',
    "tool/validator",
    "dojo/text!./template/forgotPwd.html",
    "tool/css!./css/forgotPwd.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        Spin,
        Validator,
        template){
    
    return declare("static.forgotPwd", [_Widget], {
        baseClass: "static_forgotPwd",
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
        	var btn = $(this.domNode).find('button');
        	
        	btn.click(lang.hitch(this, function(){
                
                var uid = $(this.domNode).find('.uid').val();
                
                if(uid.length > 0 && Validator.isEmail(uid)){
                	var spin = new Spin($(this.domNode).find('form'));
                	
                	base.ajax({
                        type: 'POST',
                        url: base.getServerNM() + 'platformApi/open/forgotpassword',
                        data: {uid: uid}
                    }).success(lang.hitch(this, function(){
                        var showObj = $(this.domNode).find('form>a, form>.finished').show();
                        $(this.domNode).find('form>*:not(:first-child)').not(showObj).hide();
                        
                        spin.destroy();
                        
                    })).fail(function(){
                        spin.destroy();
                    });
                }else{
                	base.error('输入错误', '邮件地址输入错误');
                }
                
            }));
        	
        	
        	$(this.domNode).find('.uid').on("propertychange input",lang.hitch(this, function(event){
        		if($(event.currentTarget).val().length > 0){
        			btn.removeAttr('disabled');
        		}else{
        			btn.attr('disabled', 'disabled');
        		}
			}));
            
            $(this.domNode).find('form>a').click(function(){
        		location.href = base.getServerNM() + "static/signin.jsp";
        	});
        }
    });
});
