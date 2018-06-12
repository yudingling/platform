
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/pageSwitch/pageSwitch",
    "root/breadcrumb/BreadCrumb",
    "common/widget/pay/pay",
    "dojo/text!./template/reliable.html",
    "tool/css!./css/reliable.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        PageSwitch,
        BreadCrumb,
        Pay,
        template){
    
    return declare("component.my3rd.myCreated.reliable", [_Widget], {
        baseClass: "component_my3rd_myCreated_reliable",
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
            if(this.hasReliabled){
                $(this.domNode).addClass('showNoPay');
                $(this.domNode).find('.btnRow>.submit').click(lang.hitch(this, function(){
                    this._submitNoPay();
                }));
                
            }else{
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
            }
            
            $(this.domNode).find('input.rlName').val(this.rlName);
        },
        
        _submitNoPay: function(){
            var sel = $(this.domNode).find('.nopay input').val().trim();
            if(sel.length <= 0){
                base.error('错误', '认证名称必须输入');
                return;
            }
            
            base.ajax({
                hintOnSuccess: true,
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/thirdparty/reliableReview',
                data: {
                    tpsId: this.tpsId,
                    rlName: sel
                }
            }).success(lang.hitch(this, function(ret){
                topic.publish('component/my3rd/widget/myCreated/reliableRefresh', {tpsId: this.tpsId});
                topic.publish('component/my3rd/widget/myCreated/closeModal');
            }));
        },
        
        _initSelBuy: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/reliablePrice',
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
            $(this.domNode).find('.steps .step1 .feeLabel').text('￥' + this.price);
            
            var input = $(this.domNode).find('.steps .step1 input');
            
        	$(this.domNode).find('.steps .step1 .next').click(lang.hitch(this, function(){
                var sel = input.val().trim();
                if(sel.length <= 0){
                    base.error('错误', '认证名称必须输入');
        			return;
                }
                
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');
                
                this._refreshPay(sel);
                
                this.ps.next();
            }));
        },
        
        _refreshPay: function(rlName){
            if(!this.pay){
                this.pay = new Pay();
                
                $(this.domNode).find('.steps .step2 .pay').append($(this.pay.domNode));
                this.pay.startup();
                this.own(this.pay);
            }
            
            this.pay.pay3rdServiceReliable({
                tpsId: this.tpsId, 
                rlName: rlName,
                subject: this._getSubjectName()
           });
        },
        
        _getSubjectName: function(isEndStr){
            if(isEndStr){
                return '已提交认证服务['+ this.tpsName +']的申请';
            }else{
                return '认证服务['+ this.tpsName +']';
            }
        },
        
        _afterPayed: function(result){
            if(!base.isNull(result) && result.success){
                this._afterPayedStatusChange();
            }else{
                base.error('异常', '支付失败, ' + (base.isNull(result.message) ? '出现外部异常，请重试' : result.message));
            }
        },
        
        _afterPayedStatusChange: function(){
            topic.publish('component/my3rd/widget/myCreated/reliableRefresh', {tpsId: this.tpsId});
            $(this.domNode).find('.steps .step3 .finalInfo>span:last-child').text(this._getSubjectName(true));
            
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
                topic.publish('component/my3rd/widget/myCreated/closeModal');
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
