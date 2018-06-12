define(["tool/base",
    "dojo/_base/declare",
    "root/websocket/sockjs-0.3.min",
    "root/websocket/reconnecting-websocket",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/jquery-qrcode/QRCode",
    "dojo/text!./template/pay.html",
    "tool/css!./css/pay.css"
], function(base,
             declare,
             sockjs,
             ReconnectingWebSocket,
             _Widget,
             lang,
             topic,
             QRcode,
             template){

    return declare("common.widget.pay", [_Widget], {

        baseClass: "common_widget_pay",
        templateString: template,

        constructor: function(args){
            declare.safeMixin(this, args);
            
            this.webSockets = [];
            
            this._initEvents();
        },

        postCreate: function(){
            this.inherited(arguments);
            this._initDom();
        },

        startup: function(){
            this.inherited(arguments);
            this._initEvents();
        },

        destroy: function(){
            this.inherited(arguments);
            this._closeSocket();           
        },

        /*
         * arguments: {
                uspId: 'xxx', 
                count: 12, 
                subject: 'thirparty serice xxx' 
           }
         */
        pay3rdService: function(data){
            this._clearBufferQrCode();
            
            this.data = $.extend(data, {lgTp: '3rdService'});
            this._pay();
        },
        
        /*
         * arguments: {
                tpsId: 'xxx',
                rlName: 'xxxxxx',
                subject: 'thirparty serice xxx' 
           }
         */
        pay3rdServiceReliable: function(data){
            this._clearBufferQrCode();
            
            this.data = $.extend(data, {lgTp: '3rdServiceReliable'});
            this._pay();
        },

        /*
         * arguments: {
                resourceTp: 'sms', 
                count: '12',     //if resourceTp is 'video', count is a string like 'num,period'
                subject: 'thirparty serice xxx' 
            }
         */
        payResource: function(data){
            this._clearBufferQrCode();
            
            this.data = $.extend(data, {lgTp: 'resource'});
            this._pay();
        },

        _clearBufferQrCode: function(){
            this.WechatQrcode = null;
            this.AlipayQrcode = null;
            this.BalanceQrCode = null;
            
            this._selectPayTypeNode('Balance');
        },

        _pay: function(){
            if(this.data.lgTp == '3rdService'){
                this.url = "platformApi/own/thirdparty/normal/pay";
                this._sendData();
                
            }else if(this.data.lgTp == '3rdServiceReliable'){
                this.url = "platformApi/own/thirdparty/normal/reliablePay";
                this._sendData();
                
            }else{
                this.url = "platformApi/own/user/normal/resourcePay";
                this._sendData();
            }
        },

        _sendData: function(pathEndFix){
            base.ajax({
                type: 'POST',
                data: $.extend({payTp: this.payType}, this.data),
                url: base.getServerNM() + this.url
            }).success(lang.hitch(this, function(ret){
                if(this.payType == 'Balance'){
                    var chkBalanceNode = $(this.domNode).find('.chkBalance');
                    
                    
                    if(ret.data.qrCode){
                        chkBalanceNode.hide();
                        chkBalanceNode.next().addClass('asLeft');
                        
                        this._selectPayTypeNode('WeChat');
                        
                    }else{
                        chkBalanceNode.show();
                        chkBalanceNode.next().removeClass('asLeft');
                    }
                }
                
                if(this.payType == 'WeChat'){
                    this.WechatQrcode = ret.data.qrCode;
                }else if(this.payType == 'Alipay'){
                    this.AlipayQrcode = ret.data.qrCode;
                }else if(this.payType == 'Balance'){
                    this.BalanceQrCode = ret.data;
                }
                
                this._createWebSocket(ret.data.id, this.data.lgTp);
            }));
        },

        _createWebSocket: function(id, pathEndFix){
            var serverNM = base.getServerNM('platform');
            var pathWebSocket = serverNM.replace("http", "ws") + 'platformWs/queue/' + pathEndFix + '/websocket.ws?id=' + id;
            var pathSockJS = serverNM + 'platformWs/queue/' + pathEndFix + '/sockjs.ws?id=' + id;
            
            var server = null;
            if("WebSocket" in window){
                server = new ReconnectingWebSocket(pathWebSocket, null, {debug: false, reconnectInterval: 3000});
            } else if("MozWebSocket" in window){
                server = new MozWebSocket(pathWebSocket);
            } else {
                server = new SockJS(pathSockJS);
            }
            
            this.webSockets.push(server);
            
            server.onopen = lang.hitch(this, function(e){
                this._showQrCode(false);
            });

            server.onerror = lang.hitch(this, function(e){           	
                this._closeSocket(server);
            });
            
            server.onclose = lang.hitch(this, function(e){     	
                this._closeSocket(server);
            });

            server.onmessage = lang.hitch(this, function(e){
                this._closeSocket(server);
                
                if(!base.isNull(e.data)){
                    this._finished(base.evalJson(e.data));
                }
            });
        },

        _closeSocket: function(server){
            if(server){
                server.close();
            }else{
                for(var i=0; i<this.webSockets.length; i++){
                    this.webSockets[i].close();
                }

                this.webSockets = [];
            }
            
            this._clearBufferQrCode();
        },

        _showQrCode: function(keep){            	
        	var payQr = $(this.domNode).find(".payQr");
            var wechatQr = payQr.find(".WeChatDiv").removeClass('active');
            var alipayQr = payQr.find(".AlipayDiv").removeClass('active');
            var balanceQr = payQr.find('.BalanceDiv').removeClass('active');
            
            if($(this.domNode).height() <= 250){
                payQr.css('margin-bottom', '25px');
            }
            
            if(this.payType == 'WeChat'){
                payQr.css('width', '150px');
            	wechatQr.addClass('active');
                
                if(!keep){
                    wechatQr.empty();
                    QRcode.init(wechatQr, {width: 150, height: 150, text: this.WechatQrcode});
                }
                
            }else if(this.payType == 'Alipay'){
                payQr.css('width', '150px');
            	alipayQr.addClass('active');
            	
                if(!keep){
                    alipayQr.empty();
                    QRcode.init(alipayQr, {width: 150, height: 150, text: this.AlipayQrcode});
                }
            }else if(this.payType == 'Balance'){
                payQr.css('width', '80%');
                balanceQr.addClass('active');
                
                balanceQr.find('.balanceVal').html('￥' + this.BalanceQrCode.balance);
                balanceQr.find('.payVal').html('￥' + this.BalanceQrCode.payAmount);
                
                //should no using show mehtod. pay component may still unvisible right now.
                balanceQr.find('.balancePay').css('display', 'block');
                
                balanceQr.find('.payPwd').keydown(lang.hitch(this, function(event){
                    if(event.which == 13){
                        balanceQr.find('button').click();
                        
                        event.stopPropagation();
                        return false;
                    }
                }));
                
                balanceQr.find('button').unbind().click(lang.hitch(this, function(){
                    this._balanceDebit();
                }));
            }
        },
        
        _balanceDebit: function(){
            var pwd = $(this.domNode).find('.BalanceDiv .payPwd').val().trim();
            if(pwd.length == 0){
                base.error('错误', '请输入登陆密码');
                return;
            }
            
            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/user/normal/balanceDebit',
                data: {
                    lgTp: this.data.lgTp,
                    id: this.BalanceQrCode.id,
                    pwd: pwd
                }
            }).success(lang.hitch(this, function(ret){
                topic.publish('component/userAccount/widget/accountInfo/afterWithdraw', {dec: ret.data.amount});
            }));
        },

        _initDom: function(){
            $(this.domNode).find('.wechat').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    this.payType = 'WeChat';
                    
                    if(this.WechatQrcode){
                        this._showQrCode(true);
                    } else {
                        this._pay();
                    }
                }
            }));

            $(this.domNode).find('.alipay').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    this.payType = 'Alipay';
                    
                    if(this.AlipayQrcode){
                        this._showQrCode(true);
                    } else {
                        this._pay();
                    }
                }
            }));
            
            $(this.domNode).find('.balance').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    this.payType = 'Balance';
                    
                    if(this.BalanceQrCode){
                        this._showQrCode(true);
                    } else {
                        this._pay();
                    }
                }
            }));
            
            this._selectPayTypeNode('Balance');
        },
        
        _selectPayTypeNode: function(payTP){
            $(this.domNode).find('.btn-group label.active').removeClass('active');
            $(this.domNode).find('.btn-group input').prop('checked', false);
            
            var node;
            if(payTP == "Alipay"){
                node = $(this.domNode).find('.alipay');
                
            }else if(payTP == "WeChat"){
                node = $(this.domNode).find('.wechat');
                
            }else if(payTP == "Balance"){
                node = $(this.domNode).find('.balance');
            }
            
            if(node){
                node.prop('checked', true);
                node.parent().addClass('active');
                
                this.payType = payTP;
            }
        },

        _finished: function(result){
            topic.publish('common/widget/pay/finished', result);
        },

        _initEvents: function(){
        }
    })
});
