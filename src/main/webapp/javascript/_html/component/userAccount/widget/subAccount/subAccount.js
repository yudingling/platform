
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "./widget/roleMgr/roleMgr",
    "./widget/userMgr/userMgr",
    "dojo/text!./template/subAccount.html",
    "tool/css!./css/subAccount.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        RoleMgr,
        UserMgr,
        template){
    
    return declare("component.userAccount.widget.subAccount", [_Widget], {
        baseClass: "component_userAccount_widget_subAccount",
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
            var roleMgr = new RoleMgr();
            $(this.domNode).find('.panel-group .roleMgr>.panel-body').append($(roleMgr.domNode));
            roleMgr.startup();
            this.own(roleMgr);
            
            var userMgr = new UserMgr();
            $(this.domNode).find('.panel-group .userMgr>.panel-body').append($(userMgr.domNode));
            userMgr.startup();
            this.own(userMgr);
            
            $(this.domNode).find('.panel-group>.panel>.panel-collapse').on('hide.bs.collapse', lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/subAccount/hide');
            }));
        },
        
        _initEvents: function(){
        }
    });
});
