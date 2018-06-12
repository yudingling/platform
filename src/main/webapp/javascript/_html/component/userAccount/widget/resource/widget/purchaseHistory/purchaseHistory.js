
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/purchaseHistory.html",
    "tool/css!./css/purchaseHistory.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.userAccount.widget.resource.widget.purchaseHistory", [_Widget], {
        baseClass: "component_userAccount_widget_resource_purchaseHistory",
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
            var curPageNode = $(this.domNode).find('.billPage>.currentPage');
            
            curPageNode.keydown(lang.hitch(this, function (event) {
                if (event.which == 13) {
                    this._setData();
                }
            }));
            
             $(this.domNode).find('.billPage>i.fa-arrow-right').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var cur = parseInt(curPageNode.val());
                    if (cur < this.totalPage) {
                        curPageNode.val(cur + 1);
                        this._setData();
                    }
                }
            }));

            $(this.domNode).find('.billPage>i.fa-arrow-left').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var cur = parseInt(curPageNode.val());
                    if (cur > 1) {
                        curPageNode.val(cur - 1);
                        this._setData();
                    }
                }
            }));
        },
        
        //to reduce twinkle, we use replace instead of remove old item
        _clear: function (node, newCount) {
            node.find('tr.empty').remove();
            
            var children = node.find('tr');
            if (base.isNull(newCount) || newCount == 0) {
                children.remove();
            } else if (children.length > newCount) {
                for (var i = newCount; i < children.length; i++) {
                    $(children[i]).remove();
                }
            }
        },
        
        _setData: function(){
            var pageSize = 10;

            var curPageNode = $(this.domNode).find('.billPage>.currentPage');
            var curPage = parseInt(curPageNode.val());
            if (isNaN(curPage) || curPage < 1) {
                curPage = 1;
                curPageNode.val(curPage);
            }
            if (!base.isNull(this.totalPage) && this.totalPage > 0) {
                if (curPage > this.totalPage) {
                    curPage = this.totalPage;
                    curPageNode.val(this.totalPage);
                }
            }

            var billTable = $(this.domNode).find('table');

            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/recharge',
                data: {
                    start: (curPage - 1) * pageSize,
                    length: pageSize
                }
            }).success(lang.hitch(this, function (ret) {
                var data = ret.data[1];

                this._clear(billTable, data.length);

                if (data.length > 0) {
                    this._createItem(0, billTable);
                    
                    for (var i = 0; i < data.length; i++) {
                        this._createItem(i+1, billTable, data[i]);
                    }
                } else {
                    billTable.append('<tr class="empty"><td>暂无记录!</td></tr>');
                }

                this.totalPage = Math.ceil(parseInt(ret.data[0]) / pageSize);
                $(this.domNode).find('.billPage>.totalPage').html(this.totalPage);
                if(this.totalPage == 0){
                    curPageNode.val(0);
                }

            })).fail(lang.hitch(this, function (ret) {
                $(this.domNode).find('.billPage>.currentPage').val('0');
                $(this.domNode).find('.billPage>.totalPage').val('0');

                billTable.children().remove();
                billTable.append('<tr class="empty"><td>获取数据失败!</td></tr>');
            }));
        },
        
        _createItem: function(i, parent, data){
            var item = i >= 0 ? parent.find('tr:nth-child(' + (i + 1) + ')') : null;

            if (!item || item.length == 0) {
                if(i == 0){
                    item = $('<tr class="h"><th style="width: 200px">时间</th><th>资源</th><th>购买数量</th><th>金额(元)</th></tr>');
                    parent.append(item);
                    return;
                    
                }else{
                    item = $('<tr><td></td><td></td><td></td><td></td></tr>');
                    parent.append(item);
                }
            }else if(i == 0){
                return;
            }
            
            item.children('td:nth-child(1)').html((new Date(data.crt_TS)).format('yyyy-MM-dd HH:mm'));
            item.children('td:nth-child(2)').html(this._getResourceName(data.rc_TYPE));
            item.children('td:nth-child(3)').html(this._getAmountString(data));
            item.children('td:nth-child(4)').html(data.rc_FEE);
        },
        
        _getAmountString: function(data){
            if(data.rc_TYPE == 2 && data.extendObj){
                var video = data.extendObj;
                return video.rcv_NUM + '个视频，' + (new Date(video.rcv_END_TS)).format("yyyy-MM-dd") + ' 到期';
                
            }else{
                return data.rc_AMOUNT;
            }
        },
        
        _getResourceName: function(resType){
            switch(resType){
                case 0:
                    return '短信';
                case 1:
                    return '图片存储空间';
                case 2:
                    return '视频流';
                default:
                    return null;
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/resource/hide', lang.hitch(this, function(data){
            }));
            var sub2 = topic.subscribe('component/userAccount/widget/resource/changed', lang.hitch(this, function(data){
                this._setData();
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
