define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    'root/rangeSlider/RangeSlider',
    'root/rangeSlider/js/moment',
    "dojo/text!./template/commonDetail.html",
    "tool/css!./css/commonDetail.css"
], function (base,
             declare,
             _Widget,
             lang,
             topic,
             CustomScrollBar,
             RangeSlider,
             moment,
             template) {

    return declare("main.mobile.dataMonitor.commonDetail", [_Widget], {
        baseClass: "main_mobile_dataMonitor_commonDetail",
        templateString: template,

        constructor: function (args) {
            declare.safeMixin(this, args);

            this.metaObjs = {};

            this.destroyArray = [];

            this.starMap = null;

            this._initEvents();
        },

        postCreate: function () {
            this.inherited(arguments);

            this._initDom();
        },

        startup: function () {
            this.inherited(arguments);

            this.defer(lang.hitch(this, function () {
                CustomScrollBar.init($(this.domNode).find('.detail>div>.customScrollBar'));
            }), 500);
        },

        destroy: function () {
            this.inherited(arguments);

            if (this.tmRange) {
                this.tmRange.destroy();
            }
            
            this._clearBeforeSelect();
        },

        _initDom: function () {
        	this.horizontalDataFlag = true;
        	
        	var menuShim = $(this.domNode).find(".detail>div>.menuShim");
        	var hrMetaDiv = $(this.domNode).find(".detail>div>.horzMetaDiv");
        	var tpSearchDiv = $(this.domNode).find(".detail>div>.navPanel>.topSearch");
        	
            $(this.domNode).find(".detail>div>.navPanel>.myNav .fa-filter").click(lang.hitch(this, function () {
                this._triggerHorizontalData(menuShim, hrMetaDiv, tpSearchDiv);
            }));
            
            $(this.domNode).find(".detail>div>.navPanel>.myNav .fa-calendar-check-o").click(lang.hitch(this, function () {
                this._triggerTimePicker(menuShim, hrMetaDiv, tpSearchDiv);
            }));
            
            this._getStarList();
            
            moment.locale('zh-cn');
            this.tmRange = new RangeSlider($(this.domNode).find('.detail>div>.navPanel>.topSearch .tmRange input'), {
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
                onFinish: lang.hitch(this, function (args) {
                    topic.publish('common/widget/sysMetas/refresh', this._getTMObj());
                })
            });

            $(this.domNode).find(".back>.prev").click(lang.hitch(this, function () {
                topic.publish('main/mobile/dataMonitor/prePage');
            }));
        },
        
        _showMenuShim: function(menuShim){
        	menuShim.css('z-index', '1');
        	menuShim.css('opacity', '0.3');
        	
        	menuShim.one('click', lang.hitch(this, function(e){
                e.stopPropagation();
                
                this._hideMenuShim(menuShim);
                this._hideTimePicker();
                this._toggleHorizontalData(false);
            }));
        },
        
        _hideMenuShim: function(menuShim){
        	menuShim.css('opacity', '0');
        	menuShim.one('webkitTransitionEnd transitionend', lang.hitch(this, function(event){
        		menuShim.css('z-index', '-1');
        		menuShim.off('webkitTransitionEnd transitionend');
            }));
        },
        
        _triggerHorizontalData: function (menuShim, hrMetaDiv, tpSearchDiv) {
        	this.horizontalDataFlag = hrMetaDiv.hasClass("show");
        	
            if (this.horizontalDataFlag) {
            	hrMetaDiv.removeClass("show");
            	this._hideMenuShim(menuShim);
            	
                this.horizontalDataFlag = false;
                
            } else {
            	if (this.timePickerFlag) {
            		tpSearchDiv.removeClass("show");
            		this.timePickerFlag = false;
            	}
            	
            	hrMetaDiv.addClass("show");
            	this._showMenuShim(menuShim);
            	
                this.horizontalDataFlag = true;
            }
        },
        
        _triggerTimePicker: function (menuShim, hrMetaDiv, tpSearchDiv) {
        	this.timePickerFlag = tpSearchDiv.hasClass("show");
        	
            if (this.timePickerFlag) {
            	tpSearchDiv.removeClass("show");
            	this._hideMenuShim(menuShim);
            	
                this.timePickerFlag = false;
                
            } else {
            	if (this.horizontalDataFlag) {
            		hrMetaDiv.removeClass("show");
            		this.horizontalDataFlag = false;
            	}
            	
                tpSearchDiv.addClass("show");
                this._showMenuShim(menuShim);
                
                this.timePickerFlag = true;
            }
        },
        
        _toggleHorizontalData: function (show, menuShim) {
            var div = $(this.domNode).find(".detail>div>.horzMetaDiv");
            if(show){
            	if (!div.hasClass("show")) {
            		div.addClass("show");
                	this._showMenuShim(menuShim);
                	
                    this.horizontalDataFlag = true;
                }
            }else{
            	if (div.hasClass("show")) {
            		div.removeClass("show");
            		
            		this.horizontalDataFlag = false;
            	}
            }
        },
        
        _hideTimePicker: function () {
        	  if (this.timePickerFlag) {
        		  $(this.domNode).find(".detail>div>.navPanel>.topSearch").removeClass("show");
                  this.timePickerFlag = false;
              }
        },
        
        _getStarList: function (callback) {
            if(this.starMap){
                if(callback){
                    callback();
                }
            }else{
                base.ajax({
                    url: base.getServerNM() + "platformApi/own/client/normal/starList",
                    type: 'GET'
                }).success(lang.hitch(this, function (ret) {
                    var dataList = ret.data.clients;
                    
                    this.starMap = {};
                    for (var i = 0; i < dataList.length; i++) {
                        var key = dataList[i].c_ID;
                        this.starMap[key] = key;
                    }
                    
                    if(callback){
                        callback();
                    }
                }));
            }
        },

        _addMeta: function (clientId, clientNm, metadata) {
            this.destroyArray.push({clientId: clientId, metadata: metadata});

            this._getSysMetaPlugin(metadata.sysmeta_ID, lang.hitch(this, function (plugin) {
                if (plugin) {
                    var args = $.extend(
                        {},
                        base.evalJson(plugin.p_PARAM), 
                        {minWidth: 'initial', minHeight: 'initial', size: 'small', showEditor: false},

                        this._getTMObj(),
                        {
                            clientId: clientId,
                            clientNm: clientNm,
                            metaId: metadata.meta_ID,
                            metaCId: metadata.meta_CID,
                            metaNm: metadata.meta_NM,
                            metaUnit: metadata.meta_UNIT
                        });

                    base.newDojo(plugin.p_PATH, '', args).success(lang.hitch(this, function (obj) {
                        var slc = $('<div>').addClass('metaPluginSlc');
                        $(this.domNode).find('.detail>div>.metaDataDiv .metaDataDivContent').append(slc);
                        
                        slc.append($(obj.domNode));
                        obj.startup();
                        
                        this.own(obj);
                        this.metaObjs[metadata.meta_ID] = obj;
                    }));
                }
            }));
        },

        _clearPlugins: function () {
            var length = this.destroyArray.length;
            for (var i = 0; i < length; i++) {
                this._removeMeta(this.destroyArray[i].clientId, this.destroyArray[i].metadata);
            }
            this.destroyArray.splice(0, length);
        },

        _removeMeta: function (clientId, metadata) {
            var obj = this.metaObjs[metadata.meta_ID];

            if (obj) {
                this._removeMetaSlc(obj);
                delete this.metaObjs[metadata.meta_ID];
            }
        },

        _removeMetaSlc: function (pluginObj) {
            var parentDiv = $(pluginObj.domNode).parent();
            pluginObj.destroyRecursive();
            parentDiv.remove();
        },

        _getTMObj: function () {
            var stm;
            var etm;
            stm = moment(this.tmRange.from(), "X").format("YYYY-MM-DD 00:00:00");
            etm = moment(this.tmRange.to(), "X").format("YYYY-MM-DD 23:59:59");
            return {stm: stm, etm: etm};
        },

        _getSysMetaPlugin: function (sysMetaId, callBack) {
            if (this.sysMetaPluginMap) {
                if (callBack) {
                    callBack(this.sysMetaPluginMap[sysMetaId]);
                }
            } else {
                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/own/client/normal/sysMetaPlugins'
                }).success(lang.hitch(this, function (ret) {
                    this.sysMetaPluginMap = ret.data;
                    if (callBack) {
                        callBack(this.sysMetaPluginMap[sysMetaId]);
                    }
                }));
            }
        },

        _changeStar: function () {
            var starNode = $(this.domNode).find('.detail>div>.navPanel>.myNav i.fa.star');
            
            if (this.flag) {
                starNode.removeClass('fa-star-o').addClass('fa-star').css('color', '#db4437');
            } else {
                starNode.removeClass('fa-star').addClass('fa-star-o').css('color', 'inherit');
            }
        },

        _addClickEvent: function (data) {
            $(this.domNode).find('.detail>div>.navPanel>.myNav i.fa.star').unbind().click(lang.hitch(this, function (e) {
                base.ajax({
                    type: this.flag ? 'DELETE' : 'POST',
                    url: base.getServerNM() + "platformApi/own/client/normal/star",
                    data: {clientId: data.c_ID}
                }).success(lang.hitch(this, function(ret){
                    data.star = !this.flag;
                    
                    this.flag = data.star;
                    
                    if(data.star){
                        this.starMap[data.c_ID] = data.c_ID;
                    }else{
                        delete this.starMap[data.c_ID];
                    }
                    
                    this._changeStar();

                    topic.publish('main/mobile/dataMonitor/commonDetail/toggleStar', data);
                }));
            }));
        },

        refresh: function (clientId, clientNm) {
            this._removeAll();

            if (clientId) {
                var parent = $(this.domNode).find('.detail>div>.horzMetaDiv .btn-group');
                //get data from db
                this.clientId = clientId;

                base.ajax({
                    type: 'GET',
                    url: base.getServerNM() + 'platformApi/own/client/normal/clientMetadata',
                    data: {clientId: this.clientId}
                }).success(lang.hitch(this, function (ret) {

                    var metas = ret.data;
                    if (metas.length == 0) {
                    	
                       $(this.domNode).find(".tip").show();                            
                    } else {
                    	$(this.domNode).find(".tip").hide(); 
                    	 
                        var addedList = [];
                        var len = parseInt(((this.parentWidth * 0.65) - 55) / 7);
                        
                        for (var i = 0; i < metas.length; i++) {
                            addedList.push(this._createMeta(clientId, clientNm, metas[i], len));
                        }
                        parent.append(addedList);
                    }
                }));
            }
        },

        _removeAll: function () {
            var obj = $(this.domNode).find('.detail>div>.horzMetaDiv .btn-group');
            obj.empty();
            this.clientId = null;
        },

        _createMeta: function (clientId, clientNm, item, len) {
            var metaNm = (item.meta_NM && item.meta_NM.length > 0) ? item.meta_NM : item.meta_CID;
            var subNM = base.subDescription(metaNm, len);
            var label = $('<label class="btn btn-default"><i class="fa fa-check"></i><input type="checkbox" autocomplete="off">' + subNM + '</label>').data('item', item);

            if (base.isNull(item.sysmeta_ID) || item.sysmeta_ID.length == 0) {
                label.find('input').remove();
                label.addClass('disabled').attr('title', '未设置系统元数据映射').tooltip({
                    container: 'body',
                    placement: 'auto bottom',
                    trigger: 'hover'
                });
            } else {
                this.obj = this;
                label.click(lang.hitch(this, function (e) {

                    var obj = $(e.currentTarget);
                    if (!obj.hasClass('active')) {
                        this._addMeta(clientId, clientNm, item);
                        
                    } else {
                        this._removeMeta(clientId, item);
                    }
                }));
            }
            return label;
        },
        
        _selectInner: function(data){
            this._getStarList(lang.hitch(this, function(){
                this.refresh(data.c_ID, data.c_NM);
                
                if(this.starMap){
                    if(this.starMap[data.c_ID]){
                        this.flag = true;
                    }else{
                        this.flag = false;
                    }

                    this._changeStar();
                    this._addClickEvent(data);
                }
                
                var subNM = base.subDescription(data.c_NM, (parseInt(this.parentWidth) - 50) / 7);
                $(this.domNode).find('.back>.svName').html(subNM);
                
                this._hideTimePicker();
                this._toggleHorizontalData(true, $(this.domNode).find(".detail>div>.menuShim"));
                
                topic.publish('main/mobile/dataMonitor/nextPage');
                
            }));
        },
        
        _clearBeforeSelect: function(){
            this._removeAll();
            this._clearPlugins();
        },

        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/dat/select', lang.hitch(this, function (data) {
                this._clearBeforeSelect();

                if(!base.isNull(data) && !base.isNull(data.newRow)){
                    data.c_ID = data.newRow.dId;
                    data.c_NM = data.newRow.name;
                    
                    this._selectInner(data);
                    
                    topic.publish('main/mobile/dataMonitor/commonDetail/clearOuterSelect');
                }
            }));

            var sub2 = topic.subscribe('main/mobile/dataMonitor/commonDetail/select', lang.hitch(this, function (data) {
                this._clearBeforeSelect();

                if(data){
                    this._selectInner(data);
                    
                    topic.publish('main/mobile/dataMonitor/commonDetail/clearOuterSelect');
                }
            }));
            var sub3 = topic.subscribe('component/dataMonitor/widget/clientPrevCard/toggleMetaList', lang.hitch(this, function (data) {
                this._clearBeforeSelect();

                if(data) {
                    this._selectInner(data);
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});
