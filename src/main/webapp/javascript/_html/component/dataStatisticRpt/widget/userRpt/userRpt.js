define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/dropdownBox/DropdownBox",
    "root/customScrollbar/CustomScrollBar",
    'root/echarts/echarts.min',
    "dojo/text!./template/userRpt.html",
    "tool/css!./css/userRpt.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        DropdownBox,
        CustomScrollBar,
        echarts,
        template){
    
    return declare("component.dataStatisticRpt.userRpt", [_Widget], {
        baseClass: "component_dataStatisticRpt_userRpt",
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
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            this.selTP = new DropdownBox($(this.domNode).find('.rptCC>.rpt .tpSel'), {
                minWidth: 50,
                dropMinWidth: 50,
                btnClass: 'btn-default',
                options: [{name:'月', value: 'month', data: {len: 6}}, {name:'日', value:'day', data: {len: 10}}],
                onclick: lang.hitch(this, function(name, value, data){
                    this._setData();
                })
            });
            this.own(this.selTP);
            
            this.selTP.select('month', true);
        },
        
        _setData: function(){
            var selTpData = this.selTP.getCurrentSelect();
            
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/sysReport/userRpt',
                data: {
                    selTp: selTpData.value,
                    tmLen: parseInt(selTpData.data.len)
                }
            }).success(lang.hitch(this, function(ret){
                this._updateStatus(ret.data.status);
                this._createChart(ret.data.stm, ret.data.etm, ret.data.statistic, selTpData.value);
            }));
        },
        
        _updateStatus: function(status){
            $(this.domNode).find('.rptCC>.rpt span.userTotal').text(status.userCount);
            $(this.domNode).find('.rptCC>.rpt span.clientTotal').text(status.clientCount);
        },
        
        _createChart: function(stm, etm, statistic, selTp){
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
                    text: '用户增长情况',
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
                        name: '增长数',
                        type: 'bar',
                        barWidth: 12,
                        data: valArr
                    }
                ]
            };
            
            this.chart = echarts.init($(this.domNode).find('.rptCC>.rpt .chart')[0]);
            this.chart.setOption(option);
        },
        
        _initEvents: function(){
        }
    });
});
