
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/jquery-qrcode/QRCode",
    "dojo/text!./template/userInfo.html",
    "tool/css!./css/userInfo.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        QrCode,
        template){
    
    return declare("main.mobile.userInfo", [_Widget], {
        baseClass: "main_mobile_userInfo",
        templateString: template,
        
        selfAuth: true,
        
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
            
            this._setData();
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode));
                
                //need to calculate the width/heigth for qrCode, show it in defer method
                this._showQrCode();
            }), 500);
        },
        
        destroy: function(){
            this.inherited(arguments);
        },
        
        _initDom: function(){
            $(this.domNode).find('a.moreHref').click(lang.hitch(this, function(e){
                $(e.currentTarget).toggleClass('open');
            }));
        },
        
        _showQrCode: function(){
            var qrNode = $(this.domNode).find('.qrCode>div');
            
            var width = 140, parentHeight = 190;
            var maxWidth = qrNode.parent().width();
            if(maxWidth * 0.9 < 140){
                width = parseInt(maxWidth * 0.9);
                parentHeight = maxWidth + 40;
            }
            
            qrNode.parent().height(parentHeight);
            qrNode.width(width).height(width).show();
            
            QrCode.init(qrNode, {
                width: width, 
                height: width, 
                foreground: '#333',
                text: base.getServerNM('platform') + 'platformMobile/s/userOpenInfo?uid=' + base.getUid()
            });
        },
        
        _getImgUrl: function(data){
            return base.isNull(data.u_ICON)? (base.getServerNM() + 'javascript/_html/common/linkimg/user.png') : (base.getServerNM('file') + 'fileApi/own/icon?fileId=' + data.u_ICON);
        },
        
        _getLimitedStr: function(statusVal){
            var str = parseInt(statusVal.total) < 0? '--' : statusVal.total;
            
            return statusVal.current + '/' + str;
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/mobile/self'
            }).success(lang.hitch(this, function(ret){
                this.currentObj = ret.data.self;
                
                $(this.domNode).find('.unm').text(this.currentObj.u_NM);
                $(this.domNode).find('.uid').text(this.currentObj.u_ID);
                
                var imgUrl = this._getImgUrl(this.currentObj);
                $(this.domNode).find('.icon img').attr('src', imgUrl);
                
                $(this.domNode).find('.clientsCount').text(ret.data.clientsCount + ' 设备');
                $(this.domNode).find('.crtTs').text((new Date(this.currentObj.crt_TS)).format('yyyy-MM-dd') + ' 加入');
                
                var node = $(this.domNode).find('.moreInfo');
                if(this.currentObj.u_PID){
                    node.find('.pUnm>label:last-child').text(this.currentObj.parentUnm);
                }else{
                    node.find('.pUnm').hide();
                }
                node.find('.email>label:last-child').html(this.currentObj.u_EMAIL).attr('title', this.currentObj.u_EMAIL);
                node.find('.profit>label:last-child').html('￥' + this.currentObj.u_PROFIT);
                node.find('.phone>label:last-child').html(this.currentObj.u_PHONE);
                
                node = $(this.domNode).find('.widget-text-box');
                node.find('h3.sms').text(this._getLimitedStr(ret.data.sms));
                node.find('h3.img').text(this._getLimitedStr(ret.data.image));
                node.find('h3.video').text(this._getLimitedStr(ret.data.video));
                
            }));
        },
        
        _initEvents: function () {
        }
    });
});