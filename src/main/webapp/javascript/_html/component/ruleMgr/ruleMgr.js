
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/spin/Spin',
    "root/customScrollbar/CustomScrollBar",
    'root/popoverMenu/PopoverMenu',
    "common/widget/deviceActionTree/deviceActionTree",
    "root/blurFilter/blurFilter",
    "dojo/text!./template/ruleMgr.html",
    "tool/css!./css/ruleMgr.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        CustomScrollBar,
        PopoverMenu,
        DeviceActionTree,
        BlurFilter,
        template){
    
    return declare("component.ruleMgr", [_Widget], {
        baseClass: "component_ruleMgr",
        templateString: template,
        
        selfAuth: true,
        authApi: {
        	'ruleInfo': '/platformApi/own/rule/ruleInfo'
        },
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
            
            this._initAction();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.defer(lang.hitch(this, function(){
            	CustomScrollBar.init($(this.domNode).find('.customScrollBar'));
            	
            	CustomScrollBar.init($(this.domNode).find('.mds'), 'x');
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
        	
        	this._destroyRuleWidget();
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            //popoverMenu need more space to show
            if(!Boolean($(this.domNode).find('li.delete').attr('bindAuthResult'))){
                $(this.domNode).find('li.append').css('margin-right', '35px');
            }
        },
        
        _initDom: function(){
        	var tree = new DeviceActionTree({groupSelect: false});
        	$(this.domNode).find('.list').append($(tree.domNode));
        	tree.startup();
            this.own(tree);
            
            this.refreshInstanceId = tree.instanceId;
            
            this.popoverMenu = new PopoverMenu(
            		$(this.domNode).find('li.append a'), 
            		$(this.domNode).find('li.append a i'), 
            		[{name: '计算规则', value: "calcRule"}, {name: '实时分析规则', value: "rtaRule"}, {name: '历史分析规则', value: "haRule"}],
            		lang.hitch(this, function(value){
            			if(this.curMeta){
            				this._addRule(value);
            			}
            		})
            );
            
            this.own(this.popoverMenu);
        },
        
        _createMd: function(client){
            $(this.domNode).find('.mds ul>li').remove();
            $(this.domNode).find('.rule .media').remove();
            this.curMeta = null;
            this.client = null;
            this._destroyRuleWidget();
            
            if(base.isNull(client) || base.isNull(client.newRow)){
                return;
            }
        	this.client = client;
            
        	//query from db 
        	base.ajax({
    			type: 'GET',
    			data: {clientId:client.newRow.dId},
    			url: base.getServerNM() + 'platformApi/own/client/normal/clientMetadata',
    		}).success(lang.hitch(this, function(meta){

    			this.metadatas = meta.data;
    			
    			var data = meta.data;
    			
                var ul = $(this.domNode).find('.mds ul');
                
    			for(var i=0; i<data.length; i++){
    				var li = $('<li><a href="javascript:void(0);"><span>'+ (data[i].meta_NM? data[i].meta_NM : data[i].meta_CID)  +'</span><span class="mdId label label-warning">'+ data[i].meta_CID +'</span><span class="mdSys label label-primary">'+ (data[i].sysmeta_NM? data[i].sysmeta_NM : '&nbsp;') +'</span></a></li>');
                    
    				lang.hitch(this, (function(tmp){
    					li.click(lang.hitch(this, function(e){
    						var self = $(e.currentTarget);
    						ul.find('li').not(self).removeClass('active');
    						self.addClass('active');
                            
							this._createRule(tmp);
    					}));
    				}))(data[i]);
    				
    				ul.append(li);
    			}
    			
    			//upon the css of ".mds ul", browser's auto calculation of dom width works incompatible to CustomScrollBar. just update it
    			CustomScrollBar.update($(this.domNode).find('.mds'), 'x');
    			
    		}));
        },
        
        _createRule: function(tmp){
        	this.curMeta = tmp;
            
            $(this.domNode).find('.rule .media').remove();
            
        	base.ajax({
    			type: 'GET',
    			data: {clientId : tmp.c_ID , metaId : tmp.meta_ID},
    			url: base.getServerNM() + 'platformApi/own/rule/ruleInfo',
    		}).success(lang.hitch(this, function(rule){
                
    			var calcRule = rule.data.calcRule;
    			var anaRule = rule.data.anaRule; 
                
    			if(calcRule != null){
    				var d = {id: base.uuid(), info: calcRule.info, c_ID: calcRule.c_ID, rule_ID: calcRule.rule_ID, ucr_ID: calcRule.ucr_ID, meta_ID: tmp.meta_ID, meta_ID_REF: calcRule.meta_ID_REF};
    				this._ruleJoint(d, calcRule.rule_TP);
    			}
    			
    			for(var i=0; i<anaRule.length; i++ ){
    				var d = {id: base.uuid(), info: anaRule[i].info, c_ID: anaRule[i].c_ID, rule_ID: anaRule[i].rule_ID, uar_ID: anaRule[i].uar_ID, meta_ID: anaRule[i].meta_ID, uar_ORDER: anaRule[i].uar_ORDER};
    				this._ruleJoint(d, anaRule[i].rule_TP);
    			}
    		}));
        },
        
        _ruleJoint: function(data, rule_TP){
        	if(rule_TP == 0){
                this._refreshRule('calcRule', data, true);
            }else if(rule_TP == 1){
				this._refreshRule('rtaRule', data, true);
            }else if(rule_TP == 2){
                this._refreshRule('haRule', data, true);
            }
        },
        
        _refreshRule: function(ruleType, data, isAdd, setOrder){
            var pa = $(this.domNode).find('.'+ ruleType +' .panel-body');
            
            if(!setOrder){
                if(isAdd){
                    pa.append(this._createMedia(ruleType, data));
                }else{
                    this._updateMedia(pa, data);
                }

            }else{
                //need to search the index for the position of media panel. generally used for edit/add
                if(isAdd){
                    var posMedia = this._getInsertPositionMedia(pa, data);
                    if(posMedia){
                        posMedia.before(this._createMedia(ruleType, data));
                    }else{
                        pa.append(this._createMedia(ruleType, data));
                    }

                }else{
                    this._updateMedia(pa, data, setOrder);
                }
            }
        },
        
        _createMedia: function(ruleType, item){
            var str = '<div class="media" data="'+ item.id +'">'
            	+ '          <a class="media-left" href="javascript:void(0);">'
            	+ '                <input type="checkbox">'
            	+ '                <div class="'+ item.rule_ID +'"></div>'
            	+ '          </a>'
            	+ '          <div class="media-body ct">'
            	+ '          </div><div class="media-body bg"></div>'
            	+ '      </div>';
            
            var obj = $(str).data('item', item);
            
            this._setCtInfo(obj, item.info);
            
            var chk = obj.find('input');
            
            obj.click(lang.hitch(this, function(e){
            	if(chk.is(':visible')){
            		//status: delete
            		chk.prop('checked', !chk.is(':checked'));
            		chk.trigger('change');
            	}else{
            		//cann't use the "item" defined in the parameters above, the data will modify by user
            		this._editRule(ruleType, obj.data('item'));
            	}
            }));
            chk.click(lang.hitch(this, function(e){
            	//if click on checkbox, we should sotp propagation to avoid the obj.click being called
            	e.stopPropagation();
            }));
            
            chk.change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                	obj.addClass('delete');
                }else{
                	obj.removeClass('delete');
                }
            }));
            
            this._initMediaBlur(obj, item.rule_ID);
            
            return obj;
        },
        
        _initMediaBlur: function(node, ruleid){
            var blurDiv = node.find('.media-left>div');
            
            BlurFilter.init(blurDiv, {
                img: this._getBlurImg(ruleid),
                blur: '2px'
            });
            
            node.hover(function(){
                BlurFilter.update(blurDiv, '0px');
            }, function(){
                BlurFilter.update(blurDiv, '2px');
            });
        },
        
        _getBlurImg: function(ruleid){
            var imgloc = base.getServerNM() + 'javascript/_html/component/ruleMgr/img/';
            
            return imgloc + ruleid + '.png';
        },
        
        _updateMedia: function(parent, item, setOrder){
        	var media = parent.find('div.media[data="'+ item.id +'"]');

        	media.data('item', item);
            this._setCtInfo(media, item.info);
            
            if(setOrder){
                var posMedia = this._getInsertPositionMedia(parent, item);
                if(posMedia){
                    posMedia.before(media);
                }
            }
        },
        
        _setCtInfo: function(media, info){
            var ctDom = media.find('.ct');
            
            var infoStr = base.subDescription(info, 32);
        	ctDom.empty().append($('<span>'+ infoStr +'</span>'));
            
            if(infoStr.length < info.length){
                ctDom.attr('title', info);
            }
        },
        
        _getInsertPositionMedia: function(parent, item){
            var ret = null;
            if(item.uar_ORDER){
                parent.find('div.media:not([data="'+ item.id +'"])').each(function(){
                    var tmpData = $(this).data('item');
                    if(tmpData.uar_ORDER && tmpData.uar_ORDER > item.uar_ORDER){
                        ret = $(this);
                        return false;
                    }
                });
            }
            return ret;
        },
        
        _editRule: function(ruleType, ruleObj){
        	if(this.allRules){
        		this._addOrUpdateRule(ruleType, ruleObj);
        		
        	}else{
        		this._getAllRules(lang.hitch(this, function(){
        			this._addOrUpdateRule(ruleType, ruleObj);
        		}));
        	}
        },
        
        _addRule: function(ruleType){
        	if(this.allRules){
        		this._addOrUpdateRule(ruleType);
        		
        	}else{
        		this._getAllRules(lang.hitch(this, function(){
        			this._addOrUpdateRule(ruleType);
        		}));
        	}
        },
        
        _getAllRules: function(callback){
    		base.ajax({
    			type: 'GET',
    			url: base.getServerNM() + 'platformApi/own/rule/normal/allRule',
    		}).success(lang.hitch(this, function(ret){
    			this.allRules = ret.data;
    			
    			this.calcRule = {};
    			this.rtaRule = {};
    			this.haRule = {};
    			
    			for(var ruleId in this.allRules){
    				var rule = this.allRules[ruleId];
    				if(rule.rule_TP == 0){
    					this.calcRule[ruleId] =  rule;
    				}else if(rule.rule_TP == 1){
    					this.rtaRule[ruleId] = rule;
    				}else if(rule.rule_TP == 2){
    					this.haRule[ruleId] = rule;
    				}
    			}
    			
    			if(callback){
    				callback();
    			}
    		}));
        },
        
        _addPreCheck: function(ruleType){
            if(ruleType == 'calcRule'){
                if($(this.domNode).find('.'+ ruleType +' .panel-body div.media').length > 0){
                    base.info('提醒', '计算规则有且只有一个');
                    return false;
                }
            }
            
            return true;
        },
        
        _addOrUpdateRule: function(ruleType, ruleObj){
            if(base.isNull(ruleObj) && !this._addPreCheck(ruleType)){
                return;
            }
            
        	var title = "";
        	var isAdd = base.isNull(ruleObj);
        	this.isAdd = isAdd;
        	
        	if(ruleType == 'calcRule'){
    			this._bindRuleIds(ruleType, this._filterUsedRules(ruleType, this.calcRule, isAdd), isAdd, ruleObj);
    			title = isAdd? "新增计算规则" : "编辑计算规则";
    			
        	}else if(ruleType == 'rtaRule'){
        		this._bindRuleIds(ruleType, this._filterUsedRules(ruleType, this.rtaRule, isAdd), isAdd, ruleObj);
        		title = isAdd? "新增实时分析规则" : "编辑实时分析规则";
        		
        	}else if(ruleType == 'haRule'){
        		this._bindRuleIds(ruleType, this._filterUsedRules(ruleType, this.haRule, isAdd), isAdd, ruleObj);
        		title = isAdd? "新增历史分析规则" : "编辑历史分析规则";
        	}
        	
        	$(this.domNode).find('.modal .modal-title').html(title);
        	
        	var modalDiv = $(this.domNode).find('.modal');
        	if(!isAdd){
            	var media = $(this.domNode).find('.rule .media[data="'+ ruleObj.id +'"]')
            	
            	modalDiv.unbind().on('show.bs.modal', function (e) {
            		media.addClass('select');
            	}).on('hide.bs.modal', function (e) {
            		media.removeClass('select');
        		});
            }
            
        	modalDiv.modal({backdrop: 'static', keyboard: false});
        },
        
        _filterUsedRules: function(ruleType, rules, isAdd){
            var retRules = [];
            if(isAdd){
                var usedIds = [];
            
                $(this.domNode).find('.'+ ruleType +' .panel-body div.media').each(lang.hitch(this, function(index,element){
                    usedIds.push($(element).data('item').rule_ID);
                }));


                for(var ruleId in rules){
                    if(usedIds.indexOf(ruleId) < 0){
                        retRules.push(rules[ruleId]);
                    }
                }
            }else{
                for(var ruleId in rules){
                    retRules.push(rules[ruleId]);
                }
            }
            
            return retRules;
        },
        
        _bindRuleIds: function(ruleType, rules, isAdd, ruleObj){
        	$(this.domNode).find('.modal .ruleIds option').remove();
        	this._destroyRuleWidget();
        	
        	var sel = $(this.domNode).find('.modal .ruleIds');
        	for(var i=0;i<rules.length;i++){
        		sel.append($('<option value="'+ rules[i].rule_ID +'">'+ rules[i].rule_NM +'</option>'));
        	}
        	
        	var args = {
        		ruleType: ruleType,
        		isAdd: isAdd,
        		metadatas: this.metadatas,
        		ruleObj: ruleObj
        	};
        	
        	sel.unbind('change').change(lang.hitch(this, function(){
        		if(sel.val()){
        			if(isAdd){
                		//add
                		if(ruleType == 'calcRule'){
                			args.ruleObj = {id: base.uuid(), ucr_ID: null, c_ID: this.client.newRow.dId, rule_ID: sel.val(), meta_ID: this.curMeta.meta_ID, meta_ID_REF: null};
                			
                    	}else if(ruleType == 'rtaRule' || ruleType == 'haRule'){
                            var lastOrder = -1;
                            if(ruleType == 'rtaRule'){
                                var lastMedia = $(this.domNode).find('.rtaRule .panel-body div.media:last-child');
                                var lastOrder = lastMedia && lastMedia.length > 0? lastMedia.data('item').uar_ORDER : -1;
                            }
                            
                    		args.ruleObj = {id: base.uuid(), uar_ID: null, c_ID: this.client.newRow.dId, rule_ID: sel.val(), meta_ID: this.curMeta.meta_ID, uar_ORDER: lastOrder + 1};
                    	}
                	}
            		
            		this._creteRuleWidget(sel.val(), args);
        		}
        	}));
        	
        	if(isAdd){
        		sel.prop('disabled', false);
        		sel.val(null);
        	}else{
        		sel.prop('disabled', true);
        		
        		sel.val(ruleObj.rule_ID);
        		sel.trigger('change');
        	}
        },
        
        _destroyRuleWidget: function(){
        	if(this.ruleWidget){
        		this.ruleWidget.destroyRecursive();
        		this.ruleWidget = null;
        	}
        },
        
        _creteRuleWidget: function(ruleId, args){
        	this._destroyRuleWidget();
        	var path = '';
        	
        	//here we assume the ruleId is combine with 'rule_'(prefix) and widget name.
        	var temps = ruleId.split('_');
        	if(temps.length == 2){
                $(this.domNode).find('.modal .modal-footer .sure').show();
                
        		var path = 'component/ruleMgr/widget/' + temps[1] + '/' + temps[1];
        		
        		var spin = new Spin($(this.domNode).find('.modal .modal-body'));
        		
        		base.newDojo(path, '', args).success(lang.hitch(this, function(ruleWidget){
            		this.ruleWidget = ruleWidget;
            		$(this.domNode).find('.modal .ruleContent').append($(this.ruleWidget.domNode));
            		this.ruleWidget.startup();
            		
            		spin.destroy();
            	})).fail(function(){
            		spin.destroy();
            	});
        	}else{
        		base.error('错误', 'ruleId['+ ruleId +'] 定义错误，无法获取到相应的 widget');
        	}
        },
        
        _deleteRules: function(delCalcRule, delRtaRule, delHaRule){
            base.ajax({
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/rule/ruleInfo',
                type: 'DELETE',
                data:{
                	clientId: this.client.newRow.dId,
                    calcRuleIds: JSON.stringify(delCalcRule.ruleData),
                    rtaRuleIds: JSON.stringify(delRtaRule.ruleData),
                    haRuleIds: JSON.stringify(delHaRule.ruleData),
                }
            }).success(lang.hitch(this, function(){
                $(delCalcRule.medias).remove();
                $(delRtaRule.medias).remove();
                $(delHaRule.medias).remove();
                this._toggleDeleteStatus(false);
            }));
        },
        
        _getChkDelRules: function(ruleType){
            var ruleData = {};
            var medias = $(this.domNode).find('.'+ ruleType +' .panel-body div.media.delete');
            
            if(medias.length > 0){
                for(var i=0; i<medias.length; i++){
                    var tmpData = $(medias[i]).data('item');
                    ruleData[tmpData.ucr_ID || tmpData.uar_ID] = tmpData.rule_ID;
                }
            }
            
            return {ruleData: ruleData, medias: medias};
        },
        
        _initAction: function(){
        	$(this.domNode).find('li.delete i').click(lang.hitch(this, function(){
        		if(this.curMeta){
        			this._toggleDeleteStatus(true);
        		}
        	}));
        	
        	$(this.domNode).find('li.cancel a').click(lang.hitch(this, function(){
        		this._toggleDeleteStatus(false);
        	}));
        	
        	$(this.domNode).find('li.ok a').click(lang.hitch(this, function(){
                var delCalcRule = this._getChkDelRules('calcRule');
                var delRtaRule = this._getChkDelRules('rtaRule');
                var delHaRule = this._getChkDelRules('haRule');
                
                if(Object.keys(delCalcRule.ruleData).length == 0 && Object.keys(delRtaRule.ruleData).length == 0 && Object.keys(delHaRule.ruleData).length == 0){
                    base.info('提醒', '至少选一个规则');
                    return;
                }
                
        		base.confirm('删除', '确定删除所选规则?', lang.hitch(this, function(){
        			this._deleteRules(delCalcRule, delRtaRule, delHaRule);
        		}));
        	}));
        	
        	$(this.domNode).find('.modal .modal-footer .sure').click(lang.hitch(this, function(e){
        		topic.publish('component/ruleMgr/save');
            }));
        },
        
        _toggleDeleteStatus: function(isDelete){
        	if(isDelete){
        		$(this.domNode).find('li.delete').hide();
        		$(this.domNode).find('li.append').hide();
        		
        		$(this.domNode).find('li.ok').show();
        		$(this.domNode).find('li.cancel').show();
        		
        		$(this.domNode).find('.rule').addClass('showMedia');
        	}else{
        		$(this.domNode).find('li.ok').hide();
        		$(this.domNode).find('li.cancel').hide();
        		
        		$(this.domNode).find('li.delete').show();
        		$(this.domNode).find('li.append').show();
        		
        		$(this.domNode).find('.rule').removeClass('showMedia');
        		
        		$(this.domNode).find('.rule .media').removeClass('delete');
        		$(this.domNode).find('.rule .media input:checked').prop('checked', false);
        	}
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('common/widget/dat/select', lang.hitch(this, function(data){
                if(!this.refreshInstanceId || (!base.isNull(data) && data.instanceId != this.refreshInstanceId)){
                    return;
                }
                
                this._createMd(data);
            }));
        	var sub2 = topic.subscribe('component/ruleMgr/save/success', lang.hitch(this, function(data){
        		$(this.domNode).find('.modal').modal('hide');
        		this._refreshRule(data.ruleType, data.ruleObj, data.isAdd, true);
        	}));
            var sub3 = topic.subscribe('component/ruleMgr/unavailable', lang.hitch(this, function(data){
                $(this.domNode).find('.modal .modal-footer .sure').hide();
            }));
        	
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});
