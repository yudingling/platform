define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/dropdownBox/DropdownBox",
    "root/customScrollbar/CustomScrollBar",
    'root/echarts/echarts.min',
    'root/jqwidgets/Jqx',
    "dojo/text!./template/3rdRpt.html",
    "tool/css!./css/3rdRpt.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        DropdownBox,
        CustomScrollBar,
        echarts,
        Jqx,
        template){
    
    return declare("component.dataStatisticRpt.3rdRpt", [_Widget], {
        baseClass: "component_dataStatisticRpt_3rdRpt",
        templateString: template,
        
        constructor: function(args){
            declare.safeMixin(this, args);
            
            this.gridMap = {};
            
            this._initEvents();
        },
        
        postCreate: function(){
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function(){
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
                CustomScrollBar.init($(this.domNode));
                
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.rptCC>.rpt .grid').jqxGrid('destroy');
        	}
            
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            this._initDom_amount();
            this._initDom_purchase();
            this._initDom_reliable();
            this._initDom_net();
        },
        
        _initDom_amount: function(){
            this.selTP_amount = new DropdownBox($(this.domNode).find('.rptCC>.rpt.amount .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_amount();
                })
            });
            this.own(this.selTP_amount);
            
            this.selTP_amount.select('month', true);
        },
        
        _initDom_purchase: function(){
            this.selTP_purchase = new DropdownBox($(this.domNode).find('.rptCC>.rpt.purchase .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_purchase();
                })
            });
            this.own(this.selTP_purchase);
            
            this.selTP_purchase.select('month', true);
        },
        
        _initDom_reliable: function(){
            this.selTP_reliable = new DropdownBox($(this.domNode).find('.rptCC>.rpt.reliable .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_reliable();
                })
            });
            this.own(this.selTP_reliable);
            
            this.selTP_reliable.select('month', true);
        },
        
        _initDom_net: function(){
            this.selTP_net = new DropdownBox($(this.domNode).find('.rptCC>.rpt.net .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_net();
                })
            });
            this.own(this.selTP_net);
            
            this.selTP_net.select('month', true);
        },
        
        _setData: function(){
            this._setData_amount();
            this._setData_hottest();
            this._setData_mostUsed();
            this._setData_purchase();
            this._setData_profit();
            this._setData_reliable();
            this._setData_net();
        },
        
        _setData_amount: function(){
            var selTpData = this.selTP_amount.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdAmountRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_amount(ret.data.status);
                this._createChart('amount', '服务增长情况', '增长', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _setData_hottest: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdHottestRpt',
                data: {
                    topSize: 10,
                    tmLen: 30
                }
            }).success(lang.hitch(this, function(ret){
                var datafields = [
                    { name: 'tps_nm', type: 'string'},
                    { name: 'u_nm', type: 'string'},
                    { name: 'crt_ts', type: 'string'},
                    { name: 'rateValue', type: 'int'}
                ];
                
                var columns = [
                    { text: '服务名称', datafield: 'tps_nm', cellsalign: 'center', align: 'center'},
                    { text: '创建者', datafield: 'u_nm', cellsalign: 'center', align: 'center'},
                    { text: '创建时间', datafield: 'crt_ts', cellsalign: 'center', align: 'center'},
                    { text: '调用次数', datafield: 'rateValue', cellsalign: 'center', align: 'center'}
                ];
                
                this._createGrid('hottest', '30天内最热服务排名(前10)', ret.data.statistic, datafields, columns);
            }));
        },
        
        _setData_mostUsed: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdMostUsedRpt',
                data: {
                    topSize: 10
                }
            }).success(lang.hitch(this, function(ret){
                var datafields = [
                    { name: 'tps_id', type: 'string'},
                    { name: 'tps_nm', type: 'string'},
                    { name: 'u_id', type: 'string'},
                    { name: 'u_nm', type: 'string'},
                    { name: 'crt_ts', type: 'string'},
                    { name: 'rateValue', type: 'int'}
                ];
                
                var columns = [
                    { text: '服务名称', datafield: 'tps_nm', cellsalign: 'center', align: 'center'},
                    { text: '创建者', datafield: 'u_nm', cellsalign: 'center', align: 'center'},
                    { text: '创建时间', datafield: 'crt_ts', cellsalign: 'center', align: 'center'},
                    { text: '用户数', datafield: 'rateValue', cellsalign: 'center', align: 'center'}
                ];
                
                this._createGrid('mostUsed', '用户最多服务排名(前10)', ret.data.statistic, datafields, columns);
            }));
        },
        
        _setData_purchase: function(){
            var selTpData = this.selTP_purchase.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdPurchaseRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_purchase(ret.data.status);
                this._createChart('purchase', '服务购买情况', '购买额', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _setData_profit: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdProfitRpt',
                data: {
                    topSize: 10,
                    tmLen: 30
                }
            }).success(lang.hitch(this, function(ret){
                var datafields = [
                    { name: 'u_id', type: 'string'},
                    { name: 'u_nm', type: 'string'},
                    { name: 'profit', type: 'float'}
                ];
                
                var columns = [
                    { text: '开发者', datafield: 'u_nm', cellsalign: 'center', align: 'center'},
                    { text: '收益', datafield: 'profit', cellsalign: 'center', align: 'center'}
                ];
                
                this._updateStatus_profit(ret.data.status);
                this._createGrid('profit', '30天内开发者收益排名(前10)', ret.data.statistic, datafields, columns);
            }));
        },
        
        _setData_reliable: function(){
            var selTpData = this.selTP_reliable.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdReliableRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_reliable(ret.data.status);
                this._createChart('reliable', '服务认证情况', '认证额', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _setData_net: function(){
            var selTpData = this.selTP_net.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/s3rdNetRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_net(ret.data.status);
                this._createChart('net', '净收益情况', '净收益', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value, true);
            }));
        },
        
        _updateStatus_amount: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.amount');
            parent.find('span.okCount').text(status.okCount);
            parent.find('span.underReviewCount').text(status.underReviewCount);
            parent.find('span.disabledCount').text(status.disabledCount);
            parent.find('span.reliabledCount').text(status.reliabledCount);
        },
        
        _updateStatus_purchase: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.purchase');
            parent.find('span.purchaseAmount').text(status.purchaseAmount);
        },
        
        _updateStatus_profit: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.profit');
            parent.find('span.profitAmount').text(status.profitAmount);
        },
        
        _updateStatus_reliable: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.reliable');
            parent.find('span.reliableAmount').text(status.reliableAmount);
        },
        
        _updateStatus_net: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.net');
            parent.find('span.netAmount').text(status.netAmount);
        },
        
        _createChart: function(cls, title, name, stm, etm, statistic, selTp, autoMin){
            // >=stm and <etm
            var tmArr = [], valArr = [], maxValue = 0;
            var stm = new Date(stm), etm = new Date(etm);
            
            while(etm > stm){
                var key = selTp == 'day'? stm.format('yyyy-MM-dd') : stm.format('yyyy-MM');
                tmArr.push(key);
                
                var tmp = statistic[key];
                if(base.isNull(tmp)){
                    valArr.push('-');
                }else{
                    valArr.push(tmp);
                    if(maxValue < tmp){
                        maxValue = tmp;
                    }
                }
                
                stm = selTp == 'day'? stm.add('d', 1) : stm.add('m', 1);
            }
            
            var option = {
                color: ['#23c6c8'],
                tooltip: {
                    trigger: 'axis'
                },
                grid: {
                    bottom: 30,
                    top: 55
                },
                title: {
                    show: true,
                    left: 'left',
                    text: title,
                    subtext: null,
                    left: 6,
                    top: 10,
                    textStyle: {
                        fontSize: 13,
                        fontWeight: 'normal'
                    }
                },
                legend: {
                    show: false
                },
                xAxis: {
                    type: 'category',
                    data : tmArr,
                    splitLine: {show: false},
                    axisTick: {
                        alignWithLabel: true
                    }
                },
                yAxis: {
                    type: 'value',
                    scale: true,
                    splitLine: {show: false},
                    splitNumber: maxValue < 3? (maxValue > 0? maxValue : 1) : 3,
                    min: autoMin ? null : 0,
                    minInterval: 1
                },
                series: [
                    {
                        name: name,
                        type: 'bar',
                        barWidth: 12,
                        data: valArr
                    }
                ]
            };
            
            var chart = echarts.init($(this.domNode).find('.rptCC>.rpt.' + cls + ' .chart')[0]);
            chart.setOption(option);
        },
        
        _createGrid: function(cls, title, dataList, datafields, columns){
            var source = {
                datatype: "array",
                localdata: dataList,
                datafields: datafields
            };
            
            var inited = this.gridMap[cls];
            
            if(!inited){
                this.gridMap[cls] = cls;
                
                var gridNode = $(this.domNode).find('.rptCC>.rpt.' + cls + ' .grid');
                
                gridNode.jqxGridCN({
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
                    columns: columns,
                    showtoolbar: true,
                    rendertoolbar: lang.hitch(this, function (toolbar){
                        toolbar.append($('<span class="videoGridTitle">' + title + '</span>'));
                    }),
                });
                
            }else{
                gridNode.jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
            }
        },
        
        _initEvents: function(){
        }
    });
});
