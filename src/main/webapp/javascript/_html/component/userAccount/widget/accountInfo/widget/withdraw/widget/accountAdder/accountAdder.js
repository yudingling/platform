
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/jqwidgets/Jqx',
    "dojo/text!./template/accountAdder.html",
    "tool/css!./css/accountAdder.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Jqx,
        template){
    
    return declare("component.userAccount.widget.accountInfo.widget.withdraw.accountAdder", [_Widget], {
        baseClass: "component_userAccount_widget_accountInfo_withdraw_accAdder",
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
            
            this.resizeBind = lang.hitch(this, function(){
                $(this.domNode).find('.gridContainer').jqxGrid('refresh');
            });
            $(window).resize(this.resizeBind);
            
            this._setData();
        },
        
        destroy: function(){
            //jqxGrid need to be destroyed before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.gridContainer').jqxGrid('destroy');
        	}
            
        	this.inherited(arguments);
            
        	if(this.resizeBind){
        		$(window).unbind('resize', this.resizeBind);
        	}
        },
        
        _initDom: function(){
            $(this.domNode).find('button.save').click(lang.hitch(this, function(){
                this._save();
        	}));
        	
        	$(this.domNode).find('.cmdInfo li.append i').click(lang.hitch(this, function(){
        		this._clearCurrent(true);
        	}));
            
            $(this.domNode).find('.cmdInfo li.delete i').click(lang.hitch(this, function(){
        		this._delete();
        	}));
            
            var inputAid = $(this.domNode).find('.content>.detail input.aid');
            var selectAid = $(this.domNode).find('.content>.detail div.aid');
            $(this.domNode).find('.content>.detail select.atp').change(lang.hitch(this, function(e){
                var atp = parseInt($(e.currentTarget).val());
                if(atp == 0){
                    inputAid.hide();
                    selectAid.show();
                    
                }else if(atp == 1){
                    inputAid.show();
                    selectAid.hide();
                    
                }else{
                    inputAid.hide();
                    selectAid.hide();
                }
            }));
        },
        
        _save: function(){
            var domP = $(this.domNode).find('.content>.detail');
            var wdaType = parseInt(domP.find('select.atp').val());
            
            var wdaAId;
            if(wdaType == 0){
                wdaAId = domP.find('div.aid').attr('value');
            }else if(wdaType == 1){
                wdaAId = domP.find('input.aid').val();
            }
            
            var wdaANm = domP.find('.anm').val();
            
            if(isNaN(wdaType) || wdaType < 0){
                base.error('错误', '账户类型错误');
                return;
            }
            
            if(wdaAId.length <= 0){
                base.error('错误', '账户ID不能为空');
                return;
            }
            if(wdaANm.length <= 0){
                base.error('错误', '账户实名不能为空');
                return;
            }
            
            var grid = $(this.domNode).find('.gridContainer');
            
            if(this.current){
                base.ajax({
                    type: 'PUT',
                    hintOnSuccess: true,
                    url: base.getServerNM() + 'platformApi/own/user/normal/withdrawAccount',
                    data: {
                        wdaId: this.current.wda_ID,
                        wdaType: wdaType,
                        wdaAId: wdaAId,
                        wdaANm: wdaANm
                    }
                }).success(lang.hitch(this, function(ret){
                    var rowId = grid.jqxGrid('getrowid', this.currentRowIndex);
                    
                    this.current.wda_TP = wdaType;
                    this.current.wda_AID = wdaAId;
                    this.current.wda_ANM = wdaANm;
                    
                    grid.jqxGrid(
                        'updaterow', 
                        rowId, 
                        this.current
                    );
                    
                    this._sendChange();
                }));
                
            }else{
                base.ajax({
                    type: 'POST',
                    hintOnSuccess: true,
                    url: base.getServerNM() + 'platformApi/own/user/normal/withdrawAccount',
                    data: {
                        wdaType: wdaType,
                        wdaAId: wdaAId,
                        wdaANm: wdaANm
                    }
                }).success(lang.hitch(this, function(ret){
                    var newRow = ret.data;
                    
                    grid.jqxGrid(
                        'addrow', 
                        newRow.wda_ID, 
                        newRow, 
                        'first'
                    );
                    
                    this.current = newRow;
                    this.currentRowIndex = 0;
                    
                    this._sendChange();
                }));
            }
        },
        
        _clearCurrent: function(canSave){
            $(this.domNode).find('.content>.detail input').val(null);
            $(this.domNode).find('.content>.detail select.atp').val('-1').change();
            
            this._setAidLiSelect(null);
            
            var saveBtn = $(this.domNode).find('button.save');
            if(canSave){
                saveBtn.removeAttr('disabled', 'disabled').removeClass('disabled').show();
            }else{
                saveBtn.attr('disabled', 'disabled').addClass('disabled').hide();
            }
            
            $(this.domNode).find('.gridContainer').jqxGrid('clearselection');
            $(this.domNode).find('.cmdInfo li.delete').hide();
            this.current = null;
            this.currentRowIndex = -1;
        },
        
        _delete: function(){
            var grid = $(this.domNode).find('.gridContainer');
            var delIndexs = grid.jqxGrid('getselectedrowindexes');
            if(delIndexs && delIndexs.length > 0){
                var ids = [], wdaIds = [];
                
                for(var i=0; i<delIndexs.length; i++){
                    var rowid = grid.jqxGrid('getrowid', delIndexs[i]);
                    if(!base.isNull(rowid)){
                        var rowData = grid.jqxGrid('getrowdata', delIndexs[i]);
                        
                        if(rowData){
                            wdaIds.push(rowData.wda_ID);
                        }
                        
                        ids.push(rowid);
                    }
                }
                
                if(wdaIds.length > 0){
                    base.ajax({
                        type: 'DELETE',
                        hintOnSuccess: true,
                        url: base.getServerNM() + 'platformApi/own/user/normal/withdrawAccount',
                        data: {
                            wdaIds: JSON.stringify(wdaIds)
                        }
                    }).success(lang.hitch(this, function(ret){
                        grid.jqxGrid('deleterow', ids);
                        
                        this._clearCurrent(false);
                        
                        this._sendChange();
                    }));
                }
                
            }else{
                base.info('提示', '请选中要删除的行');
            }
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/wechatUsers'
            }).success(lang.hitch(this, function(ret){
                this._createWechatSelect(ret.data);
                
                this._refreshGird(this.accountList);
            }));
        },
        
        _createWechatSelect: function(data){
            var sel = $(this.domNode).find('.content>.detail div.aid ul');
            
            var opts = [];
            for(var i=0; i<data.length; i++){
                var row = data[i];
                
                var img = $('<div>').css('background-image', 'url('+ row.headimgurl +')');
                var txt = $('<span>').text(row.nickname);
                
                var optTmp = $('<li><a href="javascript:void(0);"></a></li>');
                
                var optTmpA = optTmp.find('a').attr('value', row.openid).data('item', row);
                optTmpA.append(img);
                optTmpA.append(txt);
                
                optTmpA.click(lang.hitch(this, function(e){
                    this._setAidLiSelect($(e.currentTarget).data('item'));
                }));
                
                opts.push(optTmp);
            }
            
            sel.append(opts);
        },
        
        _refreshGird: function(data){
            var source = {
                datatype: "array",
                localdata: data? data : [],
                datafields: [
                    { name: 'wda_ID', type: 'string'},
                    { name: 'wda_TP', type: 'int'},
                    { name: 'wda_AID', type: 'string'},
                    { name: 'wda_ANM', type: 'string'}
                ]
            };
            
            var gridDom = $(this.domNode).find('.gridContainer');
            
            if(!this.gridInited){
                this.gridInited = true;
                
                gridDom.jqxGridCN({
                    width:'100%',
                    height: '100%',
                    source: new $.jqx.dataAdapter(source),
                    pageable: false,
                    autoheight: false,
                    sortable: false,
                    altrows: false,
                    enabletooltips: false,
                    editable: false,
                    theme: 'custom-zd',
                    showheader: true,
                    columnsresize: true,
                    showtoolbar: false,
                    selectionmode: 'checkbox',
                    columns: [
                        { text: '账户类型', datafield: 'wda_TP', cellsalign: 'center', align: 'center', cellsrenderer: function(row, columnfield, value, defaulthtml, columnproperties){
                            var tpStr = '';
                            if(value == 0){
                                tpStr = '微信';
                            }else if(value == 1){
                                tpStr = '支付宝';
                            }else{
                                tpStr = '未知';
                            }
                            return '<div class="tpStr">' + tpStr + '</div>';
                        }},
                        { text: '账户ID', datafield: 'wda_AID', cellsalign: 'center', align: 'center'},
                        { text: '账户实名', datafield: 'wda_ANM', cellsalign: 'center', align: 'center'}
                    ]
                }).on('cellclick', lang.hitch(this, function(event){
                    this._showDetail(event.args.row.bounddata, event.args.rowindex);
                })).on('rowselect', lang.hitch(this, function(event){
                    this._rowChecked();
                })).on('rowunselect', lang.hitch(this, function(event){
                    this._rowChecked();
                }));
                
            }else{
                gridDom.jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
            }
        },
        
        _rowChecked: function(){
            var selRows = $(this.domNode).find('.gridContainer').jqxGrid('getselectedrowindexes');
            if(selRows && selRows.length > 0){
                $(this.domNode).find('.cmdInfo li.delete').show();
            }else{
                $(this.domNode).find('.cmdInfo li.delete').hide();
            }
        },
        
        _setAidLiSelect: function(item){
            var sel = $(this.domNode).find('.content>.detail div.aid');
            
            var img = sel.find('button>div');
            var txt = sel.find('button>span.txt');
            
            if(item){
                sel.attr('value', item.openid);
                
                img.css('background-image', 'url('+ item.headimgurl +')');
                txt.html(item.nickname);
            }else{
                sel.attr('value', '');
                
                img.css('background-image', 'url()');
                txt.html('');
            }
        },
        
        _showDetail: function(rowData, rowIndex){
            if(!rowData || (this.current && rowData.wda_ID == this.current.wda_ID)){
                return;
            }
            
            this.current = rowData;
            this.currentRowIndex = rowIndex;
            
            $(this.domNode).find('button.save').removeAttr('disabled').removeClass('disabled').show();
            
            var domP = $(this.domNode).find('.content>.detail');
            domP.find('.atp').val(this.current.wda_TP).change();
            
            if(this.current.wda_TP == 0){
                var aidLi = domP.find('div.aid ul>li>a[value="'+ this.current.wda_AID +'"]');
                if(aidLi.length > 0){
                    this._setAidLiSelect(aidLi.data('item'));
                }else{
                    this._setAidLiSelect(null);
                    base.error('错误', '该微信用户已未处于绑定状态，请删除');
                }
                
            }else if(this.current.wda_TP == 1){
                domP.find('input.aid').val(this.current.wda_AID);
            }
            
            domP.find('.anm').val(this.current.wda_ANM);
        },
        
        _sendChange: function(){
            var rows = $(this.domNode).find('.gridContainer').jqxGrid('getboundrows');
            topic.publish('component/userAccount/widget/accountInfo/widget/withdraw/accountChange', rows);
        },
        
        _initEvents: function () {
        }
    });
});
