define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/formula.html",
    "tool/css!./css/formula.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.ruleMgr.widget.formula", [_Widget], {
        baseClass: "component_ruleMgr_widget_formula",
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
        	//the refMetadata can not be the metadata itself in formula. filter the select options
        	var sel = $(this.domNode).find('.refMetaId');
        	for(var i=0; i<this.metadatas.length; i++){
        		if(this.metadatas[i].meta_ID != this.ruleObj.meta_ID){
                    if(this.metadatas[i].meta_ID == this.ruleObj.meta_ID_REF){
                        sel.append($('<option value="'+ this.metadatas[i].meta_ID +'" selected = "selected">'+ this.metadatas[i].meta_NM +'</option>'));
                    }else{
                        sel.append($('<option value="'+ this.metadatas[i].meta_ID +'">'+ this.metadatas[i].meta_NM +'</option>'));
                    }
        		}
        	}

        	if(!this.isAdd){
        		base.ajax({
            		type: 'GET',
            		url: base.getServerNM() + 'platformApi/own/rule/normal/ruleDetail',
            		data: {clientId: this.ruleObj.c_ID, ruleUnionID: this.ruleObj.ucr_ID, ruleID: this.ruleObj.rule_ID}
        		}).success(lang.hitch(this, function(ret){
        			$(this.domNode).find('.func').val(ret.data);
                }));
        	}
        },
        
        _save: function(){
        	var saveData = this._getSaveData();
        	if(!base.isNull(saveData)){
        		base.ajax({
            		hintOnSuccess: true,
            		type: this.isAdd? 'POST' : 'PUT',
            		data: {'info': JSON.stringify(saveData)},
        			url: base.getServerNM() + 'platformApi/own/rule/ruleInfo',
            	}).success(lang.hitch(this, function(ret){
            		topic.publish('component/ruleMgr/save/success', {ruleType: this.ruleType, isAdd: this.isAdd,  ruleObj: $.extend(saveData, ret.data)});
            	}));
        	}
        },
        
        _getSaveData: function(){
        	var refMetaId = $(this.domNode).find('.refMetaId').val();
        	var formula = $(this.domNode).find('.func').val();
        	
        	if(!refMetaId || refMetaId.length == 0){
        		base.error('提醒', '关联元数据不能为空');
        		return null;
        	}
        	
        	if(!formula || formula.length == 0){
        		base.error('提醒', '函数不能为空');
        		return null;
        	}
        	
        	/*var regex = /^(\w?[^\{x\}]+)*\{x\}([^\{x\}]+\w?)*$/;
        	if(base.isNull(formula.match(regex))){
        		base.error('提醒', '参数错误，请参考说明');
        		return null;
        	}*/
        	//get the save data. should not modify "this.ruleObj.meta_ID_REF" directly, save request could be fail on some case, like unauth
        	return $.extend({}, this.ruleObj, {meta_ID_REF: refMetaId, if_FORMULA: formula});
        },

        _initEvents: function () {
        	var sub1 = topic.subscribe('component/ruleMgr/save', lang.hitch(this, function(data){
                this._save();
            }));
        	
            this.own(sub1);
        }
    });
});
