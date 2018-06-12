define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "common/widget/deviceActionTree/deviceActionTree",
    "dojo/text!./template/myDevice.html",
    "tool/css!./css/myDevice.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             DeviceActionTree,
             template) {

    return declare("main.mobile.dataMonitor.myDevice", [_Widget], {
        baseClass: "main_mobile_dataMonitor_myDevice",
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

        destroy: function () {
            this.inherited(arguments);
        },

        _initDom: function () {
            this.tree = new DeviceActionTree({
                groupSelect: false,
                needNodeData: true,
                maxTitleAsciiLen: parseInt((this.parentWidth - 20) / 7)
            });
            $(this.domNode).find('.list').append($(this.tree.domNode));
            this.tree.startup();
            this.own(this.tree);
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('main/mobile/dataMonitor/commonDetail/clearOuterSelect', lang.hitch(this, function(){
                if(this.tree){                	
                	this.tree.clearSelect();
                }
            }));

            this.own(sub1);
        }
    });
});
