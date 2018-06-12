
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
    "root/customScrollbar/CustomScrollBar",
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
        CustomScrollBar,
        template){
    
    return declare("component.3rdStore.widget.purchase", [_Widget], {
        baseClass: "component_3rdStore_widget_purchase",
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
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
            }), 500);
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
            
            $(this.domNode).find('.steps .svNm').text(this.tps_NM);
            
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
                
                this._initDomStep1();
                this._initDomStep2();
                this._initDomStep3();
                this._initDomStep4();
            }));
        },
        
        _initDomStep1: function(){
            var chk = $(this.domNode).find('.steps .step1 input[type="checkbox"]');
            var btnNext = $(this.domNode).find('.steps .step1 .next');
            
            chk.change(lang.hitch(this, function(){
                if(chk.is(':checked')){
                    btnNext.removeAttr('disabled');
                }else{
                    btnNext.attr('disabled', 'disabled');
                }
        	}));
            
        	btnNext.click(lang.hitch(this, function(){
                if(!chk.is(':checked')){
                    base.error('错误', '请确认授权');
        			return;
                }
                
                this._addService();
            }));
            
            var authList = $(this.domNode).find('.steps .step1 .authList');
            authList.children().remove();
            
            var lilist = [];
            for(var i=0; i<this.auth_API.length; i++){
                lilist.push($('<li>' + this.auth_API[i].api_NM + '</li>'));
            }
            authList.append(lilist);
        },
        
        _initDomStep2: function(){
            var feeTp = parseInt(this.fee_TP);
            var tryUseSpan = $(this.domNode).find('.steps .step2 .tryUseSpan').hide();
            var tryUseDiv = $(this.domNode).find('.steps .step2 .tryUseDiv').hide();
            
            if(feeTp == 1){
                if(parseInt(this.fee_COUNT_FREE) > 0){
                    tryUseDiv.show();
                    tryUseSpan.text('可试用' + this.fee_COUNT_FREE + '次').show();
                }
                
            }else if(feeTp == 2){
                if(parseInt(this.fee_TIME_FREE) > 0){
                    tryUseDiv.show();
                    tryUseSpan.text('可试用' + this.fee_TIME_FREE + '天').show();
                }
            }
            
            var btnNext = $(this.domNode).find('.steps .step2 .next');
            
            var chk = tryUseDiv.find('input[type="checkbox"]');
            chk.change(lang.hitch(this, function(){
                btnNext.text(chk.is(':checked')? '完 成' : '下一步');
        	}));
            
        	btnNext.click(lang.hitch(this, function(){
                if(chk.is(':checked')){
                    $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
                    $(this.domNode).find('.navSteps .step3').addClass('visited');
                    $(this.domNode).find('.navSteps .step4').addClass('current');
                    
                    this.ps.slide(4);
                    
                }else{
                    if(base.isNull(this.selBuy.getCurrentSelect().data)){
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
                }
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
                topic.publish('component/3rdStore/closeModal');
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
        
        _addService: function(){
            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/purchase',
                data: {
                    tpsId: this.tps_ID
                }
            }).success(lang.hitch(this, function(ret){
                this.usp_ID = ret.data.usp_ID;
                
                //we have already created the fee statistic here, just update the step4
                $(this.domNode).find('.steps .step4 .freeOrFee').text('添加成功');
                this._setStep4Content(ret.data);
                
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');
                
                topic.publish('component/3rdStore/purchased', {tps_ID: this.tps_ID});
                
                this.ps.next();
            }));
        },
        
        _afterPayed: function(result){
            if(!base.isNull(result) && result.success){
                $(this.domNode).find('.steps .step4 .freeOrFee').text('购买成功');
                
                if(!base.isNull(result.data)){
                    this._afterPayed_next(result.data)
                    
                }else{
                    //get the fee statistic manually
                    base.ajax({
                        url: base.getServerNM() + 'platformApi/own/thirdparty/normal/feeStatistic',
                        data: {
                            tpsId: this.tps_ID,
                            uspId: this.usp_ID
                        }
                    }).success(lang.hitch(this, function(ret){
                        this._afterPayed_next(ret.data);
                    }));
                }
            }else{
                base.error('异常', '支付失败, ' + (base.isNull(result.message) ? '出现外部异常，请重试' : result.message));
            }
        },
        
        _afterPayed_next: function(data){
            this._setStep4Content(data, true);
            $(this.domNode).find('.navSteps .step3').removeClass('current').addClass('visited');
            $(this.domNode).find('.navSteps .step4').addClass('current');
            this.ps.next();
        },
        
        _setStep4Content: function(feeSta, isPayed){
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
                
                if(isPayed){
                    payedStr = '当前购买次数：' + this.selBuy.getCurrentSelect().name + '，';
                }
                
                payedStr += '剩余可用次数：' + remainCount;
                
            }else{
                if(isPayed){
                    payedStr = '当前购买时长：' + this.selBuy.getCurrentSelect().name + '，';
                }
                
                payedStr += '使用期限至：' + (new Date(feeSta.api_UNFREE_END)).format('yyyy-MM-dd');
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
