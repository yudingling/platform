define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "common/widget/zTree/zTree",
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/treeView.html",
    "tool/css!./css/treeView.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             Spin,
             ZTree,
             CustomScrollBar,
             template) {

    return declare("main.mobile.deviceInfo.treeView", [_Widget], {
        baseClass: "main_mobile_deviceInfo_treeView",
        templateString: template,

        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.searchTxt = '';
            
            this._initEvents();
        },

        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },

        startup: function () {
            this.inherited(arguments);

            this.defer(lang.hitch(this, function () {
                CustomScrollBar.init($(this.domNode));
                this._createTree();
                
            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);
        },

        search: function (searchTxt) {
            this.searchTxt = searchTxt;
            this._createTree();
        },


        _initDom: function () {
        },

        _createTree: function () {
            if (this.myTree) {
                this.myTree.destroyRecursive();
                this.myTree = null;
            }
            
            this.myTree = new ZTree({
                treeObj: $(this.domNode).find('ul.treeUl'),
                urlOrData: base.getServerNM() + "platformApi/own/client/normal/clientTree?search=" + this.searchTxt,
                groupSelect: false,
                maxTitleAsciiLen: parseInt(($(this.domNode).width() - 20) / 7),
                render: null,
                click: lang.hitch(this, function (treeNode) {
                    topic.publish("main/mobile/deviceInfo/widget/detailInfo", treeNode.dId);
                })
            });

            this.myTree.startup();
            this.own(this.myTree);
        },

        _initEvents: function () {
        }
    });
});
