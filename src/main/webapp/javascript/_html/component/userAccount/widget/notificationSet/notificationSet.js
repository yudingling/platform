
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "./widget/pushUserSelector/pushUserSelector",
    "./widget/pushUserMgr/pushUserMgr",
    "dojo/text!./template/notificationSet.html",
    "tool/css!./css/notificationSet.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        PushUserSelector,
        PushUserMgr,
        template){
    
    return declare("component.userAccount.widget.notificationSet", [_Widget], {
        baseClass: "component_userAccount_widget_ntfSet",
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
            
            this._setData();
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            var parent = $(this.domNode).find('.panel-group .autoPush>.panel-body>div:last-child');
            
            this.smsSelector = new PushUserSelector({selTitle: '短信', selType: 'msg'});
            parent.append($(this.smsSelector.domNode));
            this.smsSelector.startup();
            this.own(this.smsSelector);
            
            this.emailSelector = new PushUserSelector({selTitle: '邮件', selType: 'email'});
            parent.append($(this.emailSelector.domNode));
            this.emailSelector.startup();
            this.own(this.emailSelector);
            
            var pushUserMgr = new PushUserMgr();
            $(this.domNode).find('.panel-group .pushUserMgr>.panel-body').append($(pushUserMgr.domNode));
            pushUserMgr.startup();
            this.own(pushUserMgr);
            
            $(this.domNode).find('.autoPush input').change(lang.hitch(this, function(e){
                var chk = $(e.currentTarget);
                this._saveData('iotWarn', chk.attr('data'), chk.is(':checked'));
            }));
            
            $(this.domNode).find('.remindPush input').change(lang.hitch(this, function(e){
                var chk = $(e.currentTarget);
                this._saveData('remind', chk.attr('data'), chk.is(':checked'));
            }));
            
            $(this.domNode).find('.panel-group>.panel>.panel-collapse').on('hide.bs.collapse', lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/notificationSet/hide');
            }));
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/pushSetting'
            }).success(lang.hitch(this, function(ret){
                var data = ret.data;
                
                var iotWarnParent = $(this.domNode).find('.autoPush');
                var remindParent = $(this.domNode).find('.remindPush');
                
                for(var i=0; i<data.length; i++){
                    if(data[i].catalog == 'iotWarn'){
                        iotWarnParent.find('input[data="'+ data[i].level +'"]').prop('checked', Boolean(data[i].enabled));
                        
                    }else if(data[i].catalog == 'remind'){
                        remindParent.find('input[data="'+ data[i].level +'"]').prop('checked', Boolean(data[i].enabled));
                    }
                }
                
                this._setAutoPushEnabled();
            }));
        },
        
        _saveData: function(catalog, level, enabled){
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/user/normal/pushSetting',
                data: {
                    catalog: catalog,
                    level: parseInt(level),
                    enabled: enabled
                }
            }).success(lang.hitch(this, function(ret){
                if(catalog == 'iotWarn'){
                    this._setAutoPushEnabled();
                }
            }));
        },
        
        _setAutoPushEnabled: function(){
            var chkNodes = $(this.domNode).find('.autoPush input:checked');
            var selectorEnabled = chkNodes && chkNodes.length > 0;

            this.smsSelector.enable(selectorEnabled);
            this.emailSelector.enable(selectorEnabled);
        },
        
        _initEvents: function(){
        }
    });
});
