define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/appBind.html",
    "tool/css!./css/appBind.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             CustomScrollBar,
             template) {

    return declare("main.mobile.appBind", [_Widget], {
        baseClass: "main_mobile_appBind",
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

            this._getAppBindUserList();
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode));
            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {        
        	$(this.domNode).find(".bindUser").click(lang.hitch(this, function(){
        		$(this.domNode).find(".bindForm").modal("show");
        	}));   
        	
        	$(this.domNode).find(".bindSure").click(lang.hitch(this, function(){
        		var uid = $(this.domNode).find(".uid").val();
        		var pwd = $(this.domNode).find(".pwd").val();
                
                if(uid.length == 0){
                    base.error('错误', '用户名不能为空');
                    return;
                }
                
                if(pwd.length == 0){
                    base.error('错误', '密码不能为空');
                    return;
                }
        		
        		this._addAppBind(uid, pwd);        		
        	}));
        },

        _getAppBindUserList: function () {
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/mobile/appBindInfo'
            }).success(lang.hitch(this, function (ret) {
                this._createOpenItems(ret.data);
            }));
        },

        _addAppBind: function (uid, pwd) {
            base.ajax({
                type: 'POST',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/user/normal/mobile/appBindInfo',
                data: {
                    uid: uid,
                    pwd: pwd
                }
            }).success(lang.hitch(this, function () {
                $(this.domNode).find(".bindForm").modal("hide");
                
                $(this.domNode).find('table tr td:first-child').empty();
                $(this.domNode).find('table tr a').show();
                
                this._createOpenItems([{u_ID: uid, ab_WECHAT_CUR: 1}]);
            }));
        },

        _setCurrentAppBind: function (uid, tr) {
            base.ajax({
                type: 'PUT',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/user/normal/mobile/appBindInfo',
                data: {
                    uid: uid
                }
            }).success(lang.hitch(this, function () {
            	
                $(this.domNode).find('table tr td:first-child').empty();
                $(this.domNode).find('table tr a').show();
                
                tr.find('td:first-child').append($('<i class="fa fa-circle"></i>'));
                tr.find('a').hide();
            }));
        },

        _createOpenItems: function (dataList) {
            var parent = $(this.domNode).find('table');
            var list = [];

            for(var i = 0; i < dataList.length; i++){
                list.push(this._createItem(dataList[i].u_ID, dataList[i].ab_WECHAT_CUR));
            }
            parent.append(list);
        },

        _createItem: function (u_ID, cur) {
            var isCur = parseInt(cur) == 1;
            
            var item = $('<tr><td>'+ (isCur? '<i class="fa fa-circle"></i>' : '') + '</td><td>' + u_ID + '</td><td><a>设为当前账号</a></td></tr>');
            
            var a = item.find("a");
            
            if(isCur){
                a.hide();
            }else{
                a.show();
            }
            
            a.click(lang.hitch(this, function (e) {
                this._setCurrentAppBind(u_ID, item);
            }));

            return item;
        },

        _initEvents: function () {
        }
    });
});