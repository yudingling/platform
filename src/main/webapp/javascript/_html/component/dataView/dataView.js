
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    'root/slider/Slider',
    "common/widget/deviceActionTree/deviceActionTree",
    'root/bootstrap-switch/BSwitch',
    "root/dateTimePicker/DateTimePicker",
    "root/customScrollbar/CustomScrollBar",
    'root/rangeSlider/RangeSlider',
    'root/rangeSlider/js/moment',
    './widget/horizontalMetas/horizontalMetas',
    './widget/verticalMetas/verticalMetas',
    "dojo/text!./template/dataView.html",
    "tool/css!./css/dataView.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        Slider,
        DeviceActionTree,
        BSwitch,
        DateTimePicker,
        CustomScrollBar,
        RangeSlider, 
        moment,
        HorizontalMetas,
        VerticalMetas,
        template){
    
    return declare("component.dataView", [_Widget], {
        baseClass: "component_dataView",
        templateString: template,
        
        selfAuth: true,
        
        constructor: function (args) {
        	this.metaObjs = {};
        	
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
            }), 500);
        },
        
        destroy: function(){
            this._clearMeta();
            
            if(this.tmRange){
                this.tmRange.destroy();
            }
            
        	this.inherited(arguments);
        },
        
        _initDom: function(){
        	//todo. support mobile browser, ztree did nothing on this
        	this.tree = new DeviceActionTree({groupSelect: false, maxTitleAsciiLen: 35});
        	$(this.domNode).find('.content .list').append($(this.tree.domNode));
        	this.tree.startup();
            this.own(this.tree);
            
            BSwitch.init($(this.domNode).find('.nav .bswitch'), {
        		handleWidth: 45, 
        		size: 'small', 
        		onColor: 'info', 
        		offColor: 'success', 
        		onText: '单选', 
        		offText: '多选', 
        		state: true, 
        		wrapperClass: 'bs', 
                animate: false,
        		onChange: lang.hitch(this, function(e, data){
                    if(data){
                        this._showHorzMeta();
                    }else{
                        this._showVertMeta();
                    }
                    
                    topic.publish('common/widget/dat/toggleDelete');
        		})});
            
            $(this.domNode).find('.topSearch button').click(lang.hitch(this, function(){
                topic.publish('common/widget/sysMetas/refresh', this._getTMObj());
            }));
            
            this.sdp = new DateTimePicker($(this.domNode).find('.topSearch .stm'), 'Y-m-d H:i:S');
            this.own(this.sdp);
            
            this.edp = new DateTimePicker($(this.domNode).find('.topSearch .etm'), 'Y-m-d H:i:S');
            this.own(this.edp);
            
            this._showHorzMeta();
            
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
        },
        
        _metaDivChange: function(vert){
            this.tree.clearSelect();
            
            if(vert){
                $(this.domNode).find('.content>.detail').addClass('vertShow');
                if(this.vertMetaSlider){
                    this.vertMetaSlider.show();
                }
            }else{
                $(this.domNode).find('.content>.detail').removeClass('vertShow');
                if(this.vertMetaSlider){
                    this.vertMetaSlider.hide(true);
                }
            }
            
            //clear metadata content
            this._clearMeta();
        },
        
        _showVertMeta: function(){
            if(!this.vertMetaSlider){
                this.vertMetaSlider = new Slider($(this.domNode).find('.vertMetaDiv'), {
                    dependObj: $(this.domNode).find('.metaDataDiv'),
                    position: {top: '0px', right: '0px', bottom: '0px'},
                    direction: 'left',
                    animateWhenHide: true,
                    easing: 'easeOutCirc',
                    opacity: 0.95,
                    backgroundColor: '#fff',
                    width: 200,
                    zindex: null,
                    showOnInit: false,
                    retainSize: 0,
                    pullBtn: true});
                
                this.own(this.vertMetaSlider);
            };
            
            if(!this.vertMetas){
                this.vertMetas = new VerticalMetas();
                
                $(this.domNode).find('.content .vertMetaDivInner').append($(this.vertMetas.domNode));
                this.vertMetas.startup();
                this.own(this.vertMetas);
            }
            
            //you got to create  slider first, then call the method below to make slider visible
            this._metaDivChange(true);
            
            this.vertMetas.refresh();
        },
        
        _showHorzMeta: function(){
            if(!this.horzMetas){
                this.horzMetas = new HorizontalMetas();
                
                $(this.domNode).find('.content .horzMetaDiv').append($(this.horzMetas.domNode));
                this.horzMetas.startup();
                this.own(this.horzMetas);
            }
            
            this._metaDivChange(false);
            
            this.horzMetas.refresh(null);
        },
        
        _addMeta: function(clientId, clientNm, metadata){
            this._getSysMetaPlugin(metadata.sysmeta_ID, lang.hitch(this, function(plugin){
                if(plugin){
                    var args = $.extend(
                        {}, 
                        base.evalJson(plugin.p_PARAM), 
                        this._getTMObj(), 
                        {clientId: clientId, clientNm: clientNm, metaId: metadata.meta_ID, metaCId: metadata.meta_CID, metaNm: metadata.meta_NM, metaUnit: metadata.meta_UNIT});
                    
                    base.newDojo(plugin.p_PATH, '', args).success(lang.hitch(this, function(obj){
                        
                        $(this.domNode).find('.content .metaDataDivContent').append($(obj.domNode));
                        obj.startup();
                        
                        this.metaObjs[metadata.meta_ID] = obj;
                    }));
                }
            }));
        },
        
        _removeMeta: function(clientId, metadata){
            var obj = this.metaObjs[metadata.meta_ID];
            if(obj){
                this._removeMetaSlc(obj);
                delete this.metaObjs[metadata.meta_ID];
            }
        },
        
        _clearMeta: function(){
            for(var meta_ID in this.metaObjs){
                this._removeMetaSlc(this.metaObjs[meta_ID]);
            }
            this.metaObjs = {};
        },
        
        _removeMetaSlc: function(pluginObj){
        	pluginObj.destroyRecursive();
        },
        
        _changeTMSelectType: function(){
            var stmDom = $(this.domNode).find('.topSearch .stm');
            var etmDom = $(this.domNode).find('.topSearch .etm');
            
            var detailDom = $(this.domNode).find('.content .detail');
            
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
            
            if($(this.domNode).find('.content .detail').hasClass('showRange')){
                stm = moment(this.tmRange.from(), "X").format("YYYY-MM-DD 00:00:00");
                etm = moment(this.tmRange.to(), "X").format("YYYY-MM-DD 23:59:59");
                
            }else{
                stm = $(this.domNode).find('.topSearch .stm').val();
                etm = $(this.domNode).find('.topSearch .etm').val();
            }
            
            return {stm: stm, etm: etm};
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
        
        _initEvents: function () {
            var sub1 = topic.subscribe('component/dataView/meta/change', lang.hitch(this, function(data){
                if(data.selected){
                    this._addMeta(data.clientId, data.clientNm, data.metadata);
                }else{
                    this._removeMeta(data.clientId, data.metadata);
                }
            }));
            
            this.own(sub1);
        }
    });
});
