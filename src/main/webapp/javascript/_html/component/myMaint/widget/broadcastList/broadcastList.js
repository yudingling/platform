
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/customScrollbar/CustomScrollBar",
    "root/brandHref/BrandHref",
    "root/websocket/sockjs-0.3.min",
    "root/websocket/reconnecting-websocket",
    "dojo/text!./template/broadcastList.html",
    "tool/css!./css/broadcastList.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        BrandHref,
        sockjs,
        ReconnectingWebSocket,
        template){
    
    return declare("component.myMaint.broadcastList", [_Widget], {
        baseClass: "component_myMaint_broadcastList",
        templateString: template,
        
        constructor: function(args){
            declare.safeMixin(this, args);
            
            this.brandMap = {};
            this.itemMap = {};
            
            this._initEvents();
        },
        
        postCreate: function(){
            this.inherited(arguments);

            this._initDom();
        },
        
        startup: function(){
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode).children('.customScrollBar'));
                
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.listCC>div i.fa').tooltip('destroy');
            
            this._removeBrand();
            
            this._clearRWSTimeout();
            this._closeSocket();
        },
        
        _initDom: function(){
        },
        
        _createWebSocket: function(self){
            var id = self.ma_ID? self.ma_ID : self.owner_UID;
            
            var serverNM = base.getServerNM('platform');
            var pathWebSocket = serverNM.replace("http", "ws") + 'platformWs/topic/maint/websocket.ws?id=' + id;
            var pathSockJS = serverNM + 'platformWs/topic/maint/sockjs.ws?id=' + id;
            
            if("WebSocket" in window){
                this.server = new ReconnectingWebSocket(pathWebSocket, null, {debug: false, reconnectInterval: 3000});
            } else if("MozWebSocket" in window){
                this.server = new MozWebSocket(pathWebSocket);
            } else {
                this.server = new SockJS(pathSockJS);
            }
            
            this.server.onopen = lang.hitch(this, function(e){
                this.hasBeenConnected = true;
            });

            this.server.onerror = lang.hitch(this, function(e){
                //if the web socket connect failed at the first time, it will reconnect automatically. otherwise you need to reconnect manually.
                if(!this.hasBeenConnected){
                    this._reConnectSocket(self);
                }
            });
            
            this.server.onclose = lang.hitch(this, function(e){
                this._closeSocket();
            });

            this.server.onmessage = lang.hitch(this, function(e){
                if(!base.isNull(e.data)){
                    this._topicDone(base.evalJson(e.data));
                }
            });
        },
        
        _reConnectSocket: function(self){
            this._clearRWSTimeout();
            this._closeSocket();
            
            this.reCWS = setTimeout(lang.hitch(this, function(){
                this._createWebSocket(self);
                
            }), 3000);
        },
        
        _clearRWSTimeout: function(){
            if(this.reCWS){
        		clearTimeout(this.reCWS);
                this.reCWS = null;
        	}
        },
        
        _closeSocket: function(){
            if(this.server){
                this.server.close();
            }
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/myMaint/normal/maintRecord'
            }).success(lang.hitch(this, function(ret){
                var self = ret.data.self;
                var list = ret.data.list;
                
                this._createWebSocket(self);
                
                var parent = $(this.domNode).find('.listCC');
                var width = this._getParentWidth(parent);

                var objs = [];
                for(var i=0; i<list.length; i++){
                    objs.push(this._createItem(list[i], width));
                }

                parent.append(objs);
                
                this._checkEmpty();
            }));
        },
        
        _topicDone: function(data){
            if(data.maint_STATUS == 0){
                var add = false;
                var dists = data.dists, curUid = base.getUid();
                
                //if a maintenance record is distribute to user (not area), the area that the user belong to will receive the message.
                //   and we need to filter the other users in the topic from displaying the record.
                for(var i=0; i<dists.length; i++){
                    if(dists[i].mdist_MA_ID){
                        add = true;
                        break;
                    }
                    
                    if(dists[i].mdist_U_ID == curUid){
                        add = true;
                        break;
                    }
                }
                
                if(add){
                   this._newItem(data); 
                }
                
            }else{
                if(this._deleteItem(data)){
                    topic.publish('component/myMaint/deleted', data);
                }
            }
        },
        
        _checkEmpty: function(){
            var parent = $(this.domNode).find('.listCC');
            
            if(parent.children().length == 0){
                parent.append($('<div class="empty">暂无数据</div>'));
            }
        },
        
        _newItem: function(data){
            if(base.isNull(this.itemMap[data.maint_ID])){
                var parent = $(this.domNode).find('.listCC');
                parent.children('div.empty').remove();

                var first = parent.children('div:first-child');
                var obj = this._createItem(data, this._getParentWidth(parent)).hide();

                var brand = new BrandHref(obj);
                brand.setInfo('new', '#ceac7d');
                this.brandMap[data.maint_ID] = brand;

                if(first && first.length > 0){
                    first.before(obj);
                }else{
                    parent.append(obj);
                }

                obj.css('margin-top', -1 * obj.outerHeight() + 'px');
                this.defer(function(){
                    obj.show().css('margin-top', '0px');

                }, 100);
            }
        },
        
        _deleteItem: function(data){
            var item = this.itemMap[data.maint_ID];
            if(item){
                delete this.itemMap[data.maint_ID];
                
                //disable scroll to avoid scrollbar twinkle when it stay at bottom
                var scrollDom = $(this.domNode).children('.customScrollBar');
                CustomScrollBar.disable(scrollDom);
                
                item.css('opacity', '0').css('margin-top', -1 * item.outerHeight() + 'px').one('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                    item.find('i.fa').tooltip('destroy');
                    this._removeBrand(data);
                    
                    item.remove();
                    
                    CustomScrollBar.update(scrollDom);
                    
                    this._checkEmpty();
                }));
                
                return true;
                
            }else{
                return false;
            }
        },
        
        _createItem: function(data, width){
            var obj = $('<div><div class="desc"></div><div class="spanCC"><span class="crtTs pull-left"></span><i class="fa fa-flag pull-left" style="display: none" title="指定给当前用户"></i><span class="clients pull-right"></span></div></div>');
            
            obj.find('.desc').text(this._getDescText(data, width));
            obj.find('.crtTs').text(base.getTMDesc(data.crt_TS));
            obj.find('.clients').text(this._getClientsText(data, width));
            
            var isOwn = false;
            var dists = data.dists, curUid = base.getUid();
            for(var i=0; i<dists.length; i++){
                if(dists[i].mdist_U_ID == curUid){
                    isOwn = true;
                    break;
                }
            }
            
            if(isOwn){
                obj.find('i.fa').show().tooltip({
                    container: 'body',
                    placement: 'auto right',
                    trigger: 'hover'
                });
            }
            
            this.itemMap[data.maint_ID] = obj;
            
            obj.click(lang.hitch(this, function(){
                if(!obj.hasClass('actived')){
                    var old = obj.parent().children('.actived');
                    
                    old.css('transition-duration', '0s').removeClass('actived');
                    obj.css('transition-duration', '0s').addClass('actived');
                    
                    this._removeBrand(data);
                    
                    topic.publish('component/myMaint/selected', data);
                    
                    old.css('transition-duration', '0.3s');
                    obj.css('transition-duration', '0.3s');
                }
            }));
            
            return obj;
        },
        
        _getDescText: function(data, width){
            return base.subDescription(data.maint_DESC, width * 1.5 / 7);
        },
        
        _getClientsText: function(data, width){
            var str = '';
            if(data.clients && data.clients.length > 0){
                for(var i=0; i< data.clients.length; i++){
                    str += data.clients[i].c_NM + ',';
                }
                
                if(str.length > 0){
                    str = str.substr(0, str.length - 1);
                    return base.subDescription(str, width * 0.6 / 7);
                }
            }
            
            return str;
        },
        
        _getParentWidth: function(parent){
            var width = parent.width();
            if(width < 0){
                width = $(window).width() * 0.25;
            }
            
            return width;
        },
        
        _removeBrand: function(data){
            if(data){
                var brand = this.brandMap[data.maint_ID];
                if(brand){
                    brand.destroy();
                    delete this.brandMap[data.maint_ID];
                }
                
            }else{
                for(var key in this.brandMap){
                    this.brandMap[key].destroy();
                }
                this.brandMap = {};
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/myMaint/occupied', lang.hitch(this, function(data){
                this._deleteItem(data);
            }));
            
            this.own(sub1);
        }
    });
});
