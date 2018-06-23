
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/jquery-pwstabs-1.4.0/PwsTabs",
    "dojo/text!./template/development.html",
    "tool/css!./css/development.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        PwsTabs,
        template){
    
    return declare("component.userAccount.widget.development", [_Widget], {
        baseClass: "component_userAccount_widget_development",
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
            
            this._setData_ssl();
            this._setData_key();
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            $(this.domNode).find('.sslDiv .wait').tooltip('destroy');
        },
        
        _initDom: function(){
            this.tabs = PwsTabs.init($(this.domNode).find('.tabs'), {
                effect: 'none'
            });
            
            $(this.domNode).find('.sslDiv .ca').click(lang.hitch(this, function(){
                window.location = base.getServerNM() + 'ca.crt';
            }));
            
            var keyDiv = $(this.domNode).find('.keyDiv');
            keyDiv.find('li.append>a').click(lang.hitch(this, function(e){
                this._addKey();
            }));
            
            keyDiv.find('li.delete>a').click(lang.hitch(this, function(e){
            	this._toggleDeleteStatus(true);
            }));
            
            keyDiv.find('li.cancel>a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        	}));
        	
        	keyDiv.find('li.ok>a').click(lang.hitch(this, function(){
        		this._deleteKey();
        	}));
        },
        
        _deleteKey: function(){
            var nodes = $(this.domNode).find('.keyDiv .keyContainer>div input:checked');
            if(nodes.length > 0){
                base.confirm('删除', '删除所选 key 将导致使用这些 key 的设备无法连接云端, 确认删除?', lang.hitch(this, function(){
                    var ids = [];
                    for(var i=0; i<nodes.length; i++){
                        ids.push($(nodes[i]).data('data').uck_ID);
                    }
                    
                    base.ajax({
                        type: 'DELETE',
                        url: base.getServerNM() + 'platformApi/own/user/normal/clientKey',
                        data: {
                            ids: JSON.stringify(ids)
                        }
                    }).success(lang.hitch(this, function(ret){
                        for(var i=0; i<nodes.length; i++){
                            $(nodes[i]).parent().parent().remove();
                        }
                        
                        this._toggleDeleteStatus(false);
                        
                    }));
                    
                }));
            
            }else{
                base.info('提示', '请选择要删除的 key');
            }
        },
        
        _addKey: function(){
            base.confirmSave('新增', '确定要新增 client key?', lang.hitch(this, function(){
                base.ajax({
                    type: 'POST',
                    url: base.getServerNM() + 'platformApi/own/user/normal/clientKey'
                }).success(lang.hitch(this, function(ret){
                    var data = ret.data;
                    if(data){
                        $(this.domNode).find('.keyDiv .keyContainer').append(this._createKeyDiv(data, false));
                    }
                }));
            }));
        },
        
        _toggleDeleteStatus: function(isDelete){
            var keyDiv = $(this.domNode).find('.keyDiv');
            
        	if(isDelete){
                if(keyDiv.find('.keyContainer>div').length > 0){
                    keyDiv.find('li.delete').hide();
                    keyDiv.find('li.append').hide();

                    keyDiv.find('li.ok').show();
                    keyDiv.find('li.cancel').show();

                    keyDiv.removeClass('hideCheck');
                }
                
        	}else{
        		keyDiv.find('li.ok').hide();
        		keyDiv.find('li.cancel').hide();
        		
        		keyDiv.find('li.delete').show();
        		keyDiv.find('li.append').show();
                
                keyDiv.find('input:checked').prop('checked', false);
                
                keyDiv.addClass('hideCheck');
        	}
        },
        
        _setData_ssl: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/self'
            }).success(lang.hitch(this, function(ret){
                var key = ret.data.self.u_SSL_KEY;
                var crt = ret.data.self.u_SSL_CRT;
                
                var keyDiv = $(this.domNode).find('.sslDiv .key');
                var crtDiv = $(this.domNode).find('.sslDiv .crt');
                
                if(!base.isNull(key)){
                    keyDiv.click(lang.hitch(this, function(){
                        window.location = base.getServerNM('file') + 'fileApi/own/ssl?fileId=' + key;
                    }));
                }else{
                    keyDiv.addClass('wait').tooltip({
                        container: 'body',
                        placement: 'auto bottom',
                        trigger: 'hover',
                        title: '审核中..'
                    });
                }
                
                if(!base.isNull(crt)){
                    crtDiv.click(lang.hitch(this, function(){
                        window.location = base.getServerNM('file') + 'fileApi/own/ssl?fileId=' + crt;
                    }));
                }else{
                    crtDiv.addClass('wait').tooltip({
                        container: 'body',
                        placement: 'auto bottom',
                        trigger: 'hover',
                        title: '审核中..'
                    });
                }
            }));
        },
        
        _setData_key: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/clientKey'
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                if(data && data.length > 0){
                    var keyContainer = $(this.domNode).find('.keyDiv .keyContainer');
                    
                    for(var i=0; i<data.length; i++){
                        keyContainer.append(this._createKeyDiv(data[i], true));
                    }
                }
            }));
        },
        
        _createKeyDiv: function(item, isHide){
            var keyDiv = $('<div><div class="checkbox checkbox-primary" style="display: inline-block;"><input class="styled" type="checkbox"><label></label></div><span></span><i class="fa fa-eye" title="查看"></i></div>');
            keyDiv.find('input').data('data', item);
            
            var hide = isHide;
            var label = keyDiv.find('span').text(this._getHideTxt(hide, item));
            keyDiv.find('i.fa').click(lang.hitch(this, function(){
                hide = !hide;
                label.text(this._getHideTxt(hide, item));
                
            }));
            
            return keyDiv;
        },
        
        _getHideTxt: function(hide, item){
            if(hide){
                return item.uck_KEY.substr(0, 5) + '***********' + item.uck_KEY.substr(27, 5);
            }else{
                return item.uck_KEY;
            }
        },
        
        _initEvents: function(){
        }
    });
});
