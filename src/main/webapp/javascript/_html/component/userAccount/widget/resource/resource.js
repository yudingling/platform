
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "./widget/smsResource/smsResource",
    "./widget/imageResource/imageResource",
    "./widget/videoResource/videoResource",
    "./widget/purchaseHistory/purchaseHistory",
    "dojo/text!./template/resource.html",
    "tool/css!./css/resource.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        SmsResource,
        ImageResource,
        VideoResource,
        PurchaseHistory,
        template){
    
    return declare("component.userAccount.widget.resource", [_Widget], {
        baseClass: "component_userAccount_widget_resource",
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
            
            this._destroyPurchase();
        },
        
        _initDom: function(){
            var resDiv = $(this.domNode).find('.panel-group .resMgr>.panel-body');
            
            var smsResource = new SmsResource();
            resDiv.append($(smsResource.domNode));
            smsResource.startup();
            this.own(smsResource);
            
            var imageResource = new ImageResource();
            resDiv.append($(imageResource.domNode));
            imageResource.startup();
            this.own(imageResource);
            
            var videoResource = new VideoResource();
            resDiv.append($(videoResource.domNode));
            videoResource.startup();
            this.own(videoResource);
            
            var purchaseHistory = new PurchaseHistory();
            $(this.domNode).find('.panel-group .billMgr>.panel-body').append($(purchaseHistory.domNode));
            purchaseHistory.startup();
            this.own(purchaseHistory);
            
            $(this.domNode).find('.panel-group>.panel>.panel-collapse').on('hide.bs.collapse', lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/resource/hide');
            }));
        },
        
        _destroyPurchase: function(){
            if(this.purchase){
                this.purchase.destroyRecursive();
                this.purchase = null;
            }
        },
        
        _showPurchase: function(params){
            this._destroyPurchase();
            
            var modalDiv = $(this.domNode).children('.modal');
                
            base.newDojo(
                'component/userAccount/widget/resource/widget/purchase/purchase', 
                'resource.purchase', 
                params
            ).success(lang.hitch(this, function(obj){
                this.purchase = obj;
                
                modalDiv.find('.modal-title').text(this._getTitle(params.resourceTp))
                modalDiv.find('.modal-body').append($(obj.domNode));
                obj.startup();

                modalDiv.modal({backdrop: 'static', keyboard: false});
            }));
        },
        
        _getTitle: function(resourceTp){
            switch(resourceTp){
                case 'sms':
                    return '短信';
                    
                case 'image':
                    return '图片存储空间';
                    
                case 'video':
                    return '视频流';
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/resource/purchase', lang.hitch(this, function(params){
                this._showPurchase(params);
                
            }));
            var sub2 = topic.subscribe('component/userAccount/widget/resource/closeModal', lang.hitch(this, function () {
                $(this.domNode).children('.modal').modal('hide');
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
