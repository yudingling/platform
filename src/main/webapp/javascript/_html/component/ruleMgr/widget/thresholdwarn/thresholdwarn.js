
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "tool/validator",
    "dojo/text!./template/thresholdwarn.html",
    "tool/css!./css/thresholdwarn.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        validator,
        template){
    
    return declare("component.ruleMgr.widget.thw", [_Widget], {
        baseClass: "component_ruleMgr_widget_thw",
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
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            
            $(this.domNode).find('input[type="text"].order').val(this.ruleObj.uar_ORDER);
            
        	if(!this.isAdd){
        		base.ajax({
            		type: 'GET',
            		url: base.getServerNM() + 'platformApi/own/rule/normal/ruleDetail',
            		data: {clientId: this.ruleObj.c_ID, ruleUnionID: this.ruleObj.uar_ID, ruleID: this.ruleObj.rule_ID}
        		}).success(lang.hitch(this, function(ret){
                    
            		if(ret.data.thw_LT){
            			$(this.domNode).find('input[type="radio"][value="lt"]').prop('checked', true);
            			$(this.domNode).find('input[type="text"].ltval').val(ret.data.thw_LT);
            			
            		}else if(ret.data.thw_ST){
            			$(this.domNode).find('input[type="radio"][value="st"]').prop('checked', true);
            			$(this.domNode).find('input[type="text"].stval').val(ret.data.thw_ST);
            			
            		}else if(ret.data.thw_OUTRANGE){
            			$(this.domNode).find('input[type="radio"][value="range"]').prop('checked', true);
            			
            			var strs = ret.data.thw_OUTRANGE.split('~');
            			if(strs.length == 2){
            				$(this.domNode).find('input[type="text"].rangeL').val(strs[0].trim());
            				$(this.domNode).find('input[type="text"].rangeR').val(strs[1].trim());
            			}
            		}
            	}));
        	}
        	
        	$(this.domNode).find('input[type="radio"]').change(lang.hitch(this, function(e){
        		var radio = $(e.currentTarget);
        		//clear irrelevant input value 
        		if(radio.is(':checked')){
        			var parentDiv = $(e.currentTarget).parent().parent();
            		
            		$(this.domNode).find('div.radio').not(parentDiv).find('input[type="text"]').val('');
            		
            		parentDiv.find('input[type="text"]').first().focus();
        		}
        		
        	}));
        },
        
        _save: function(){
        	var saveData = this._getSaveData();
        	
        	if(!base.isNull(saveData)){
        		base.ajax({
            		hintOnSuccess: true,
            		type: this.isAdd? 'POST' : 'PUT',
            		url: base.getServerNM() + 'platformApi/own/rule/ruleInfo',
            		data: {'info': JSON.stringify(saveData)},
            	}).success(lang.hitch(this, function(ret){
            		topic.publish('component/ruleMgr/save/success', {ruleType: this.ruleType, isAdd: this.isAdd,  ruleObj: $.extend(saveData, ret.data)});
            		
            	}));
        	}
        },
        
        _getSaveData: function(){
        	var data = {thw_LT: null, thw_ST: null, thw_OUTRANGE: null, uar_ORDER: 0};
        	var chkValue = $(this.domNode).find('input[type="radio"]:checked').attr('value');
            
            var order = $(this.domNode).find('input[type="text"].order').val().trim();
            if(!validator.isInt(order)){
                base.error('提醒', '顺序输入错误');
                return null;
            }
            data.uar_ORDER = parseInt(order);
        	
        	if(chkValue == 'lt'){
        		data.thw_LT = $(this.domNode).find('input[type="text"].ltval').val().trim();
        		if(!validator.isDouble(data.thw_LT)){
        			base.error('提醒', '输入参数非法');
        			return null;
        		}

        	}else if(chkValue == 'st'){
        		data.thw_ST = $(this.domNode).find('input[type="text"].stval').val().trim();
        		if(!validator.isDouble(data.thw_ST)){
        			base.error('提醒', '输入参数非法');
        			return null;
        		}
        		
        	}else if(chkValue == 'range'){
        		var valL = $(this.domNode).find('input[type="text"].rangeL').val().trim();
        		var valR = $(this.domNode).find('input[type="text"].rangeR').val().trim();
        		
        		if(!validator.isDouble(valL) || !validator.isDouble(valR) || parseFloat(valL) > parseFloat(valR)){
        			base.error('提醒', '输入参数非法');
        			return null;
        		}
        		data.thw_OUTRANGE = valL + '~' + valR;
                
        	}else{
                base.error('提醒', '至少选择一种触发条件');
                return null;
            }
        	
        	//get the save data. should not modify ruleObj directly, save request could be fail on some case, like unauth
        	return $.extend({}, this.ruleObj, data);
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('component/ruleMgr/save', lang.hitch(this, function(data){
                this._save();
            }));
            
            this.own(sub1);
        }
    });
});
