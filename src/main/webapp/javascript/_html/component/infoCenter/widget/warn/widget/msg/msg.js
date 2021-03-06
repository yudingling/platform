define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "common/widget/zTree/zTree",
    'root/panel/Panel',
    'root/customScrollbar/CustomScrollBar',
    'root/bootstrap-tagsinput/tagsinput',
    "tool/validator",
    "dojo/text!./template/msg.html",
    "tool/css!./css/msg.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,  
             ZTree,
             Panel,
             CustomScrollBar,
             Tagsinput,
             validator,
             template) {

    return declare("component.infoCenter.widget.warn.msg", [_Widget], {
        baseClass: "component_infoCenter_widget_warn_msg",
        templateString: template,

        constructor: function (args) {
            declare.safeMixin(this, args);

            this._initEvent();
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
            var content = $(this.domNode).find(".content");
            content.val(this.wrn_DESC);
            
            Tagsinput.init({
                domNode: $(this.domNode).find(".contact"),
                valueField: 'value',
                textField: 'text',
                width: '370px',
                focusWidth: '15px',
                removed: lang.hitch(this, function(item){
                    if (item.node != null) {
                        this.contactsTree.checkNode(item.node, false, false);
                    }
                }),
                createItem: lang.hitch(this, function(text){
                    return {
                        text: text,
                        value: text,
                        id: null,
                        name: null,
                        node: null
                    };
                })
            });
            
            $(this.domNode).find('i.addContacts').click(lang.hitch(this, function () {
                this._initContactPanel("msg");

                if (this.contactsTree) {
                    this.panel.show({width: '280px', height: '350px', top: '0px', left: '90.5%'});
                }
            }));
        },

        _initContactPanel: function (pushType) {
            var containerIdOrObj = $(this.domNode).find('.form');
            var obj = $('<div class="msgTree" style="height:100%"><div class="treeContainer"></div></div>');
            this.panel = new Panel(containerIdOrObj, obj, "选择联系人");
            this.own(this.panel);

            CustomScrollBar.init(obj);

            var treeContainer = obj.find(".treeContainer");
            this.contactsTree = new ZTree({
                treeObj: treeContainer,
                urlOrData: base.getServerNM() + 'platformApi/own/warn/normal/pushUser?showCheck=true&pushType=' + pushType,
                expandFirst: false,
                render: null,
                maxTitleAsciiLen: 35,
                beforeClick: null
            });

            this.contactsTree.startup();
            this.own(this.contactsTree);
        },

        _addContacts: function (data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].type == 'client') {
                    var nodeData = data[i].nodeData;
                    var name = nodeData.pu_NM && nodeData.pu_NM.length > 0 ? ('(' + nodeData.pu_NM + ')') : '';
                    
                    Tagsinput.add({
                        domNode: $(this.domNode).find(".contact"),
                        data: [{
                            text: nodeData.pu_PHONE + name,
                            value: nodeData.pu_PHONE,
                            id: nodeData.pu_PHONE,
                            name: nodeData.pu_NM,
                            node: data[i]
                        }]
                    });
                }
            }
        },

        _deleteContacts: function (data) {
            for (var i = 0; i < data.length; i++) {
                if (data[i].type == 'client') {
                    var nodeData = data[i].nodeData;
                    var name = nodeData.pu_NM && nodeData.pu_NM.length > 0 ? ('(' + nodeData.pu_NM + ')') : '';
                    
                    Tagsinput.remove({
                        domNode: $(this.domNode).find(".contact"),
                        data: [{
                            text: nodeData.pu_PHONE + name,
                            value: nodeData.pu_PHONE,
                            id: nodeData.pu_PHONE,
                            name: nodeData.pu_NM,
                            node: data[i]
                        }]
                    }, true);
                }
            }
        },

        _checkMsg: function () {

            var msgNumbers = Tagsinput.items({domNode: $(this.domNode).find(".contact")});

            var msgContent = $(this.domNode).find(".content").val();

            if (base.isNull(msgNumbers) || msgNumbers.length == 0) {
                base.error("表单域未赋值","联系人不能为空!");
                return null;
            }

            if (base.isNull(msgContent) || msgContent.length == 0) {
                base.error("表单域未赋值","短信内容不能为空!");
                return null;
            }

            var addRMap = {};
            for (var i = 0; i < msgNumbers.length; i++) {
                var id = msgNumbers[i].id;

                if (id) {
                    if (!validator.isMobile(id)) {
                        base.error("电话格式错误","电话：" + id + " 格式错误！");
                        return null;
                    }

                    addRMap[msgNumbers[i].id] = msgNumbers[i].name;

                } else {
                    if (!validator.isMobile(msgNumbers[i].text)) {
                        base.error("电话格式错误","电话：" + msgNumbers[i].text + " 格式错误！");
                        return null;
                    }

                    addRMap[msgNumbers[i].text] = '';
                }
            }
            
            return {wrnId: this.wrn_ID, receivers: JSON.stringify(addRMap), content: msgContent};
        },


        _save: function () {
            var data = this._checkMsg();

            if (data) {

                base.ajax({
                    hintOnSuccess: true,
                    type: 'POST',
                    data: data,
                    url: base.getServerNM() + 'platformApi/own/warn/forward/sms'
                }).success(lang.hitch(this, function () {
                    topic.publish("component/infoCenter/widget/warn/sendSuccess");
                }))
            }
        },

        _initEvent: function () {
            var sub1 = topic.subscribe('component/infoCenter/widget/warn/forward', lang.hitch(this, function () {
                this._save();
            }));

            var sub2 = topic.subscribe('common/widget/ztree/check', lang.hitch(this, function (data) {
                this._addContacts(data);
            }));

            var sub3 = topic.subscribe('common/widget/ztree/unCheck', lang.hitch(this, function (data) {

                this._deleteContacts(data);
            }));

            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    })
});
