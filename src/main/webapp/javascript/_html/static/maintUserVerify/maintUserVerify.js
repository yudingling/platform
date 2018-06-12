
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "tool/validator",
    "root/objectSelector/ObjectSelector",
    "common/widget/maintAreaTree/maintAreaTree",
    "dojo/text!./template/maintUserVerify.html",
    "tool/css!./css/maintUserVerify.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        Validator,
        ObjectSelector,
        AreaTree,
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
                		qa: qa,
                        params: 'maintUserVerify'
                	}
                }).success(lang.hitch(this, function(ret){
                    this.maId = ret.data[0];
                    this.areaData = ret.data[1];
                    this.areaDataMap = {};
                    this.defaultNode = null;
                    
                    for(var i=0; i<this.areaData.length; i++){
                        var curNode = this.areaData[i];
                        
                        if(curNode.nodeData){
                            this.areaDataMap[curNode.nodeData.ma_ID] = curNode;
                        }else{
                            this.defaultNode = curNode;
                        }
                    }
                    
                    var node = base.isNull(this.maId) ? this.defaultNode : this.areaDataMap[this.maId];
                    
                    this._setSelectedArea(node);
                    
                })).fail(function(){
                	location.href = base.getServerNM();
                });
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
                    url: base.getServerNM() + 'platformApi/open/maintUser/verify',
                    data: {
                        qa: base.getQueryString('qa'),
                        pwd: pwd,
                        phone: phone,
                        verifyCode: verifyCode,
                        maId: this.maId
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
            
            $(this.domNode).find('.areaForm>i').click(lang.hitch(this, function(){
        		this._showArea();
        	}));
        },
        
        _showArea: function(){
            if(!this.areaData){
                return;
            }
            
            if(!this.areaSelector){
                this.areaSelector = new ObjectSelector(
                    $(this.domNode).find('.areaForm'),
                    '选择运维区域', 
                    lang.hitch(this, function(objContainer){
                        if(!this.selTree){
                            this.selTree = new AreaTree({
                                areaData: this.areaData,
                                groupEdit: false,
                                expandFirst: false,
                                maxTitleAsciiLen: 31,
                                click: lang.hitch(this, function(treeNode){
                                    objContainer.data('data', treeNode);
                                })
                            });
                            
                            objContainer.append($(this.selTree.domNode));
                            this.selTree.startup();
                            
                            this.own(this.selTree);
                        }
                        
                        if(!base.isNull(this.maId)){
                            var node = this.areaDataMap[this.maId];
                            this.selTree.selectNode(this.selTree.getNode(node.id));
                            
                        }else{
                            this.selTree.selectNode(this.selTree.getNode(this.defaultNode.id));
                        }
                    })
                );
                
                this.own(this.areaSelector);
            }
            
            this.areaSelector.show(lang.hitch(this, function(objContainer){
                var node = objContainer.data('data');
                
                if(!node){
                    base.info('提醒', '请选择一个运维区域');
                    return false;
                }
                
                this._setSelectedArea(node);
                
            }), {width: '270px', height: '300px', top: '35px', right: '0px' });
        },
        
        _setSelectedArea: function(node){
            $(this.domNode).find('label.area').text(base.subDescription(node.name, 31));
            this.maId = node.nodeData ? node.nodeData.ma_ID : null;
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
