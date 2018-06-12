
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/echarts/echarts.min',
    "dojo/text!./template/smsResource.html",
    "tool/css!./css/smsResource.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        echarts,
        template){
    
    return declare("component.userAccount.widget.resource.widget.smsResource", [_Widget], {
        baseClass: "component_userAccount_widget_resource_smsResource",
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
            
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            if(this.chart){
                this.chart.dispose();
            }
        },
        
        _initDom: function(){
            $(this.domNode).find('.smsHead>a').click(lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/resource/purchase', {resourceTp: 'sms', minSize: 100});
            }));
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/resourceStatus/sms'
            }).success(lang.hitch(this, function(ret){
                this._updateStatus(ret.data.status);
                this._createChart(ret.data.stm, ret.data.etm, ret.data.statistic);
            }));
        },
        
        _updateStatus: function(status){
            var percent = 0;
            if(status.total < 0){
                percent = 0;
            }else if(status.total == 0){
                percent = 100;
            }else{
                percent = (status.current / status.total).toFixed(2);
                if(percent < 1){
                    percent *= 100;
                }else{
                    percent = 100;
                }
            }

            $(this.domNode).find('.progress-bar').attr('aria-valuenow', percent).css('width', percent + '%');
            $(this.domNode).find('.progress-bar>span').html(percent + '% 已用');
            if(status.total < 0){
                $(this.domNode).find('.processDesc').html('当前已发 ' + status.current +' 条，无限制');
            }else{
                var remain = status.total - status.current;
                if(remain < 0){
                    remain = 0;
                }
                $(this.domNode).find('.processDesc').html(remain + ' 条可用，共 ' + status.total + ' 条')
            }
        },
        
        _createChart: function(stm, etm, statistic){
            // >=stm and <etm
            var tmArr = [], valArr = [], maxValue = 0;
            var stm = new Date(stm), etm = new Date(etm);
            
            while(etm > stm){
                var key = stm.format('yyyy-MM-dd');
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
                
                stm = stm.add('d', 1);
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
                    text: '近30天发送情况',
                    subtext: null,
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
                    minInterval: 1,
                    min: 0,
                    name: '条'
                },
                series: [
                    {
                        name: '数量',
                        type: 'bar',
                        barWidth: 12,
                        data: valArr
                    }
                ]
            };
            
            this.chart = echarts.init($(this.domNode).find('.smsChart')[0]);
            this.chart.setOption(option);
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/resource/hide', lang.hitch(this, function(data){
            }));
            var sub2 = topic.subscribe('component/userAccount/widget/resource/changed', lang.hitch(this, function(data){
                if(data && data.resourceTp == 'sms'){
                    this._updateStatus(data.status);
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
