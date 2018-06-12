
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/event",
    "tool/validator",
    "root/spin/Spin",
    'root/echarts/echarts.min',
    'root/jqwidgets/Jqx',
    "root/fileSelector/FileSelector",
    "root/excelParser/ExcelParser",
    "root/dateTimePicker/DateTimePicker",
    "dojo/text!./template/editor.html",
    "tool/css!./css/editor.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        event,
        Validator,
        Spin,
        echarts,
        Jqx,
        FileSelector,
        ExcelParser,
        DateTimePicker,
        template){
    
    return declare("common.widget.sysMetas.serialLine.widget.editor", [_Widget], {
        baseClass: "common_widget_sysMetas_serialLine_widget_editor",
        templateString: template,
        
        authApi: {
            'periodData': '/platformApi/own/seriesUpdate/periodData'
        },
        
        /*
           args: {
              stm: '2015-12-10 08:00:00',
              etm: '2015-12-15 08:30:00',
              clientId: 'xxx',
              metaCId: 'xxx',
              smooth: true,
              showLabel: true,
              lineColor: '#ccc',
              areaColors: null   
           }
        */
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.delRowsMap = {};
            
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
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            this.canSave = Boolean($(this.domNode).find('form .save').attr('bindAuthResult'));
            this.canDelete = Boolean($(this.domNode).find('.cmdInfo .delete').attr('bindAuthResult'));
            
            this._hideOnInit();
            
            //we need 'this.canSave' in '_setData', so call this in bindAuthed rather than startup
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.grid>div.gridContainer').jqxGrid('destroy');
        	}
        	
        	this.inherited(arguments);
            
            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
            
            if(this.chart){
                this.chart.dispose();
            }
        },
        
        _initDom: function(){
            var dps = new DateTimePicker($(this.domNode).find('form .stm'), 'Y-m-d H:i:S', this.stm);
            this.own(dps);
            
            var dpe = new DateTimePicker($(this.domNode).find('form .etm'), 'Y-m-d H:i:S', this.etm);
            this.own(dpe);
            
            $(this.domNode).find('form .stm').val(this.stm);
            $(this.domNode).find('form .etm').val(this.etm);
            
            $(this.domNode).find('form button.search').click(lang.hitch(this, function(){
                this._setData();
            }));
            
            var fs = new FileSelector($(this.domNode).find('.cmdInfo li.import i'), ".xlsx", lang.hitch(this, function(e){
                this._import(e);
            }));
            this.own(fs);
            
            $(this.domNode).find('.cmdInfo li.append i').click(lang.hitch(this, function(){
        		this._append();
        	}));
            
            $(this.domNode).find('.cmdInfo li.delete i').click(lang.hitch(this, function(){
        		this._delete();
        	}));
        },
        
        _dataChanged: function(){
            var btnSave = $(this.domNode).find('form .save');
            if(this.canSave && !btnSave.is(':visible')){
                btnSave.show().unbind().click(lang.hitch(this, function(){
                    this._save();
                }));
            }
        },
        
        _rowChecked: function(){
            if(this.canDelete){
                var selRows = $(this.domNode).find('.grid>div.gridContainer').jqxGrid('getselectedrowindexes');
                if(selRows && selRows.length > 0){
                    $(this.domNode).find('.cmdInfo li.delete').show();
                }else{
                    $(this.domNode).find('.cmdInfo li.delete').hide();
                }
            }
        },
        
        _save: function(closeOnSuccess){
            var addRowsMap = {};
            var uptRowsMap = {};
            
            var grid = $(this.domNode).find('.grid>div.gridContainer');
            
            //end grid edit
            if(!base.isNull(this.editRowIndex) && !base.isNull(this.editRowField)){
                grid.jqxGrid('endcelledit', this.editRowIndex, this.editRowField, false);
            }
            
            var rows = grid.jqxGrid('getrows');
            if(rows && rows.length > 0){
                for(var i=0; i<rows.length; i++){
                    var cur = rows[i];
                    
                    if(cur.isNew){
                        if(!Validator.isDateTime(cur.collectTs) || !Validator.isDouble(cur.val)){
                            base.error('错误', '新增数据的时间或数值输入错误')
                            return;
                        }
                        
                        addRowsMap[cur.collectTs] = parseFloat(cur.val);
                    }
                    
                    if(cur.isUpt){
                        if(!Validator.isDouble(cur.val)){
                            base.error('错误', '数值输入错误')
                            return;
                        }
                        
                        uptRowsMap[cur.collectTs] = parseFloat(cur.val);
                    }
                }
            }
            
            //cause the authorization of serial data maintenance (get,post,put,delete) can set to sub user, so we should call the api
            //  in different type strictly 
            var spin = new Spin($(this.domNode));
            $.when(
                this._save_upt(uptRowsMap), 
                this._save_del(this.delRowsMap), 
                this._save_add(addRowsMap)
            ).done(lang.hitch(this, function(){
                base.ok('成功', '数据保存成功');
                spin.destroy();
                
                if(closeOnSuccess){
                    this._closeSelf();
                }else{
                    this._hideOnInit();
                    this._search();
                }
                
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _save_upt: function(uptRowsMap){
            var def = $.Deferred();
            
            base.ajax({
                type: 'PUT',
                url: base.getServerNM() + 'platformApi/own/seriesUpdate/periodData',
                data: {
                    uptMap: JSON.stringify(uptRowsMap),
                    clientId: this.clientId,
                    metaCId: this.metaCId
                }
            }).success(function(ret){
                def.resolve();
            }).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _save_del: function(delRowsMap){
            var def = $.Deferred();
            
            base.ajax({
                type: 'DELETE',
                url: base.getServerNM() + 'platformApi/own/seriesUpdate/periodData',
                data: {
                    delMap: JSON.stringify(delRowsMap),
                    clientId: this.clientId,
                    metaCId: this.metaCId
                }
            }).success(function(ret){
                def.resolve();
            }).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _save_add: function(addRowsMap){
            var def = $.Deferred();
            
            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/seriesUpdate/periodData',
                data: {
                    addMap: JSON.stringify(addRowsMap),
                    clientId: this.clientId,
                    metaCId: this.metaCId
                }
            }).success(function(ret){
                def.resolve();
            }).fail(function(){
                def.reject();
            });
            
            return def.promise();
        },
        
        _append: function(){
            var newId = base.uuid();
            
            $(this.domNode).find('.grid>div.gridContainer').jqxGrid(
                'addrow', 
                newId, 
                {id: newId, collectTs: null, version: 1, val: null, oldStr: null, isNew: true, isUpt: false},   //set version to 1 if added manually
                'first'
            );
            
            this._dataChanged();
        },
        
        _import: function(e){
            var spin = new Spin($(this.domNode));
        	
        	ExcelParser.parse(e.currentTarget.files[0]).success(lang.hitch(this, function(data) {
                //sheet. fetch the first sheet
        		var sheet = null;
        		for(var snm in data){
        			sheet = data[snm];
        			break;
        		}
                
                this._parseExcelData(sheet);
        		
        		spin.destroy();
        		
            })).fail(function(err) {
                base.error('错误', err);
                
                spin.destroy();
            });
        },
        
        _parseExcelData: function(data){
            var ids = [], rows = [], tms = [], vals = [];
            var loadedTms = {};
            
            for(var i=0; i<data.length; i++){
                var tmStr = data[i].tm;
                var valStr = data[i].val;
                
                if(Validator.isDateTime(tmStr) && Validator.isDouble(valStr) && base.isNull(loadedTms[tmStr])){
                    loadedTms[tmStr] = tmStr;
                    
                    var tm = base.parseDate(tmStr);
                    var value = parseFloat(valStr);
                    
                    if(base.isNull(this.gridIdMap[tm.getTime() + ''])){
                        var newId = base.uuid();
                        
                        ids.push(newId);
                        rows.push({
                            id: newId, 
                            collectTs: tm.format('yyyy/MM/dd HH:mm:ss.fff'), 
                            version: 1, 
                            val: value, 
                            oldStr: null, 
                            isNew: true, 
                            isUpt: false
                        });
                        
                        tms.push(tm.getTime());
                        vals.push(value);
                    }
                }
            }
            
            if(rows.length > 0){
                $(this.domNode).find('.grid>div.gridContainer').jqxGrid(
                    'addrow', 
                    ids, 
                    rows,
                    'first'
                );

                this._dataChanged();
                
                this._updateChartDataOnAdd_multi(tms, vals, ids);
            }
            
            if(rows.length != data.length){
                base.info('提醒', '成功读取' + rows.length + '条记录, 但有' + (data.length - rows.length) + '条读取失败');
            }
        },
        
        _delete: function(){
            var grid = $(this.domNode).find('.grid>div.gridContainer');
            var delIndexs = grid.jqxGrid('getselectedrowindexes');
            if(delIndexs && delIndexs.length > 0){
                var ids = [], realDelTmStrs = [];
                
                for(var i=0; i<delIndexs.length; i++){
                    var rowid = grid.jqxGrid('getrowid', delIndexs[i]);
                    if(!base.isNull(rowid)){
                        var rowData = grid.jqxGrid('getrowdata', delIndexs[i]);
                        
                        ids.push(rowid);
                        
                        if(!base.isNull(rowData.collectTs)){
                            realDelTmStrs.push(rowData.collectTs);
                        }
                        
                        if(rowData && !rowData.isNew){
                            this.delRowsMap[rowData.collectTs] = parseFloat(rowData.orgVal);
                        }
                    }
                }
                
                if(ids.length > 0){
                    grid.jqxGrid('deleterow', ids);
                    
                    this._updateChartDataOnDelete(realDelTmStrs);
                    
                    this._dataChanged();
                }
                
                $(this.domNode).find('.cmdInfo li.delete').hide();
                grid.jqxGrid('clearselection');
                
            }else{
                base.info('提示', '请选中要删除的行');
            }
        },
        
        _cellRender: function(grid, row, columnfield, value){
            var rowId = grid.jqxGrid('getrowid', row);
            var rowData = grid.jqxGrid('getrowdatabyid', rowId);
            if(rowData.isNew || rowData.isUpt){
                return 'changed';
            }
        },
        
        _refreshGrid: function(data, gridIdMap){
            var source = {
                datatype: "array",
                localdata: data? data : [],
                id: 'id',
                datafields: [
                    { name: 'id', type: 'string'},
                    { name: 'collectTs', type: 'string'},
                    { name: 'version', type: 'int'},
                    { name: 'val', type: 'float'},
                    { name: 'orgVal', type: 'float'},
                    { name: 'oldStr', type: 'string'},
                    { name: 'isNew', type: 'bool'},
                    { name: 'isUpt', type: 'bool'}
                ]
            };
            
            var grid = $(this.domNode).find('.grid>div.gridContainer');
            
            if(!this.gridInited){
                this.gridInited = true;
                
                grid.jqxGridCN({
                    width:'100%',
                    height: '100%',
                    source: new $.jqx.dataAdapter(source),
                    pageable: false,
                    autoheight: false,
                    sortable: false,
                    altrows: false,
                    enabletooltips: false,
                    editable: this.canSave,
                    theme: 'custom-zd',
                    showheader: true,
                    columnsresize: true,
                    selectionmode: 'checkbox',
                    columns: [
                        { text: '采集时间', datafield: 'collectTs', cellsalign: 'center', align: 'center', width: 170, editable: false, 
                            validation: lang.hitch(this, function (cell, value) {
                                if(Validator.isDateTime(value)){
                                    var tmValStr = base.parseDate(value).getTime() + '';
                                    if(base.isNull(this.gridIdMap[tmValStr])){
                                        return true;
                                    }else{
                                        return {result: false, message: "该时间点已经存在"};
                                    }
                                   
                                }else{
                                    return {result: false, message: "格式 yyyy/MM/dd HH:mm:ss.fff"};
                                }
                            }),
                            cellclassname: lang.hitch(this, function(row, columnfield, value){
                                return this._cellRender(grid, row, columnfield, value);
                            })
                        },
                        { text: '数据版本', datafield: 'version', cellsalign: 'center', align: 'center', width: 80, editable: false,
                            cellclassname: lang.hitch(this, function(row, columnfield, value){
                                return this._cellRender(grid, row, columnfield, value);
                            })},
                        { text: '值', datafield: 'val', cellsalign: 'center', align: 'center', width: 90, 
                            validation: function (cell, value) {
                                if(Validator.isDouble(value + '')){
                                   return true; 
                                }else{
                                    return {result: false, message: "只允许数值型"};
                                }
                            },
                            cellclassname: lang.hitch(this, function(row, columnfield, value){
                                return this._cellRender(grid, row, columnfield, value);
                            })
                        },
                        { text: '历史值', datafield: 'oldStr', cellsalign: 'left', align: 'center', editable: false,
                            cellclassname: lang.hitch(this, function(row, columnfield, value){
                                return this._cellRender(grid, row, columnfield, value);
                            }),
                            cellsrenderer: function(row, columnfield, value, defaulthtml, columnproperties){
                                if(!base.isNull(value) && value.length > 0){
                                    var html = '';
                                    
                                    var spanArr = value.split(',');
                                    for(var i=0; i<spanArr.length; i++){
                                        html += '<span class="label label-default">' + spanArr[i] + '</span>';
                                    }
                                    
                                    return html;
                                }else{
                                    return defaulthtml;
                                }
                            }
                        }
                    ]
                }).on('cellbeginedit', lang.hitch(this, function(event){
                    this.editRowIndex = event.args.rowindex;
                    this.editRowField = event.args.datafield;
                    
                })).on('cellendedit', lang.hitch(this, function(event){
                    var rowData = event.args.row;
                    
                    var newValue = event.args.value;
                    var dataField = event.args.datafield;
                    
                    if(!rowData.isNew && dataField == 'val'){
                        rowData.isUpt = parseFloat(newValue) != rowData.orgVal;
                        
                        if(rowData.isUpt){
                            this._dataChanged();
                        }
                        
                        this._updateChartDataOnEdit(rowData.collectTs, newValue);
                    }
                    
                    //refresh the chart data.
                    //  if the row is an new added row. we need to validate the value of its fields before we add to the chart 
                    if(rowData.isNew && 
                       ((dataField == 'collectTs' && !base.isNull(newValue) && newValue.length > 0 && !base.isNull(rowData.val))
                        || (dataField == 'val' && !base.isNull(newValue) && newValue.length > 0 && !base.isNull(rowData.collectTs) && rowData.collectTs.length > 0))
                      ){
                        var tm_Str = dataField == 'collectTs' ? newValue : rowData.collectTs;
                        var val_Str = dataField == 'val' ? newValue : rowData.val;
                        
                        var tmValStr = base.parseDate(tm_Str).getTime() + '';
                        if(base.isNull(this.gridIdMap[tmValStr])){
                            var rowId = grid.jqxGrid('getrowid', rowData.boundindex);
                        
                            this._updateChartDataOnAdd(tm_Str, val_Str, rowId);
                        }else{
                            this._updateChartDataOnEdit(tm_Str, val_Str);
                        }
                    }
                    
                    this.editRowIndex = null;
                    this.editRowField = null;
                    
                })).on('cellclick', lang.hitch(this, function(event){
                    
                    if((!base.isNull(this.editRowIndex) && this.editRowIndex != event.args.rowindex) 
                       || (!base.isNull(this.editRowField) && this.editRowField != event.args.datafield)){
                        grid.jqxGrid('endcelledit', this.editRowIndex, this.editRowField, false);
                    }
                    
                    var boundData = event.args.row.bounddata;
                    //change the editable state of column 'collectTs'.
                    // if the row is a new added row, 'collectTs' can only be set once
                    var canTsEdit = false;
                    if(boundData.isNew && (base.isNull(boundData.collectTs) || boundData.collectTs.length == 0)){
                        canTsEdit = true;
                    }
                    
                    grid.jqxGrid('setcolumnproperty', 'collectTs', 'editable', canTsEdit);
                    
                })).on('rowselect', lang.hitch(this, function(event){
                    this._rowChecked();
                })).on('rowunselect', lang.hitch(this, function(event){
                    this._rowChecked();
                }));
                
            }else{
                grid.jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
            }
            
            this.gridIdMap = gridIdMap;
        },
        
        _refreshChart: function(data, dataIndexMap){
            var chartData = data? data : [];
            
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
            
            var xaxis = {
                type: 'value', //draggable only works in 'value' type
                scale: true,
                //boundaryGap: false,  //does not work, we have to set the min, max property
                splitLine: {show: false},
                axisLabel: {
                    formatter: function(value, index){
                        return (new Date(value)).format('HH:mm MM/dd');
                    }
                }
            };
            
            var option = {
                tooltip: {
                    trigger: 'axis',
                    triggerOn: 'click',
                    formatter: lang.hitch(this, function (params) {
                        if(params.length > 0 && params[0].data && params[0].data.length == 2){
                            var dt = new Date(params[0].data[0]);
                            return dt.format('yyyy/MM/dd HH:mm:ss.fff') + '<br> ' + this.metaCId + '：' + params[0].data[1] + ' ' + (this.yAxisTitle? this.yAxisTitle : '');
                        }else{
                            return null;
                        }
                    })
                },
                grid: {
                    bottom: 40,
                    left: 55,
                    top: 10,
                    right: 30
                },
                title: {
                    show: false
                },
                toolbox: {
                    show: false
                },
                legend: {
                    show: false
                },
                xAxis: xaxis,
                yAxis: {
                    type: 'value',
                    scale: true,
                    boundaryGap: [0, 0.3],
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
                        id: 'dg',  //for drag using
                        type: 'line',
                        smooth: this.smooth,
                        label: {normal: {show: this.showLabel}},
                        symbol: 'emptyCircle',
                        itemStyle: {normal: {color: this.lineColor}},
                        areaStyle: areaStyle,
                        data: chartData
                    }
                ]
            };
            
            this.chart = echarts.init($(this.domNode).find('.chart .chartContainer')[0]);
            this.chart.setOption(option);
            
            this.dragData = chartData;
            this.dragDataIndexMap = dataIndexMap;
            
            this._makeChartDraggable();
        },
        
        _makeChartDraggable: function(){
            var chart = this.chart;
            var dragData = this.dragData;
            var uptPosForDrag = lang.hitch(this, function(){
                this._makeChartDraggable();
            });
            var uptGridOnDrag = lang.hitch(this, function(dataIndex){
                this._updateGridDataOnDrag(dataIndex);
            });
            
            chart.setOption({
                xAxis:{
                    min: dragData.length > 1 ? dragData[0][0] : null,
                    max: dragData.length > 1 ? dragData[dragData.length - 1][0] : null
                },
                graphic: echarts.util.map(dragData, function (item, dataIndex) {
                    return {
                        type: 'circle',
                        cursor: 'n-resize',
                        position: chart.convertToPixel('grid', item),
                        shape: {
                            cx: 0,
                            cy: 0,
                            r: 4
                        },
                        invisible: true,
                        draggable: true,
                        ondrag: echarts.util.curry(function(dataIndex, dx, dy){
                            //this may be a bug of echarts. if you delete some chart data, and then drag the last record, 'dataIndex' get the
                            // wrong value.
                            if(dataIndex >= dragData.length){
                                dataIndex = dragData.length - 1;
                            }
                            
                            //only update yAxis value
                            dragData[dataIndex][1] = chart.convertFromPixel('grid', this.position)[1].toFixed(5);
                            
                            chart.setOption({
                                series: [{
                                    id: 'dg',
                                    data: dragData
                                }]
                            });
                            
                        }, dataIndex),
                        ondragend: echarts.util.curry(function(dataIndex){
                            if(dataIndex >= dragData.length){
                                dataIndex = dragData.length - 1;
                            }
                            
                            uptPosForDrag();
                            
                            uptGridOnDrag(dataIndex);
                            
                        }, dataIndex),
                        onmousemove: echarts.util.curry(function(dataIndex){
                            if(dataIndex >= dragData.length){
                                dataIndex = dragData.length - 1;
                            }
                            
                            chart.dispatchAction({
                                type: 'showTip',
                                seriesIndex: 0,
                                dataIndex: dataIndex
                            });
                        }, dataIndex),
                        onmouseout: echarts.util.curry(function(dataIndex){
                            if(dataIndex >= dragData.length){
                                dataIndex = dragData.length - 1;
                            }
                            
                            chart.dispatchAction({
                                type: 'hideTip'
                            });
                        }, dataIndex),
                        z: 100
                    };
                })
            });
            
            chart.off('dataZoom');
            chart.on('dataZoom', uptPosForDrag);
        },
        
        _updatePositionForDrag: function(){
            var chart = this.chart;
            var dragData = this.dragData;
            
            chart.setOption({
                graphic: echarts.util.map(this.dragData, function (item, dataIndex) {
                    return {
                        position: chart.convertToPixel('grid', item)
                    };
                })
            });
        },
        
        _updateGridDataOnDrag: function(dataIndex){
            var tmVal = this.dragData[dataIndex][0];
            var newVal = this.dragData[dataIndex][1];
            
            var gridRowId = this.gridIdMap[tmVal + ''];
            if(!base.isNull(gridRowId)){
                var grid = $(this.domNode).find('.grid>div.gridContainer');
                
                var rowBoundIndex = grid.jqxGrid('getrowboundindexbyid', gridRowId);
                
                grid.jqxGrid('setcellvalue', rowBoundIndex, 'val', newVal);
                
                //reRender. fire the 'cellendedit' event
                grid.jqxGrid('begincelledit', rowBoundIndex, 'val');
                grid.jqxGrid('endcelledit', rowBoundIndex, 'val', false);
            }
        },
        
        _updateChartDataOnEdit: function(tmStr, newVaule){
            var tm = base.parseDate(tmStr);
            var dataIndex = this.dragDataIndexMap[tm.getTime() + ''];
            
            if(!base.isNull(dataIndex)){
                this.dragData[dataIndex][1] = parseFloat(newVaule);
            
                this._refreshDragData();
            }
        },
        
        _updateChartDataOnDelete: function(realDelTmStrs){
            var delIndexs = [];
            
            for(var i=0; i<realDelTmStrs.length; i++){
                var tmValStr = base.parseDate(realDelTmStrs[i]).getTime() + '';
                
                var dataIndex = this.dragDataIndexMap[tmValStr];
                if(!base.isNull(dataIndex)){
                    delIndexs.push(dataIndex);
                }
                
                delete this.gridIdMap[tmValStr];
            }
            
            //splice in array
            delIndexs.sort(function(a, b){
            	return Number(a) - Number(b);
            });
            for(var i=0, pos=0; i<delIndexs.length; i++, pos++){
               this.dragData.splice(delIndexs[i] - pos, 1);
            }
            
            //update dragDataIndexMap
            var newMap = {};
            for(var i=0; i<this.dragData.length; i++){
                newMap[this.dragData[i][0] + ''] = i;
            }
            this.dragDataIndexMap = newMap;
            
            this._refreshDragData();
        },
        
        _updateChartDataOnAdd: function(tmStr, valStr, rowId){
            var tm = base.parseDate(tmStr);
            var val = parseFloat(valStr);
            
            //get the insert index
            var pos = this._binarySearch(tm.getTime());
            this.dragData.splice(pos, 0, [tm.getTime(), val]);
            
            //update dragDataIndexMap.
            //   move 'dragDataIndexMap' right 1 bit since index 'pos'
            for(var i=pos; i<this.dragData.length; i++){
                this.dragDataIndexMap[this.dragData[i][0] + ''] = i;
            }
            
            this.gridIdMap[tm.getTime() + ''] = rowId;
            
            this._refreshDragData();
        },
        
        _updateChartDataOnAdd_multi: function(tms, vals, ids){
            for(var i=0; i<tms.length; i++){
                var pos = this._binarySearch(tms[i]);
                this.dragData.splice(pos, 0, [tms[i], vals[i]]);
                
                this.gridIdMap[tms[i] + ''] = ids[i];
            }
            
            //update dragDataIndexMap.
            //  reset all
            this.dragDataIndexMap = {};
            for(var i=0; i<this.dragData.length; i++){
                this.dragDataIndexMap[this.dragData[i][0] + ''] = i;
            }
            
            this._refreshDragData();
        },
        
        _binarySearch: function(tmVal){
            var low = 0, high = this.dragData.length - 1, mid = 0;
            
            while(low < high){
                var lVal = this.dragData[low][0];
                if(lVal >= tmVal){
                    return low;
                }
                
                var hVal = this.dragData[high][0];
                if(hVal <= tmVal){
                    return high + 1;
                }
                
                mid = low + parseInt((high - low) / 2);
                var mVal = this.dragData[mid][0];
                
                if(mVal == tmVal){
                    return mid;
                }else if(mVal < tmVal){
                    low = mid + 1;
                }else{
                    high = mid - 1;
                }
            }
            
            return mid > low ? mid : low;
        },
        
        _refreshDragData: function(){
            this.chart.setOption({
                series: [{
                    id: 'dg',
                    data: this.dragData
                }]
            });
            
            this._makeChartDraggable();
        },
        
        _resizeManual: function(){
            $(this.domNode).find('.grid>div.gridContainer').jqxGrid('refresh');
            
            if(this.chart){
                this.chart.resize();
                
                this._makeChartDraggable();
            }
        },
        
        //filter invalid record
        _filterSeriesData: function(data){
            var chkObj = null;
            var preKey = '';
            
            var chartArr = [], chartIndexMap = {}, gridArr = [], gridIdMap = {}, historyMap = {};
            
            var getOldVersionDesc = function(rec){
                var history = historyMap[rec[0]];
                var retStr = '';
                
                if(history && history.length > 1){
                    //order by version desc
                    for(var i=0; i<history.length-1; i++){
                        for(var j=i+1; j<history.length; j++){
                            var tmpA = history[i];
                            var tmpB = history[j];
                            if(tmpA[2] < tmpB[2]){
                                history[i] = tmpB;
                                history[j] = tmpA;
                            }
                        }
                    }
                    
                    //ignore the current version(max version)
                    for(var i=1; i<history.length; i++){
                        var tmStr = (new Date(parseInt(history[i][1]))).format('yyyy/MM/dd HH:mm:ss');
                        //abnormal string will shown when you scroll the grid if you using html node. 
                        //  using cellsrenderer to display html
                        /*retStr += '<span class="label label-default">[' + tmStr + '] ' + history[i][4] + '</span>';*/
                        retStr += '[' + tmStr + '] ' + history[i][4] + ',';
                    }
                    
                    retStr = retStr.substr(0, retStr.length - 1);
                }
                
                return retStr;
            };
            
            var dealRecord = function(rec){
                //deleted
                if(parseInt(rec[3]) > 0){
                    return;
                }
                
                //cast utc to local time
                var localTM = new Date(rec[5]);
                
                chartArr.push([localTM.getTime(), rec[4]]);
                chartIndexMap[localTM.getTime() + ''] = chartArr.length - 1;
                var autoId = base.uuid();
                
                gridArr.push({
                    id: autoId,
                    collectTs: localTM.format('yyyy/MM/dd HH:mm:ss.fff'), 
                    version: rec[2],
                    val: rec[4],
                    orgVal: rec[4],
                    oldStr: getOldVersionDesc(rec),
                    isNew: false,
                    isUpt: false
                });
                //'id' is the id field of the grid
                gridIdMap[localTM.getTime() + ''] = autoId;
            };
            
            for(var i=0; i<data.length; i++){
                //columns: [time、crtTs、version、deleted、val、collectTs]
                var row = data[i];
                //version
                row[2] = parseInt(row[2]);
                //time
                row[5] = parseInt(row[5]);
                
                var history = historyMap[row[5]];
                if(!history){
                    history = [];
                    historyMap[row[5]] = history;
                }
                history.push(row);
                
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
            
            return {chartData: chartArr, gridData: gridArr, chartIndexMap: chartIndexMap, gridIdMap: gridIdMap};
        },
        
        _setData: function(){
            if($(this.domNode).find('form .save').is(':visible')){
                base.confirmSave('提示', '数据已修改，是否保存?', lang.hitch(this, function(){
                    this._save();
                    this._search();

                }), lang.hitch(this, function(){
                    this._search();
                }));
                
            }else{
                this._search();
            }
        },
        
        _search: function(){
            var spin = new Spin($(this.domNode));
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/series/periodData',
                data: {
                    clientId: this.clientId,
                    metaCId: this.metaCId,
                    stm: $(this.domNode).find('form .stm').val(),
                    etm: $(this.domNode).find('form .etm').val()
                }
            }).success(lang.hitch(this, function(ret){
                var data = this._filterSeriesData(ret.data);
                
                this._refreshGrid(data.gridData, data.gridIdMap);
                this._refreshChart(data.chartData, data.chartIndexMap);
                
                this._resizeManual();
                
                this._hideOnInit();
                $(this.domNode).find('.grid>div.gridContainer').jqxGrid('clearselection');
                
                spin.destroy();
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _hideOnInit: function(){
            $(this.domNode).find('form .save').hide();
            $(this.domNode).find('.cmdInfo .delete').hide();
            
            this.delRowsMap = {};
        },
        
        _closeSelf: function(){
            topic.publish('common/widget/sysMetas/serialLine/closeModal');
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/sysMetas/serialLine/modalClosing', lang.hitch(this, function(){
                if($(this.domNode).find('form .save').is(':visible')){
                    base.confirmSave('提示', '数据已修改，是否保存?', lang.hitch(this, function(){
                        this._save(true);
                        
                    }), lang.hitch(this, function(){
                        this._closeSelf();
                    }));
                }else{
                    this._closeSelf();
                }
            }));
            
            this.own(sub1);
        }
    });
});
