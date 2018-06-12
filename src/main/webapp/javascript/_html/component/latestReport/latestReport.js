define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "dijit/_TemplatedMixin",
    "tool/_BaseWidget",
    "root/customScrollbar/CustomScrollBar",
    "root/waterfall/pinto",
    "root/excelBuilder/ExcelBuilder",
    "root/spin/Spin",
    "component/dataMonitor/widget/clientPrevCard/clientPrevCard",
    "dojo/text!./template/latestReport.html",
    "tool/css!./css/latestReport.css"
], function (base,
             declare,
             lang,
             topic,
             _TemplatedMixin,
             _Widget,
             CustomScrollBar,
             Pinto,
             ExcelBuilder,
             Spin,
             ClientPrevCard,
             template) {

    return declare("component.latestReport", [_Widget, _TemplatedMixin], {
        'baseClass': "component_latestReport",
        templateString: template,
        
        selfAuth: true,
        
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

            this.defer(lang.hitch(this, function () {
                CustomScrollBar.init($(this.domNode).find('.reportContainer>.cc, .reportContainer>.gg .qq'));

                var gg = $(this.domNode).find('.reportContainer>.gg');
                CustomScrollBar.init(gg, 'x', null, false);
                
                gg.find('.ggInner').parent().css('height', '100%');
                
                this._refreshView('grid');
                
            }), 500);
        },

        destroy: function () {
            this._destroyPrevCardPlugins();

            this._destroyMetadataShowPlugin();

            this.inherited(arguments);
        },

        _initDom: function () {
            this._initDom_common();
        },

        _initDom_common: function () {
            $(this.domNode).find('form button.search').click(lang.hitch(this, function () {
                if($(this.domNode).find('.btn-group input.tableView').is(':checked')) {
                    this._refreshView('grid');
                }else{
                    this._refreshView('widget');
                }
            }));

            $(this.domNode).find('form input').keydown(lang.hitch(this, function (event) {
                if(event.which == 13) {
                    $(this.domNode).find('form button.search').click();
                    return false;
                }
            }));

            $(this.domNode).find('.btn-group input').change(lang.hitch(this, function (e) {
                if($(e.currentTarget).is(':checked')) {
                    $(this.domNode).find('.btn-group>label').removeClass('active btn-success btn-default').addClass('btn-default');
                    $(e.currentTarget).parent().removeClass('btn-default').addClass('btn-success');

                    $(this.domNode).find('.reportContainer').toggleClass('showGrid');

                    if($(e.currentTarget).hasClass('tableView')) {   
                    	this._toggleExportBtn(true);
                    	
                    	if(this.gridView){                   		
                    		$(this.domNode).find(".reportContainer > .cc").hide();
                    		$(this.domNode).find(".reportContainer > .gg").show();
                    	}else{                    		
                    		this._refreshView('grid');
                    	}                	
                    }else{                     
                    	this._toggleExportBtn(false);
                    	
                        if(this.widgetView){
                        	$(this.domNode).find(".reportContainer > .gg").hide();
                        	$(this.domNode).find(".reportContainer > .cc").show();                       	 
                        }else{                       	
                        	this._refreshView('widget');
                        }
                    }
                }
            }));
        },

        _destroyPrevCardPlugins: function () {
            if(this.destroyPrevCardArray) {
                for (var i = 0; i < this.destroyPrevCardArray.length; i++) {
                    this.destroyPrevCardArray[i].destroyRecursive();
                    this.destroyPrevCardArray[i] = null;
                }
                this.destroyPrevCardArray = null;
            }
        },

        _createPrevCard: function (spin, parent, data, totalSize) {
            this.prevCardPlugin = new ClientPrevCard({hideStar: true, hideTooltip: true});
            this.prevCardPlugin.startup();

            this.destroyPrevCardArray.push(this.prevCardPlugin);

            parent.append($(this.prevCardPlugin.domNode).hide());
            this.prevCardPlugin.refresh(data);

            this.curSize++;
            if(this.curSize == totalSize) {
                parent.pintoLayOut();
                parent.children().show();

                spin.destroy();
                
                this.widgetView = true;
            }
        },

        _showWidgetData: function (spin, data) {
            this._destroyPrevCardPlugins();

            this.destroyPrevCardArray = [];

            this.curSize = 0;

            var parent = $(this.domNode).find('.reportContainer .widgetCC');
            parent.empty();

            parent.pinto({
                itemWidth: 330
            });

            if(data.length > 0) {
                for (var i = 0; i < data.length; i++) {
                    this._createPrevCard(spin, parent, data[i], data.length);
                }
            }else{
                spin.destroy();
            }
        },
        
        _getColumnName: function(colObj){
            var str = "";
            if(colObj.meta_NM && colObj.meta_NM.length > 0){
                str = colObj.meta_NM; 
            }else{
                str = colObj.meta_CID;
            }
            
            var unit = colObj.meta_UNIT && colObj.meta_UNIT.length > 0? (' (' + colObj.meta_UNIT + ')') : '';
            
            return str + unit;
        },

        _showGridData: function (spin, data) {
            var parent = $(this.domNode).find('.reportContainer .grid').empty();                
            var tHeadParent = $(this.domNode).find('.reportContainer .tHead').empty();  
            
            if(data.length > 0) {
                this.rows = [];
                this.colMap = {};
                this.colMapByIndex = {};
                this.colNums = 0;
                
                for (var i = 0; i < data.length; i++) {
                    var row = {
                        c_ID: data[i].c_ID,
                        c_NM: data[i].c_NM
                    };
                    
                    for (var j = 0; j < data[i].metaInfo.length; j++) {
                        var tmpMeta = data[i].metaInfo[j];
                        
                        var tmpCol = this.colMap[tmpMeta.meta_CID];
                        if(!tmpCol){
                            var addObj = {
                                index: this.colNums,
                                meta_NM: tmpMeta.meta_NM,
                                meta_UNIT: tmpMeta.meta_UNIT,
                                meta_CID: tmpMeta.meta_CID
                            };
                            
                            this.colMap[tmpMeta.meta_CID] = addObj;
                            this.colMapByIndex[this.colNums] = addObj;
                            
                            this.colNums++;
                            
                        }else{
                            if(!base.isNull(tmpMeta.meta_NM) && tmpMeta.meta_NM.length > 0){
                                tmpCol.meta_NM = tmpMeta.meta_NM;
                            }
                            if(!base.isNull(tmpMeta.meta_UNIT) && tmpMeta.meta_UNIT.length > 0){
                                tmpCol.meta_UNIT = tmpMeta.meta_UNIT;
                            }
                        }
                        
                        row['ex_' + tmpMeta.meta_CID] = tmpMeta;
                    }
                    this.rows.push(row);
                }
                
                tHeadParent.empty();
                parent.empty();
                
                var tableHead = $("<table style='text-align: center;'></table>");
                if(this.colNums > 0){
                    var trH1Str = '<tr><td class="fFixed" rowspan="2">设备编号</td><td class="fFixed" rowspan="2">设备名称</td>';
                    var trH2Str = '<tr>'
                
                    for(var i=0; i<this.colNums; i++){
                        trH1Str += '<td colspan="2">' + this._getColumnName(this.colMapByIndex[i]) + '</td>';
                        trH2Str += '<td class="fixed">时间</td><td class="fixed">数据值</td>';
                    }
                    
                    trH1Str += '</tr>';
                    trH2Str += '</tr>';
                    
                    tableHead.append($(trH1Str));
                    tableHead.append($(trH2Str));
                    
                }else{
                    tableHead.append($('<tr><td class="fFixed" style="height: 64px">设备编号</td><td class="fFixed">设备名称</td>'));
                }
                
                var table = $("<table style='text-align: center; margin-bottom: 10px;'></table>");
                for (var m = 0; m < this.rows.length; m++) {
                    var trB = $("<tr class='ctr'>");
                    trB.append($("<td class='detail fFixed'>" + this.rows[m].c_ID + "</td>").data("metaInfo", data[m]));
                    trB.append($("<td class='fFixed'>" + this.rows[m].c_NM + "</td>"));
                    
                    for (var n = 0; n < this.colNums; n++) {
                        var key = 'ex_' + this.colMapByIndex[n].meta_CID;
                        
                        var metaObj = this.rows[m][key];
                        
                        if(metaObj){
                        	var time;
                        	if(base.isNull(metaObj.latest_TM)){
                        		time = "";
                        	}else{                        		
                        		time = new Date(metaObj.latest_TM).format("MM/dd HH:mm:ss");
                        	}
                            
                            this.rows[m]["meta_TM_" + n] = time;
                            
                            trB.append($("<td class='fixed'>" + time + "</td>"));
                            if(metaObj.preview_TP == "image") {
                            	this.rows[m]["meta_VAL_" + n] = '图像';
                                trB.append($("<td class='fixed'><i class='fa fa-image'></i></td>"));
                                
                            }else if(metaObj.preview_TP == "video") {
                            	this.rows[m]["meta_VAL_" + n] = '图像';
                                trB.append($("<td class='fixed'><i class='fa fa-video-camera'></i></td>"));
                                
                            }else{
                                this.rows[m]["meta_VAL_" + n] = metaObj.latest_VAL;
                            	trB.append($("<td class='fixed'>" + metaObj.latest_VAL + "</td>"));
                            }
                            
                        }else{
                            this.rows[m]["meta_TM_" + n] = null;
                            this.rows[m]["meta_VAL_" + n] = null;
                            
                            trB.append($("<td class='fixed'></td>"));
                            trB.append($("<td class='fixed'></td>"));
                        }
                    }
                    table.append(trB);
                }
                
                parent.append(table);
                tHeadParent.append(tableHead);
                
                this._addClickEvent();
                
                this.gridView = true;
            }
            
            //bug fix
            this.defer(function(){
                CustomScrollBar.update($(this.domNode).find('.reportContainer>.gg'), 'x');

            }, 300);
            
            spin.destroy();
        },

        _addClickEvent: function () {
            $(this.domNode).find(".reportContainer.showGrid > div:last-child table td.detail").click(lang.hitch(this, function (e) {
                var clientMetaData = $(e.currentTarget).data("metaInfo");
                
                this._metadataShow(clientMetaData);
            }));
            
            var ctrs = $(this.domNode).find(".reportContainer.showGrid > div:last-child table tr.ctr");
            ctrs.click(lang.hitch(this, function(e){
            	var cur = $(e.currentTarget);
            	if(!cur.hasClass('active')){
            		ctrs.removeClass('active');
                	$(e.currentTarget).addClass('active');
            	}
            }));
            
            this._toggleExportBtn(true);
        },
        
        _toggleExportBtn: function(showExport){
        	var exportBtn = $(this.domNode).find('form button.btn-warning');  
        	if(showExport){
        		 exportBtn.show();
        		
        		 exportBtn.unbind().click(lang.hitch(this, function () {
                     this._exportExcel();
                 }));
        	}else{
        		 exportBtn.hide();
        	}
        },

        _exportExcel: function () {         
        	var fileNm = new Date().format("yyyy.MM.dd HH:mm").toString() + "报告.csv";     
        	
            var columns = {c_ID: '设备ID', c_NM: '设备名称'};
            var ordedKeys = ["c_ID", "c_NM"];

            for (var i = 0; i < this.colNums; i++) {
                var colNM = this._getColumnName(this.colMapByIndex[i]);
                columns["meta_TM_" + i] = colNM + "(时间)";
                columns["meta_VAL_" + i] = colNM + "(数据值)";
                
                ordedKeys.push("meta_TM_" + i);
                ordedKeys.push("meta_VAL_" + i);
            }
            
            ExcelBuilder.exportData(this.rows, columns, fileNm, ordedKeys);
        },

        _destroyMetadataShowPlugin: function () {
            if(this.metadataShowPlugin) {
                this.metadataShowPlugin.destroyRecursive();
                this.metadataShowPlugin = null;
            }
        },

        _metadataShow: function (data) {
            this._destroyMetadataShowPlugin();

            base.newDojo(
                "component/dataMonitor/widget/metadataShow/metadataShow",
                "metadataShow",
                {
                    metaInfo: data.metaInfo,
                    c_ID: data.c_ID,
                    c_NM: data.c_NM
                }
            ).success(lang.hitch(this, function (obj) {
                this.metadataShowPlugin = obj;

                this.metadataShowPlugin.startup();

                $(this.domNode).find(".modal.metaDataShow .modal-body").empty().append($(this.metadataShowPlugin.domNode));

                $(this.domNode).find(".modal.metaDataShow").modal("show");
            }));
        },

        _refreshView: function (tp) {
            var spin = new Spin($(this.domNode));

            base.ajax({
                url: base.getServerNM() + 'platformApi/own/client/normal/latestDataReport',
                data: {
                    search: $(this.domNode).find('form input').val().trim()
                }
            }).success(lang.hitch(this, function (ret) {          	
            	
                this.latestClientMetaData = ret.data;               

                if(tp == 'grid') {
                    this._showGridData(spin, this.latestClientMetaData);
                }else{
                    this._showWidgetData(spin, this.latestClientMetaData);
                }

            })).fail(function () {
                spin.destroy();
            });
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleMetaList', lang.hitch(this, function (data) {

                this._metadataShow(data);
            }));

            this.own(sub1);
        }
    });
});