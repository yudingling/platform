
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/dropdownBox/DropdownBox",
    "root/pageSwitch/pageSwitch",
    "root/breadcrumb/BreadCrumb",
    "common/widget/pay/pay",
    "dojo/text!./template/purchase.html",
    "tool/css!./css/purchase.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        DropdownBox,
        PageSwitch,
        BreadCrumb,
        Pay,
        template){
    
    return declare("component.my3rd.widget.myUsed.widget.purchase", [_Widget], {
        baseClass: "component_my3rd_widget_myUsed_widget_ph",
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
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/price',
                data: {
                    tpsId: this.tps_ID
                }
            }).success(lang.hitch(this, function(ret){
                this.selBuy = new DropdownBox($(this.domNode).find('.steps .step2 .selBuy'), {
                    placeholder: parseInt(this.fee_TP) == 1 ? '选择购买量' : '选择购买时长',
                    minWidth: 60,
                    dropMinWidth: 80,
                    options: ret.data,
                    onclick: lang.hitch(this, function(name, value, data){
                        $(this.domNode).find('.steps .step2 .feeLabel').text('￥' + data.fee);
                    })
                });
                
                this.own(this.selBuy);
                
                this._initDomStep2();
                this._initDomStep3();
                this._initDomStep4();
            }));
        },
        
        _initDomStep2: function(){
        	$(this.domNode).find('.steps .step2 .next').click(lang.hitch(this, function(){
                if(base.isNull(this.selBuy.getCurrentSelect().data)){
                    var feeTp = parseInt(this.fee_TP);
                    if(feeTp == 1){
                        base.error('错误', '请选择购买次数');
                    }else{
                        base.error('错误', '请选择购买时长');
                    }
                    return;
                }

                $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step3').addClass('current');

                this._refreshPay();

                this.ps.next();
            }));
        },
        
        _initDomStep3: function(){
            $(this.domNode).find('.steps .step3 .prev').click(lang.hitch(this, function(){
                $(this.domNode).find('.navSteps .step2').removeClass('visited').addClass('current');
                $(this.domNode).find('.navSteps .step3').removeClass('current');
                
                this.ps.prev();
            }));
        },
        
        _initDomStep4: function(){
            $(this.domNode).find('.steps .step4 .btn').click(lang.hitch(this, function(){
                topic.publish('component/my3rd/widget/myUsed/closeModal');
            }));
        },
        
        _refreshPay: function(){
            if(!this.pay){
                this.pay = new Pay();
                
                $(this.domNode).find('.steps .step3 .pay').append($(this.pay.domNode));
                this.pay.startup();
                this.own(this.pay);
            }
            
            this.pay.pay3rdService({
                uspId: this.usp_ID, 
                count: parseInt(this.selBuy.getCurrentSelect().data.count), 
                subject: '购买服务['+ this.tps_NM +'] ' + this.selBuy.getCurrentSelect().name
           });
        },
        
        _afterPayed: function(result){
            if(!base.isNull(result) && result.success){
                if(!base.isNull(result.data)){
                    this._afterPayedStatusChange(result.data);
                    
                }else{
                    //get the fee statistic manually
                    base.ajax({
                        url: base.getServerNM() + 'platformApi/own/thirdparty/normal/feeStatistic',
                        data: {
                            tpsId: this.tps_ID,
                            uspId: this.usp_ID
                        }
                    }).success(lang.hitch(this, function(ret){
                        this._afterPayedStatusChange(ret.data);
                    }));
                }
            }else{
                base.error('异常', '支付失败, ' + (base.isNull(result.message) ? '出现外部异常，请重试' : result.message));
            }
        },
        
        _afterPayedStatusChange: function(paiedData){
            topic.publish('component/my3rd/widget/myUsed/afterPayed', paiedData);
            
            this._setStep4Content(paiedData);
            this.ps.next();
        },
        
        _setStep4Content: function(feeSta){
            var feeTp = parseInt(this.fee_TP);
            var payedStr = '';
            
            if(feeTp == 1){
                var remainCount = 0;
                var freeTotal = parseInt(feeSta.api_FREE_TOTAL);
                if(freeTotal < 0){
                    remainCount = parseInt(feeSta.api_UNFREE_TOTAL) - parseInt(feeSta.api_UNFREE_USED);
                }else{
                    remainCount = freeTotal - parseInt(feeSta.api_FREE_USED) + parseInt(feeSta.api_UNFREE_TOTAL) - parseInt(feeSta.api_UNFREE_USED);
                }
                
                payedStr = '当前购买次数：' + this.selBuy.getCurrentSelect().name + '，剩余可用次数：' + remainCount;

            }else{
                payedStr = '当前购买时长：' + this.selBuy.getCurrentSelect().name + '，使用期限至：' + (new Date(feeSta.api_UNFREE_END)).format('yyyy-MM-dd');
            }
            
            $(this.domNode).find('.steps .step4 .usedDeadLine').text(payedStr);
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/pay/finished', lang.hitch(this, function(result){
                this._afterPayed(result);
                
            }));
            
            this.own(sub1);
        }
    });
});
