
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/panel/Panel",
    "tool/validator",
    "./widget/accountAdder/accountAdder",
    "dojo/text!./template/withdraw.html",
    "tool/css!./css/withdraw.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Panel,
        Validator,
        AccountAdder,
        template){
    
    return declare("component.userAccount.widget.accountInfo.widget.withdraw", [_Widget], {
        baseClass: "component_userAccount_widget_accountInfo_withdraw",
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
            
            this._setHistoryData();
            
            this._setAccountList();
        },
        
        destroy: function(){
            //accountAdder contains jqxGrid, need to be destroyed before parent.destroy being called
            this._destryWdAppender();
            
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            $(this.domNode).find('input[name="wdType"]').change(lang.hitch(this, function (e) {
                if($(e.currentTarget).is(':checked')){
                    this._wdTypeChange(parseInt($(e.currentTarget).attr('data')));
                }
            }));
            
            $(this.domNode).find('select.wdAccountId').change(lang.hitch(this, function(e){
                var sel = $(e.currentTarget).find('option:selected');
                this._wdAccountChange(sel && sel.length > 0 ? sel.data('info') : null);
            }));
            
            //withdraw history
            var curPageNode = $(this.domNode).find('.wdPage>.currentPage');
            
            curPageNode.keydown(lang.hitch(this, function (event) {
                if (event.which == 13) {
                    this._setHistoryData();
                }
            }));
            
             $(this.domNode).find('.wdPage>i.fa-arrow-right').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var cur = parseInt(curPageNode.val());
                    if (cur < this.totalPage) {
                        curPageNode.val(cur + 1);
                        this._setHistoryData();
                    }
                }
            }));

            $(this.domNode).find('.wdPage>i.fa-arrow-left').click(lang.hitch(this, function (event) {
                if (!base.isNull(this.totalPage)) {
                    var cur = parseInt(curPageNode.val());
                    if (cur > 1) {
                        curPageNode.val(cur - 1);
                        this._setHistoryData();
                    }
                }
            }));
        },
        
        _destryWdAppender: function(){
            if(this.wdAppender){
                this.wdAppender.destroyRecursive();
                this.wdAppender = null;
                
                this.wdPanel.destroy();
                this.wdPanel = null;
            }
        },
        
        _selectWdTypeNode: function(wdTP){
            $(this.domNode).find('.btn-group label.active').removeClass('active');
            $(this.domNode).find('.btn-group input').prop('checked', false);
            
            var cur = $(this.domNode).find('.btn-group input[data="' + wdTP + '"]').prop('checked', true);
            cur.parent().addClass('active');
            
            cur.change();
        },
        
        _wdTypeChange: function(wdType){
            var wdAccountSel = $(this.domNode).find('select.wdAccountId').empty().change();
            
            this.wdType = wdType;
            
            var opts = [$('<option selected>--选择账户--</option>')];
            
            if(this.accountList){
                for(var i=0; i<this.accountList.length; i++){
                    if(this.accountList[i].wda_TP == this.wdType){
                        var optNM;
                        if(this.wdType == 0){
                            optNM = this.accountList[i].wda_ANM;
                        }else{
                            optNM = this.accountList[i].wda_AID;
                        }
                        
                        opts.push($('<option>' + optNM + '</option>').data('info', this.accountList[i]));
                    }
                }
            }
            
            wdAccountSel.append(opts);
            
            var placeholder = '>0';
            if(wdType == 0){
                placeholder = '>=1';
            }else if(wdType == 1){
                placeholder = '>=0.1';
            }
            $(this.domNode).find('.wdAmount').attr('placeholder', placeholder);
        },
        
        _wdAccountChange: function(accountRec){
            if(accountRec){
                $(this.domNode).find('.wdAccountNm').text(accountRec.wda_ANM);
                $(this.domNode).find('button.doWithdraw').removeAttr('disabled').removeClass('disabled').unbind('click').click(lang.hitch(this, function(){
                    this._doWithdraw(accountRec);
                }));
                
            }else{
                $(this.domNode).find('.wdAccountNm').text('');
                $(this.domNode).find('button.doWithdraw').attr('disabled',  'disabled').addClass('disabled');
            }
            
            $(this.domNode).find('.wdAmount').val(null);
            $(this.domNode).find('.wdPwd').val(null);
        },
        
        _doWithdraw: function(accountRec){
            var amount = $(this.domNode).find('.wdAmount').val();
            var pwd = $(this.domNode).find('.wdPwd').val();
            
            if(!Validator.isDouble(amount) || parseFloat(amount) <= 0){
                base.error('错误', '金额输入错误');
                return;
            }
            amount = parseFloat(amount);
            
            if(accountRec.wda_TP == 0 && amount < 1){
                base.error('错误', '金额输入错误, 微信提现最低额度1元');
                return;
            }
            if(accountRec.wda_TP == 1 && amount < 0.1){
                base.error('错误', '金额输入错误, 支付宝提现最低额度0.1元');
                return;
            }
            
            if(pwd.length == 0){
                base.error('错误', '密码不能为空');
                return;
            }
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/withdraw',
                type: 'POST',
                hintOnSuccess: true,
                data: {
                    wdaId: accountRec.wda_ID,
                    amount: parseFloat(amount),
                    pwd: pwd
                }
            }).success(lang.hitch(this, function (ret) {
                $(this.domNode).find('.wdPage>.currentPage').val(1);
                
                this._setHistoryData();
                
                topic.publish('component/userAccount/widget/accountInfo/afterWithdraw', {dec: amount});
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
        
        _setHistoryData: function(){
            var pageSize = 5;

            var curPageNode = $(this.domNode).find('.wdPage>.currentPage');
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
                url: base.getServerNM() + 'platformApi/own/user/normal/withdraw',
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
                $(this.domNode).find('.wdPage>.totalPage').html(this.totalPage);
                if(this.totalPage == 0){
                    curPageNode.val(0);
                }

            })).fail(lang.hitch(this, function (ret) {
                $(this.domNode).find('.wdPage>.currentPage').val('0');
                $(this.domNode).find('.wdPage>.totalPage').val('0');

                billTable.children().remove();
                billTable.append('<tr class="empty"><td>获取数据失败!</td></tr>');
            }));
        },
        
        _createItem: function(i, parent, data){
            var item = i >= 0 ? parent.find('tr:nth-child(' + (i + 1) + ')') : null;

            if (!item || item.length == 0) {
                if(i == 0){
                    item = $('<tr class="h"><th style="width: 200px">时间</th><th>账户类型</th><th>账户ID</th><th>姓名</th><th>金额(元)</th><th>状态</th></tr>');
                    parent.append(item);
                    return;
                    
                }else{
                    item = $('<tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>');
                    parent.append(item);
                }
            }else if(i == 0){
                return;
            }
            
            item.children('td:nth-child(1)').text((new Date(data.crt_TS)).format('yyyy-MM-dd HH:mm'));
            item.children('td:nth-child(2)').text(this._getWDTypeName(data.wda_TP));
            item.children('td:nth-child(3)').text(data.wda_AID);
            item.children('td:nth-child(4)').text(data.wda_ANM);
            item.children('td:nth-child(5)').text(data.wd_AMOUNT);
            item.children('td:nth-child(6)').text(this._getWDStatusName(data.wd_STATUS));
        },
        
        _getWDTypeName: function(wdaTP){
            switch(wdaTP){
                case 0:
                    return '微信';
                case 1:
                    return '支付宝';
                default:
                    return '[未知]';
            }
        },
        
        _getWDStatusName: function(wdStatus){
            switch(wdStatus){
                case 0:
                    return '转账中';
                case 1:
                    return '成功';
                case 2:
                    return '失败';
                default:
                    return '[未定义]'
            }
        },
        
        _setAccountList: function(){
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/user/normal/withdrawAccount'
            }).success(lang.hitch(this, function(ret){
                this.accountList = ret.data;
                
                this._selectWdTypeNode(0);
                
                $(this.domNode).find('.appendWd').click(lang.hitch(this, function(){
                    this._destryWdAppender();

                    this.wdAppender = new AccountAdder({accountList: this.accountList});

                    this.wdPanel = new Panel(
                        $(this.domNode),
                        $(this.wdAppender.domNode),
                        '账户维护'
                    );

                    this.wdAppender.startup();

                    this.wdPanel.show({width: '80%', right: '10%', top: '70px'});
                }));
            }));
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/accountInfo/widget/withdraw/accountChange', lang.hitch(this, function(data){
                this.accountList = data;
                
                this._selectWdTypeNode(this.wdType);
            }));
            
            this.own(sub1);
        }
    });
});
