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
    "dojo/text!./template/resourceRpt.html",
    "tool/css!./css/resourceRpt.css"
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
    
    return declare("component.dataStatisticRpt.resourceRpt", [_Widget], {
        baseClass: "component_dataStatisticRpt_resourceRpt",
        templateString: template,
        
        constructor: function(args){
            declare.safeMixin(this, args);
            
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
            this._initDom_sms();
            this._initDom_email();
            this._initDom_image();
        },
        
        _initDom_sms: function(){
            this.selTP_sms = new DropdownBox($(this.domNode).find('.rptCC>.rpt.sms .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_sms();
                })
            });
            this.own(this.selTP_sms);
            
            this.selTP_sms.select('month', true);
        },
        
        _initDom_email: function(){
            this.selTP_email = new DropdownBox($(this.domNode).find('.rptCC>.rpt.email .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_email();
                })
            });
            this.own(this.selTP_email);
            
            this.selTP_email.select('month', true);
        },
        
        _initDom_image: function(){
            this.selTP_image = new DropdownBox($(this.domNode).find('.rptCC>.rpt.image .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData_image();
                })
            });
            this.own(this.selTP_image);
            
            this.selTP_image.select('month', true);
        },
        
        _setData: function(){
            this._setData_sms();
            this._setData_email();
            this._setData_image();
            this._setData_video();
        },
        
        _setData_sms: function(){
            var selTpData = this.selTP_sms.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/smsRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_sms(ret.data.status);
                this._createChart('sms', '短信发送情况', '短信', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _setData_email: function(){
            var selTpData = this.selTP_email.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/emailRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_email(ret.data.status);
                this._createChart('email', '邮件发送情况', '邮件', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _setData_image: function(){
            var selTpData = this.selTP_image.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/imageRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_image(ret.data.status);
                this._createChart('image', '图片存储情况', '图片', ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _setData_video: function(){
            var selTpData = this.selTP_image.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/videoRpt',
                data: {
                    topSize: 10
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus_video(ret.data.status);
                this._createGrid('video', ret.data.statistic);
            }));
        },
        
        _updateStatus_sms: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.sms');
            parent.find('span.successCount').text(status.successCount);
            parent.find('span.sendingCount').text(status.sendingCount);
            parent.find('span.failCount').text(status.failCount);
            
            parent.find('span.purchaseCount').text(status.purchaseCount);
            parent.find('span.purchaseFee').text(status.purchaseFee);
        },
        
        _updateStatus_email: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.email');
            parent.find('span.successCount').text(status.successCount);
            parent.find('span.sendingCount').text(status.sendingCount);
            parent.find('span.failCount').text(status.failCount);
        },
        
        _updateStatus_image: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.image');
            parent.find('span.imageCount').text(status.imageCount);
            
            parent.find('span.purchaseCount').text(status.purchaseCount);
            parent.find('span.purchaseFee').text(status.purchaseFee);
        },
        
        _updateStatus_video: function(status){
            var parent = $(this.domNode).find('.rptCC>.rpt.video');
            parent.find('span.videoCount').text(status.videoCount);
            
            parent.find('span.purchaseCount').text(status.purchaseCount);
            parent.find('span.purchaseFee').text(status.purchaseFee);
        },
        
        _createChart: function(cls, title, name, stm, etm, statistic, selTp){
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
                    min: 0,
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
        
        _createGrid: function(cls, dataList){
            var source = {
                datatype: "array",
                localdata: dataList,
                datafields: [
                    { name: 'u_id', type: 'string'},
                    { name: 'u_nm', type: 'string'},
                    { name: 'ct', type: 'int'}
                ]
            };
            
            if(!this.gridInited){
                this.gridInited = true;
                
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
                    columns: [
                        { text: '用户ID', datafield: 'u_id', cellsalign: 'center', align: 'center', width: '40%'},
                        { text: '用户ID', datafield: 'u_nm', cellsalign: 'center', align: 'center', width: '40%'},
                        { text: '数量', datafield: 'ct', cellsalign: 'center', align: 'center'}
                    ],
                    showtoolbar: true,
                    rendertoolbar: lang.hitch(this, function (toolbar){
                        toolbar.append($('<span class="videoGridTitle">视频拥有数量排名(前10)</span>'));
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
