
define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "../metaPlugin/metaPlugin",
    "root/spin/Spin",
    "tool/validator",
    'root/pageSwitch/pageSwitch',
    'root/echarts/echarts.min',
    'root/jqwidgets/Jqx',
    'root/drawerMenu_s/DrawerMenu_s',
    'root/excelBuilder/ExcelBuilder',
    "root/dateTimePicker/DateTimePicker",
    "dojo/text!./template/serialLine.html",
    "tool/css!./css/serialLine.css"
], function(
        base,
        declare,
        lang,
        topic,
        metaPlugin,
        Spin,
        Validator,
        PageSwitch,
        echarts,
        Jqx,
        DrawerMenu,
        ExcelBuilder,
        DateTimePicker,
        template){
    
    return declare("common.widget.sysMetas.serialLine", [metaPlugin], {
        baseClass: "common_widget_sysMetas_serialLine",
        templateString: template,
        
        authApi: {
            'metaCommand_history': '/platformApi/own/command/getHistoricalData',
            'metaCommand_realTime': '/platformApi/own/command/getRealTimeData',
            'periodData': '/platformApi/own/seriesUpdate/periodData'
        },
        
        /**
         * all required options defined in 'metaPlugin.baseOptions' and 'this.options' should be provided in args of constructor
         *   like 'metaPlugin.baseOptions', 'options' also a reference type, we need to mix its value to the instance in the constructor.
         */
        options: {
            layout: 'switch',    //horizontal/vertical/switch
            chartSpace: 0.5,     //percentage (0~1, 0.5 means 50%), take effect when 'dataGridLayout != switch'
            dataUrl: 'platformApi/own/series/periodData',
            stm: '2015-12-10 08:00:00',     //required
            etm: '2015-12-15 08:30:00',     //required
            yAxisTitle: null,               //'℃'
            smooth: true,                
            showLabel: false,            
            showSymbol: false,           
            lineColor: '#c23531',        
            areaColors: null                //array, ['#ccc', '#ddd'],  array.length>1 means color gradient
        },
        
        constructor: function (args) {
            declare.safeMixin(this, this.options);
            declare.safeMixin(this, args);
            
            //metaUnit get a higher level to display than yAxisTitle
            if(!base.isNull(this.metaUnit) && this.metaUnit.length > 0){
                this.yAxisTitle = this.metaUnit;
            }
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.resizeBind = lang.hitch(this, function(){
                this._resizeManual();
            });
            $(window).resize(this.resizeBind);
            
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            this._setCmdVisible();
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.slc>.grid>div.gridContainer').jqxGrid('destroy');
        	}
        	
            //editor also contains jqxGrid
            this._destroyEditor();
            
        	this.inherited(arguments);
            
            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
            
            if(this.descTimeOut){
                clearTimeout(this.descTimeOut);
                this.descTimeOut = null;
            }
            
            if(this.chart){
                this.chart.dispose();
            }
        },
        
        refresh: function(args){
            this.inherited(arguments);
            
            this._clearData();
            
            declare.safeMixin(this, args);
            
            this._setData();
        },
        
        _setCmdVisible: function(){
            if(!this.showEditor){
                $(this.domNode).find('.drawerMenu li.editData').hide();
            }
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/client/normal/base',
                data: {
                    clientId: this.clientId
                }
            }).success(lang.hitch(this, function(ret){
                if(base.getUid() != ret.data.c_OWNER_UID){
                    $(this.domNode).find('.drawerMenu li.showCmd').hide();
                }
                
            })).fail(lang.hitch(this, function(ret){
                $(this.domNode).find('.drawerMenu li.showCmd').hide();
            }));
        },
        
        _initDom: function(){
            $(this.domNode).find('.slc').addClass(this.layout);
            if(this.layout == 'horizontal'){
                $(this.domNode).find('.slc>.chart').css('width', (this.chartSpace * 100) + '%');
                $(this.domNode).find('.slc>.grid').css('width', ((1 - this.chartSpace) * 100) + '%');
            }else if(this.layout == 'vertical'){
                $(this.domNode).find('.slc>.chart').css('height', (this.chartSpace * 100) + '%');
                $(this.domNode).find('.slc>.grid').css('height', ((1 - this.chartSpace) * 100) + '%');
            }else{
                this.ps = new PageSwitch($(this.domNode).find('.slc')[0],{
                    duration:600,
                    direction:0,
                    start:0,
                    loop:false,
                    ease:'ease',
                    transition:'scrollX',  //flowX
                    freeze:false,
                    mouse:false,
                    mousewheel:false,
                    arrowkey:false,
                    autoplay:false,
                    interval:0
                });
                
                this.ps.on('after', lang.hitch(this, function(index){
                    if(index == 0){
                        if(this.chart){
                            this.chart.resize();
                        }
                    }else{
                        $(this.domNode).find('.slc>.grid>div.gridContainer').jqxGrid('refresh');
                    }
                }));
                
                $(this.domNode).find('.drawerMenu li.showChart').css('display', 'block').click(lang.hitch(this, function(){
                    this.ps.prev();
                }));
            }
            
            $(this.domNode).find('.drawerMenu li.showGrid').click(lang.hitch(this, function(){
                this._toggleCmd(false);
            }));
            
            $(this.domNode).find('.drawerMenu li.showCmd').click(lang.hitch(this, function(){
                this._toggleCmd(true);
            }));
            
            $(this.domNode).find('.drawerMenu li.editData').click(lang.hitch(this, function(){
                this._showEditor();
            }));
            
            DrawerMenu.init($(this.domNode).find('.drawerMenu'));
            
            var tmNodes = $(this.domNode).find('.callDataContainer .tm');
            var dp = new DateTimePicker(tmNodes, 'Y-m-d H:i:S', new Date());
            this.own(dp);
            //clear text
            tmNodes.val(null);
            
            $(this.domNode).find('.callDataContainer button.cmdBtn').click(lang.hitch(this, function(){
                this._callDataInCmd();
            }));
            
            $(this.domNode).find('.callDataContainer .clientNm').html(this.clientNm);
            $(this.domNode).find('.callDataContainer .metaNm').html(this.metaNm? this.metaNm : this.metaCId);
            
            var callTPNode = $(this.domNode).find('.callDataContainer .callTMRange');
            $(this.domNode).find('.callDataContainer .historical').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    callTPNode.show();
                }
            }));

            $(this.domNode).find('.callDataContainer .realTime').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    callTPNode.hide();
                }
            }));
            
            //hide the menu when size is 'small'
            if(this.size == 'small'){
                $(this.domNode).find('.drawerMenu').hide();
            }
            
            $(this.domNode).children('.modal').on('hide.bs.modal', lang.hitch(this, function(e){
                if(!this.closeByEditor){
                    topic.publish('common/widget/sysMetas/serialLine/modalClosing');
                    e.preventDefault();
                }
            }));
        },
        
        _showEditor: function(){
            this._destroyEditor();
            
            base.newDojo(
                'common/widget/sysMetas/serialLine/widget/editor/editor', 
                'serialLine.editor', 
                {
                    stm: this.stm,
                    etm: this.etm,
                    clientId: this.clientId,
                    metaCId: this.metaCId,
                    smooth: this.smooth,
                    showLabel: this.showLabel,
                    lineColor: this.lineColor,
                    areaColors: this.areaColors
                }
            ).success(lang.hitch(this, function(obj){
                this.editor = obj;
                
                var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                modal.find('.modal-title').html(this.clientNm + '<span style="color: #f3f3f3; margin-left: 5px;">[' + (this.metaNm? this.metaNm : this.metaCid) + ']</span>');
                modal.find('.modal-body').removeClass('editor').append($(this.editor.domNode));
                this.editor.startup();
            }));
        },
        
        _destroyEditor: function(){
            if(this.editor){
                this.editor.destroyRecursive();
                this.editor = null;
            }
            
            this.closeByEditor = false;
        },
        
        _callDataInCmd: function(){
            var url = null, data = null;
            
            if($(this.domNode).find('.callDataContainer .historical').is(':checked')){
                var stm = $(this.domNode).find('.callDataContainer .stm').val().trim();
                var etm = $(this.domNode).find('.callDataContainer .etm').val().trim();

                if(stm.length == 0 || etm.length == 0 || base.parseDate(stm) > base.parseDate(etm)){
                    base.error('提醒', '请正确输入时间范围');
                    return;
                }
                
                url = 'platformApi/own/command/getHistoricalData';
                data = {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    metaCId: this.metaCId,
                    stm: stm,
                    etm: etm
                }
                
            }else{
                url = 'platformApi/own/command/getRealTimeData';
                data = {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    metaCId: this.metaCId
                }
            }
            
            base.ajax({
                type: 'POST',
                hintOnSuccess: true,
                url: base.getServerNM() + url,
                data: data
            }).success(lang.hitch(this, function(ret){
                var descLabel = $(this.domNode).find('.callDataContainer label.desc');
                descLabel.show().html('已提交指令，设备会自动响应并返回您的数据，但何时响应依赖于设备的在线状态，请耐心等待.').css('opacity', 1);
                
                if(this.descTimeOut){
                    clearTimeout(this.descTimeOut);
                    this.descTimeOut = null;
                }
                
                this.descTimeOut = setTimeout(function(){
                    descLabel.css('opacity', 0).one('webkitTransitionEnd transitionend', function(){
                    	descLabel.off('webkitTransitionEnd transitionend');
                    	descLabel.html('').hide();
                    });
                }, 5000);
                
            }));
        },
        
        _toggleCmd: function(showCmd){
            if(showCmd){
                $(this.domNode).find('.slc>.grid').addClass('showCallData');
            }else{
                $(this.domNode).find('.slc>.grid').removeClass('showCallData');
            }
            
            if(this.ps){
                this.ps.next();
            }
        },
        
        _refreshGrid: function(data){
            var source = {
                datatype: "array",
                localdata: data? data : [],
                datafields: [
                    { name: 'collectTs', type: 'string'},
                    { name: 'version', type: 'string'},
                    { name: 'val', type: 'string'}
                ]
            };
            
            if(!this.gridInited){
                this.gridInited = true;
                
                $(this.domNode).find('.slc>.grid>div.gridContainer').jqxGridCN({
                    width:'100%',
                    height: '100%',
                    source: new $.jqx.dataAdapter(source),
                    pageable: true,
                    autoheight: false,
                    sortable: false,
                    altrows: false,
                    enabletooltips: false,
                    editable: false,
                    theme: 'custom-zd',
                    showheader: true,
                    columnsresize: true,
                    columns: [
                        { text: '采集时间', datafield: 'collectTs', cellsalign: 'center', align: 'center', width: 170},
                        { text: '数据版本', datafield: 'version', cellsalign: 'center', align: 'center', width: 100},
                        { text: '值', datafield: 'val', cellsalign: 'center', align: 'center'}
                    ],
                    showtoolbar: true,
                    rendertoolbar: lang.hitch(this, function (toolbar){
                        toolbar.append($('<span>').addClass('gridTitle').text(this.metaNm? this.metaNm : this.metaCid));
                        toolbar.append($('<span>').text(this.clientNm));
                        
                        var excelExp = $('<i class="fa fa-file-excel-o export" title="导出"></i>').unbind().click(lang.hitch(this, function(){
                            this._exportExcel(data); 
                        }));
                        if(this.layout == 'vertical' || this.size == 'small'){
                            excelExp.addClass('minPos');   
                        }
                        
                        toolbar.append(excelExp);
                    }),
                });
                
            }else{
                $(this.domNode).find('.slc>.grid>div.gridContainer').jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
                
                $(this.domNode).find('.slc>.grid>div.gridContainer i.fa.export').unbind().click(lang.hitch(this, function(){
                    this._exportExcel(data); 
                }));
            }
        },
        
        _exportExcel: function(data){
            if(data && data.length > 0){
                var fileNm = (this.metaNm? this.metaNm : this.metaCid) + "_" + this.clientNm 
                    + (this.stm != null && this.stm.length>0 ?  ("_" + this.stm.substr(0, 10)) : '')
                    + (this.etm != null && this.etm.length>0 ?  ("_" + this.etm.substr(0, 10)) : '')
                    + '.csv';

                ExcelBuilder.exportData(data, {collectTs: '采集时间', version: '数据版本', val: '值'}, fileNm);
            }
        },
        
        _refreshChart: function(data){
            var areaStyle = null;
            if(this.areaColors && this.areaColors.length>0){
                if(this.areaColors.length == 1){
                    //use the 'lineColor' rather than 'this.areaColors[0]'
                    areaStyle = {normal: {}};
                }else{
                    areaStyle = {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: this.areaColors[0]
                            }, {
                                offset: 1,
                                color: this.areaColors[1]
                            }])
                        }
                    };
                }
            }
            
            var option = {
                tooltip: {
                    trigger: 'axis',
                    formatter: lang.hitch(this, function (params) {
                        var p = params[0];
                        if(p.value && p.value.length > 1){
                            var dt = new Date(p.name);
                            return dt.format('yyyy/MM/dd HH:mm:ss.fff') + '<br> ' + this.metaCId + '：' + p.value[1] + ' ' + (this.yAxisTitle? this.yAxisTitle : '');
                        }else{
                            return null;
                        }
                    })
                },
                grid: {
                    bottom: 40,
                    top: this.size == 'normal'? 53 : 35
                },
                title: {
                    show: true,
                    left: 'center',
                    text: this.metaNm? this.metaNm : this.metaCid,
                    subtext: this.size == 'normal'? this.clientNm : null,
                    textStyle: {
                        fontSize: 15,
                        fontWeight: 'bold'
                    }
                },
                toolbox: {
                    right: (this.layout == 'horizontal' || this.size == 'small'? 20 : 70),
                    top: 0,
                    feature: {
                        saveAsImage: {pixelRatio: 2}
                    }
                },
                legend: {
                    show: false
                },
                xAxis: {
                    type: 'time',
                    boundaryGap: false,
                    splitLine: {show: false}
                },
                yAxis: {
                    type: 'value',
                    scale: true,
                    splitNumber: this.size == 'normal'? 5 : 3,
                    boundaryGap: [0.2, 0.2],
                    name: this.yAxisTitle,
                    axisLabel: {
                        formatter: function (value, index) {
                            //max digit precision of 2
                            if(Validator.isDouble(value + '')){
                                var arrTmp = (value + '').split('.');
                                if(arrTmp.length == 2){
                                    if(arrTmp[1].length > 2){
                                        return parseFloat(value).toFixed(2);
                                    }
                                }
                                
                                return value;
                            }
                        }
                    }
                },
                series: [
                    {
                        type: 'line',
                        smooth: this.smooth,
                        label: {normal: {show: this.showLabel}},
                        symbol: this.showSymbol? 'emptyCircle' : 'none',
                        itemStyle: {normal: {color: this.lineColor}},
                        areaStyle: areaStyle,
                        data: data? data : []
                    }
                ]
            };
            
            this.chart = echarts.init($(this.domNode).find('.slc>.chart>.chartContainer')[0]);
            this.chart.setOption(option);
        },
        
        _clearData: function(){
            $(this.domNode).find('.slc>.grid>div.gridContainer').jqxGrid('clear');
            
            if(this.chart){
                this.chart.clear();
            }
        },
        
        _resizeManual: function(){
            $(this.domNode).find('.slc>.grid>div.gridContainer').jqxGrid('refresh');
            
            if(this.chart){
                this.chart.resize();
            }
        },
        
        //filter invalid record
        _filterSeriesData: function(data){
            var chkObj = null;
            var preKey = '';
            
            var chartArr = [], gridArr = [];
            
            var dealRecord = function(rec){
                //deleted
                if(parseInt(rec[3]) > 0){
                    return;
                }
                
                //cast utc to local time
                var localTM = new Date(rec[5]);
                var tmfff = localTM.format('yyyy/MM/dd HH:mm:ss.fff');
                
                chartArr.push({
                    name: localTM,
                    value: [localTM, rec[4]]
                });
                
                gridArr.push({
                    collectTs: tmfff, 
                    version: rec[2],
                    val: rec[4]
                });
            };
            
            for(var i=0; i<data.length; i++){
                //columns: [time、crtTs、version、deleted、val、collectTs]
                var row = data[i];
                //version
                row[2] = parseInt(row[2]);
                //time
                row[5] = parseInt(row[5]);
                
                if(preKey != row[5]){
                    preKey = row[5];
                    if(chkObj){
                        dealRecord(chkObj);
                        chkObj = null;
                    }
                }
                
                //retain the max versioned record to chkObj
                if(!chkObj || chkObj[2] < row[2]){
                    chkObj = row;
                }
            }
            
            if(chkObj){
                dealRecord(chkObj);
            }
            
            return {chartData: chartArr, gridData: gridArr};
        },
        
        _setData: function(){
            var spin = new Spin($(this.domNode));
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + this.dataUrl,
                data: {
                    clientId: this.clientId,
                    metaCId: this.metaCId,
                    stm: this.stm,
                    etm: this.etm
                }
            }).success(lang.hitch(this, function(ret){
                var data = this._filterSeriesData(ret.data);
                
                this._refreshGrid(data.gridData);
                this._refreshChart(data.chartData);
                
                this._resizeManual();
                
                spin.destroy();
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/sysMetas/serialLine/closeModal', lang.hitch(this, function(){
                this.closeByEditor = true;
                $(this.domNode).children('.modal').modal('hide');
            }));
            
            this.own(sub1);
        }
    });
});
