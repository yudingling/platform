
define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "../metaPlugin/metaPlugin",
    "root/spin/Spin",
    "root/websocket/sockjs-0.3.min",
    "root/websocket/reconnecting-websocket",
    "root/lvbPlayer/aliPlayer/AliPlayer",
    "dojo/text!./template/camera.html",
    "tool/css!./css/btn.css",
    "tool/css!./css/camera.css"
], function(
        base,
        declare,
        lang,
        topic,
        metaPlugin,
        Spin,
        sockjs,
        ReconnectingWebSocket,
        LvbPlayer,
        template){
    
    return declare("common.widget.sysMetas.camera", [metaPlugin], {
        baseClass: "common_widget_sysMetas_camera",
        templateString: template,
        
        authApi: {
            'metaCommand_xyz': '/platformApi/own/command/moveXYZ',
            'metaCommand_ss': '/platformApi/own/command/stopStart',
        },
        
        /**
         * all required options defined in 'metaPlugin.baseOptions' and 'this.options' should be provided in args of constructor.
         *   like 'metaPlugin.baseOptions', 'options' also a reference type, we need to mix its value to the instance in the constructor.
         */
        options: {
            dataUrl: 'platformApi/own/series/videoData'
        },
        
        constructor: function (args) {
            declare.safeMixin(this, this.options);
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.resizeBind = lang.hitch(this, function(){
                this._resizeManual();
            });
            $(window).resize(this.resizeBind);
            
            this._createWebSocket();
            
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            this._setCmdVisible();
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            this._destroyPlayer();
            this._closeSocket();
            
        	if(this.resizeBind){
        		$(window).unbind('resize', this.resizeBind);
        	}
        },
        
        refresh: function(args){
            this.inherited(arguments);
            
            declare.safeMixin(this, args);
            
            this._setData();
        },
        
        _setCmdVisible: function(){
            if(Boolean($(this.domNode).find('.cmd').attr('bindAuthResult'))){
                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/own/client/normal/base',
                    data: {
                        clientId: this.clientId
                    }
                }).success(lang.hitch(this, function(ret){
                    if(base.getUid() != ret.data.c_OWNER_UID){
                        $(this.domNode).removeClass('showCmd');
                    }

                })).fail(lang.hitch(this, function(ret){
                    $(this.domNode).removeClass('showCmd');
                }));
                
            }else{
                $(this.domNode).removeClass('showCmd');
            }
        },
        
        _initDom: function(){
            if(this.size == 'small'){
                $(this.domNode).addClass('mined');
                $(this.domNode).find('.slideBtn').click(lang.hitch(this, function(){
                    $(this.domNode).toggleClass('opened');
                }));
            }
            
            $(this.domNode).find('.cmd>div:not(.'+ this.size +')').hide();
            $(this.domNode).find('.cmd>div.'+ this.size).show();
            
            $(this.domNode).find('.cmd .direction .switch input').change(lang.hitch(this, function(e){
                var node = $(e.currentTarget);
                if(node.is(':checked')){
                    this._createDirectionCmd(node);
                }
            }));
            
            $(this.domNode).find('.cmd .zoom>div').click(lang.hitch(this, function(e){
                var node = $(e.currentTarget);
                node.addClass('clicked');
                this._createZoomCmd(node);
            }));
            
            $(this.domNode).find('.cmd .stopstart>div').click(lang.hitch(this, function(e){
                var node = $(e.currentTarget);
                node.addClass('clicked');
                this._createStopStartCmd(node);
            }));
            
            this._setTitle(false);
        },
        
        _createDirectionCmd: function(node){
            var data = this._getCmdData(node.parent());
            
            if(!data){
                node.prop('checked', false);
                return;
            }

            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/command/moveXYZ',
                data: data
            }).success(lang.hitch(this, function(ret){
                node.prop('checked', false);

            })).fail(lang.hitch(this, function(ret){
                node.prop('checked', false);
            }));
        },
        
        _createZoomCmd: function(node){
            var data = this._getCmdData(node);
            
            if(!data){
                node.removeClass('clicked');
                return;
            }

            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/command/moveXYZ',
                data: data
            }).success(lang.hitch(this, function(ret){
                node.removeClass('clicked');

            })).fail(lang.hitch(this, function(ret){
                node.removeClass('clicked');
            }));
        },
        
        _createStopStartCmd: function(node){
            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/command/stopStart',
                data: {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    metaCId: this.metaCId,
                    status: parseInt(node.attr('data'))
                }
            }).success(lang.hitch(this, function(ret){
                node.removeClass('clicked');

            })).fail(lang.hitch(this, function(ret){
                node.removeClass('clicked');
            }));
        },
        
        _getCmdData: function(cmdNode){
            var vals = cmdNode.attr('data').split(',');
            
            if(vals.length >= 3){
                return {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    metaCId: this.metaCId,
                    x: parseInt(vals[0]), 
                    y: parseInt(vals[1]), 
                    z: parseInt(vals[2])
                };
            }else{
                base.info("轴的改变度错误");
                return null;
            }
        },
        
        _createWebSocket: function () {
        	var id = 'ws_video_' + this.clientId + '-' + this.metaCId;
        	
            var serverNM = base.getServerNM('platform');
            var pathWebSocket = serverNM.replace("http", "ws") + 'platformWs/queue/camera/websocket.ws?id=' + id;
            var pathSockJS = serverNM + 'platformWs/queue/camera/sockjs.ws?id=' + id;
            
            this.server = null;
            if ("WebSocket" in window) {
                this.server = new ReconnectingWebSocket(pathWebSocket, null, {debug: false, reconnectInterval: 3000});
            } else if ("MozWebSocket" in window) {
                this.server = new MozWebSocket(pathWebSocket);
            } else {
                this.server = new SockJS(pathSockJS);
            }
            
            this.server.onopen = lang.hitch(this, function (e) {
                this.hasBeenConnected = true;
            });

            this.server.onerror = lang.hitch(this, function (e) {
                //if the web socket connect failed at the first time, it will reconnect automatically. otherwise you need to reconnect manually.
                if(!this.hasBeenConnected){
                    this._reConnectSocket();
                }
            });
            
            this.server.onclose = lang.hitch(this, function (e) {
                this._closeSocket();
            });

            this.server.onmessage = lang.hitch(this, function (e) {
                this._setData();
            });
        },
        
        _closeSocket: function () {
            if(this.server){
                this.server.close();
                this.server = null;
            }
        },
        
        _reConnectSocket: function(){
            this._clearRWSTimeout();
            this._closeSocket();
            
            this.reCWS = setTimeout(lang.hitch(this, function(){
                this._createWebSocket();
                
            }), 3000);
        },
        
        _clearRWSTimeout: function(){
            if(this.reCWS){
        		clearTimeout(this.reCWS);
                this.reCWS = null;
        	}
        },
        
        _refreshVideo: function(data){
            var videoNode = $(this.domNode).find('.video');
            var offlineNode = videoNode.find('.offline');
            var playerNode = videoNode.find('.player');
            
            if(data.url){
                offlineNode.hide();
                playerNode.show();
                
                this._createPlayer(playerNode, data);
                
                this._setTitle();
                
            }else{
                
                playerNode.hide();
                offlineNode.show();
                
                this._setTitle(true);
            }
        },
        
        _setTitle: function(offline){
            var str = this.metaNm? this.metaNm : this.metaCid;
            if(offline){
                str += '：视频流已断开'
            }
            $(this.domNode).find('.video>span').html(str);
        },
        
        _createPlayer: function(playerNode, data){
            this._destroyPlayer();
            
            this.player = new LvbPlayer(
                playerNode, 
                data.url.url, 
                data.url.mobileUrl, 
                data.screenshot);
        },
        
        _destroyPlayer: function(){
            if(this.player){
                this.player.destroy();
                this.player = null;
            }
        },
        
        _resizeManual: function(){
        },
        
        _setData: function(){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + this.dataUrl,
                data: {
                    clientId: this.clientId,
                    metaCId: this.metaCId
                }
            }).success(lang.hitch(this, function(ret){
                this._refreshVideo(ret.data);
            }));
        },
        
        _initEvents: function () {
        }
    });
});
