
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/adjacentdiff.html",
    "tool/css!./css/adjacentdiff.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.ruleMgr.widget.adjacentdiff", [_Widget], {
        baseClass: "component_ruleMgr_widget_adjd",
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
        	//the refMetadata can not be the metadata itself in adjacentdiff. filter the select options
        	var sel = $(this.domNode).find('.refMetaId');
        	for(var i=0; i<this.metadatas.length; i++){
        		if(this.metadatas[i].meta_ID != this.ruleObj.meta_ID){
        			sel.append($('<option value="'+ this.metadatas[i].meta_ID +'">'+ this.metadatas[i].meta_NM +'</option>'));
        		}
        	}
        	
        	if(!this.isAdd){
        		//edit.  you can query the necessary data here
        	}
        },
        
        _save: function(){
        	var saveData = this._getSaveData();
        	
        	if(!base.isNull(saveData)){
        		base.ajax({
            		hintOnSuccess: true,
            		type: this.isAdd? 'POST' : 'PUT',
            		url: base.getServerNM() + 'adjacentdiff',
            		data: saveData,
            	}).success(function(ret){
            		topic.publish('component/ruleMgr/save/success', {ruleType: this.ruleType, isAdd: this.isAdd,  ruleObj: $.extend(saveData, ret.data)});
            	});
        	}
        },
        
        _getSaveData: function(){
        	var refMetaId = $(this.domNode).find('.refMetaId').val();
        	if(refMetaId && refMetaId.length > 0){
        		//get the save data. should not modify "this.ruleObj.meta_ID_REF" directly, save request could be fail on some case, like unauth
        		return $.extend({}, this.ruleObj, {meta_ID_REF: refMetaId})
        	}else{
        		base.error('提醒', '关联元数据不能为空');
        		return null;
        	}
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('component/ruleMgr/save', lang.hitch(this, function(data){
                this._save();
            }));
            
            this.own(sub1);
        }
    });
});
