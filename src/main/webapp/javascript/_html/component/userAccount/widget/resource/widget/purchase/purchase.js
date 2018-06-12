
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/pageSwitch/pageSwitch",
    "root/breadcrumb/BreadCrumb",
    "common/widget/pay/pay",
    "tool/validator",
    "root/dropdownBox/DropdownBox",
    "dojo/text!./template/purchase.html",
    "tool/css!./css/purchase.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        PageSwitch,
        BreadCrumb,
        Pay,
        Validator,
        DropdownBox,
        template){
    
    return declare("component.userAccount.widget.resource.widget.purchase", [_Widget], {
        baseClass: "component_userAccount_widget_resource_widget_purchase",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this._initEvents();
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
        },
        
        _initDom: function(){
            this.ps = new PageSwitch($(this.domNode).find('.steps')[0],{
        	    duration:600,
        	    direction:0,
        	    start:0,
        	    loop:false,
        	    ease:'ease',
        	    transition:'scrollX',
        	    freeze:false,
        	    mouse:false,
        	    mousewheel:false,
        	    arrowkey:false,
        	    autoplay:false,
        	    interval:0
        	});
        	
        	BreadCrumb.init($(this.domNode).find('.navSteps'), "cd-multi-steps text-top");
            
            this._initSelBuy();
        },
        
        _initSelBuy: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/resourcePrice',
                data: {
                    resourceTp: this.resourceTp
                }
            }).success(lang.hitch(this, function(ret){
                this.price = parseFloat(ret.data);
                
                this._initDomStep1();
                this._initDomStep2();
                this._initDomStep3();
            }));
        },
        
        _initDomStep1: function(){
            var feeLabel = $(this.domNode).find('.steps .step1 .feeLabel');
            var numNode = $(this.domNode).find('.steps .step1 input.num');
            var periodNode = $(this.domNode).find('.steps .step1 input.period');
            
            numNode.keyup(lang.hitch(this, function(event){
                this._calcFee(numNode, periodNode, feeLabel);
                
            })).attr('placeholder', '>=' + this.minSize);
            
            if(this.resourceTp == 'video'){
                $(this.domNode).find('.steps .step1 .payTm').show();
                
                periodNode.keyup(lang.hitch(this, function(event){
                    this._calcFee(numNode, periodNode, feeLabel);

                })).attr('placeholder', '>=' + this.minSize);
                
                this.tsDp = new DropdownBox($(this.domNode).find('.steps .step1 .tsTp'), {
                    options: [{name: '月', value: '1'}, {name: '年', value: '12'}],
                    minWidth: 50,
                    dropMinWidth: 50,
                    onclick: lang.hitch(this, function(name, value, data){
                        this._calcFee(numNode, periodNode, feeLabel);
                    })
                });
                this.tsDp.select('1', true);
            }
            
        	$(this.domNode).find('.steps .step1 .next').click(lang.hitch(this, function(){
                var obj = this._getNumObj(numNode, periodNode);
                
                if(base.isNull(obj.num)){
                    base.error('错误', '数量输入错误，必须为大于等于'+ this.minSize +'的整数');
        			return;
                }
                
                if(this.resourceTp == 'video'){
                    if(base.isNull(obj.period)){
                        base.error('错误', '时长输入错误，必须为大于等于'+ this.minSize +'的整数');
                        return;
                    }
                }
                
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');
                
                this._refreshPay();
                
                this.ps.next();
            }));
        },
        
        _getNumObj: function(numNode, periodNode){
            var numStr = numNode.val();
            var num = Validator.isInt(numStr)? parseInt(numStr) : null;
            
            if(base.isNull(num) || num < this.minSize){
                num = null;
            }
            
            var period = null, periodStr = null;
            if(this.resourceTp == 'video'){
                var periodStr = periodNode.val();
                period = Validator.isInt(periodStr)? parseInt(periodStr) : null;
                
                if(base.isNull(period) || period < this.minSize){
                    period = null;
                    
                }else{
                    periodStr = period + this.tsDp.getCurrentSelect().name;
                    period *= parseInt(this.tsDp.getCurrentSelect().value);
                }
            }
            
            return {num: num, period: period, periodStr: periodStr};
        },
        
        _calcFee: function(numNode, periodNode, feeLabel){
            var obj = this._getNumObj(numNode, periodNode);
            var feeTxt = null;
            
            if(!base.isNull(obj.num)){
                if(this.resourceTp == 'video'){
                    if(!base.isNull(obj.period)){
                        feeTxt = (obj.num * obj.period * this.price).toFixed(2);
                    }
                    
                }else{
                    feeTxt = (obj.num * this.price).toFixed(2);
                }
            }
            
            if(!base.isNull(feeTxt)){
                feeLabel.text('￥' + feeTxt);
            }else{
                feeLabel.text('--');
            }
        },
        
        _refreshPay: function(){
            if(!this.pay){
                this.pay = new Pay();
                
                $(this.domNode).find('.steps .step2 .pay').append($(this.pay.domNode));
                this.pay.startup();
                this.own(this.pay);
            }
            
            var numObj = this._getNumObj($(this.domNode).find('.steps .step1 input.num'), $(this.domNode).find('.steps .step1 input.period'));
            var numStr = null;
            if(this.resourceTp == 'video'){
                numStr = numObj.num + ',' + numObj.period;
            }else{
                numStr = numObj.num;
            }
            
            this.pay.payResource({
                resourceTp: this.resourceTp, 
                count: numStr, 
                subject: this._getSubjectName(numObj)
           });
        },
        
        _getSubjectName: function(numObj, resStatus){
            var name = '';
            switch(this.resourceTp){
                case 'sms':
                    name = '购买短信' + numObj.num + '条';
                    if(!base.isNull(resStatus)){
                        name += '，剩余' + (resStatus.total - resStatus.current) + '条可用';
                    }
                    break;
                    
                case 'image':
                    name = '购买图片存储空间' + numObj.num + '张';
                    if(!base.isNull(resStatus)){
                        name += '，总共' + resStatus.total + '张';
                    }
                    break;
                    
                case 'video':
                    name = '购买' + numObj.num + '个视频流，时长' + numObj.periodStr;
                    if(!base.isNull(resStatus)){
                        name += '，当前总共' + resStatus.total + '个视频流可用';
                    }
                    break;
            }
            
            return base.isNull(resStatus) ? name : ('此次' + name);
        },
        
        _afterPayed: function(result){
            if(!base.isNull(result) && result.success){
                if(!base.isNull(result.data)){
                    this._afterPayedStatusChange(result.data);
                    
                }else{
                    //get the fee statistic manually
                    base.ajax({
                        url: base.getServerNM() + 'platformApi/own/user/normal/resourceStatus/typed',
                        data: {
                            resourceTp: this.resourceTp
                        }
                    }).success(lang.hitch(this, function(ret){
                        this._afterPayedStatusChange(ret.data);
                    }));
                }
            }else{
                base.error('异常', '支付失败, ' + (base.isNull(result.message) ? '出现外部异常，请重试' : result.message));
            }
        },
        
        _afterPayedStatusChange: function(resStatus){
            var numObj = this._getNumObj($(this.domNode).find('.steps .step1 input.num'), $(this.domNode).find('.steps .step1 input.period'));
            
            topic.publish('component/userAccount/widget/resource/changed', {resourceTp: this.resourceTp, status: resStatus});
            $(this.domNode).find('.steps .step3 .finalInfo>span:last-child').text(this._getSubjectName(numObj, resStatus));
            
            $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
            $(this.domNode).find('.navSteps .step3').addClass('current');
            
            this.ps.next();
        },
        
        _initDomStep2: function(ps){
        	$(this.domNode).find('.steps .step2 .prev').click(lang.hitch(this, function(){
        		$(this.domNode).find('.navSteps .step1').removeClass('visited').addClass('current');
        		$(this.domNode).find('.navSteps .step2').removeClass('current');
        		
        		this.ps.prev();
            }));
        },
        
        _initDomStep3: function(){
            $(this.domNode).find('.steps .step3 .btn').click(lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/resource/closeModal');
            }));
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/pay/finished', lang.hitch(this, function(result){
                this._afterPayed(result);
                
            }));
            
            this.own(sub1);
        }
    });
});
