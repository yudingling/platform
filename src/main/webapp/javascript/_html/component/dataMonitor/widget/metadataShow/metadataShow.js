define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/_base/event",
    "common/widget/zTree/zTree",
    "root/dateTimePicker/DateTimePicker",
    'root/rangeSlider/js/moment',
    'root/rangeSlider/RangeSlider',
    "root/customScrollbar/CustomScrollBar",
    "dojo/text!./template/metadataShow.html",
    "tool/css!./css/metadataShow.css"
], function(
       base,
        declare,
        _Widget,
        lang,
        topic,
        event,
        ZTree,
        DateTimePicker,
        moment,
        RangeSlider,
        CustomScrollBar,
        template){
	
	return declare("component.dataMonitor.widget.metadataShow", [_Widget], {
        baseClass: "component_dataMonitor_widget_metadataShow",
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
            	CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
                
                if(this.treeSelectDefer){
                    this.treeSelectDefer.resolve();
                    this.treeSelectDefer = null;
                }
            }), 500);
        },
        
        destroy: function(){
            this._destroyCurrentPlugin();
            
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            this._createTree();
            
            $(this.domNode).find('.topSearch button').click(lang.hitch(this, function(){
                topic.publish('common/widget/sysMetas/refresh', this._getTMObj());
            }));
            
            this.sdp = new DateTimePicker($(this.domNode).find('.topSearch .stm'), 'Y-m-d H:i:S');
            this.own(this.sdp);
            
            this.edp = new DateTimePicker($(this.domNode).find('.topSearch .etm'), 'Y-m-d H:i:S');
            this.own(this.edp);
            
            moment.locale('zh-cn');
            this.tmRange = new RangeSlider($(this.domNode).find('.topSearch .tmRange input'),{
                type: 'double',
                min: moment().subtract(2, "months").format("X"),
                max: moment().format("X"),
                from: moment().subtract(5, "days").format("X"),
                to: moment().format("X"),
                hide_min_max: true,
                grid: true,
                prettify: function (num) {
                    return moment(num, "X").format("LL");
                },
                onFinish: lang.hitch(this, function(args){
                    topic.publish('common/widget/sysMetas/refresh', this._getTMObj());
                })
            });
            
            $(this.domNode).find('.switchTmSel').click(lang.hitch(this, function(){
                this._changeTMSelectType();
            }));
            
            $(this.domNode).find('.mdContent').on('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                this.defer(function(){
                    $(window).trigger("resize");
                }, 50);
            }));
        },
        
        _changeTMSelectType: function(){
            var stmDom = $(this.domNode).find('.topSearch .stm');
            var etmDom = $(this.domNode).find('.topSearch .etm');
            
            var detailDom = $(this.domNode).find('.mdContent');
            
            if(detailDom.hasClass('showRange')){
                stmDom.val(moment(this.tmRange.from(), "X").format("YYYY-MM-DD 00:00:00"));
                etmDom.val(moment(this.tmRange.to(), "X").format("YYYY-MM-DD 23:59:59"));
                
                this.sdp.setDate(stmDom.val());
                this.edp.setDate(etmDom.val());
                
            }else{
                var stm = stmDom.val().length > 0? moment(stmDom.val(), "YYYY-MM-DD HH:mm:ss") : moment().subtract(5, "days");
                var etm = stmDom.val().length > 0? moment(etmDom.val(), "YYYY-MM-DD HH:mm:ss") : moment();
                
                var min = moment.unix(this.tmRange.min());
                var max = moment.unix(this.tmRange.max());
                if(stm < min){
                    min = stm.clone().subtract(2, "months");
                }else{
                    var tmpMin = max.clone().subtract(2, "months");
                    if(stm > tmpMin){
                        min = tmpMin;
                    }
                }
                         
                if(etm > max){
                    max = etm;
                }else if(etm < max && etm < moment()){
                    max = moment();
                }
                
                this.tmRange.update({min: min.format("X"), max: max.format("X"), from: stm.format("X"), to: etm.format("X")});
            }
            
            detailDom.toggleClass('showRange');
        },
        
        _getTMObj: function(){
            var stm;
            var etm;
            
            if($(this.domNode).find('.mdContent').hasClass('showRange')){
                stm = moment(this.tmRange.from(), "X").format("YYYY-MM-DD 00:00:00");
                etm = moment(this.tmRange.to(), "X").format("YYYY-MM-DD 23:59:59");
                
            }else{
                stm = $(this.domNode).find('.topSearch .stm').val();
                etm = $(this.domNode).find('.topSearch .etm').val();
            }
            
            return {stm: stm, etm: etm};
        },
        
        _createTree: function(){
            var rows = [];
            for(var i=0; i<this.metaInfo.length; i++){
                var item = this.metaInfo[i];
                rows.push({
                    id: item.meta_ID, 
                    pId: null,
                    name: item.meta_NM && item.meta_NM.length > 0? item.meta_NM : item.meta_CID, 
                    nocheck: true,
                    meta_NM: item.meta_NM,
                    meta_CID: item.meta_CID,
                    sysmeta_ID: item.sysmeta_ID,
                    meta_UNIT: item.meta_UNIT
                });
            }
            
            this.treeSelectDefer = $.Deferred();
            this.mdTree = new ZTree({
                treeObj: $(this.domNode).find('.mdList ul'),
                urlOrData: rows, 
                expandFirst: true,
                render: null, 
                click: lang.hitch(this, function(treeNode){
                    if(this.treeSelectDefer){
                        //call after shown
                        this.treeSelectDefer.done(lang.hitch(this, function(){
                            this._selectItem(treeNode);
                        }));
                        
                    }else{
                        this._selectItem(treeNode);
                    }
                })
            });
            this.mdTree.startup();
            this.own(this.mdTree);
        },
        
        _selectItem: function(node){
            if(this.preSelect && this.preSelect.tId == node.tId){
                return;
			}
            this.preSelect = node;
            
            var parent = $(this.domNode).find('.mdContent>.metaDataDiv');
            
            this._destroyCurrentPlugin();
            parent.html(null);
            
            if(node.sysmeta_ID){
                this._getSysMetaPlugin(node.sysmeta_ID, lang.hitch(this, function(plugin){
                    if(plugin){
                        var args = $.extend(
                            {}, 
                            base.evalJson(plugin.p_PARAM), 
                            this._getTMObj(), 
                            {showEditor: false},
                            {clientId: this.c_ID, clientNm: this.c_NM, metaId: node.id, metaCId: node.meta_CID, metaNm: node.meta_NM, metaUnit: node.meta_UNIT});

                        base.newDojo(plugin.p_PATH, '', args).success(lang.hitch(this, function(obj){
                            this.currentPlugin = obj;
                            
                            parent.append($(this.currentPlugin.domNode));
                            this.currentPlugin.startup();
                        }));
                    }
                }));
                
            }else{
                parent.html('<div class="empty center">未配置系统元数据映射</div>');
            }
        },
        
        _destroyCurrentPlugin: function(){
            if(this.currentPlugin){
                this.currentPlugin.destroyRecursive();
                this.currentPlugin = null;
            }
        },
        
        _getSysMetaPlugin: function(sysMetaId, callBack){
            if(this.sysMetaPluginMap){
                if(callBack){
                    callBack(this.sysMetaPluginMap[sysMetaId]);
                }
                
            }else{
                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/own/client/normal/sysMetaPlugins'
                }).success(lang.hitch(this, function(ret){
                    this.sysMetaPluginMap = ret.data;
                    if(callBack){
                        callBack(this.sysMetaPluginMap[sysMetaId]);
                    }
                }));
            }
        },
        
        _initEvents: function(){
        }
	});
});
