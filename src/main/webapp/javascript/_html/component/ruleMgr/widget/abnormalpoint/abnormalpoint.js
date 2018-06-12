
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "dojo/text!./template/abnormalpoint.html",
    "tool/css!./css/abnormalpoint.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        template){
    
    return declare("component.ruleMgr.widget.abp", [_Widget], {
        baseClass: "component_ruleMgr_widget_abp",
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
        	if(!this.isAdd){
        		//edit.  you can query the necessary data here
        	}
            
            topic.publish('component/ruleMgr/unavailable');
        },
        
        _save: function(){
        	var saveData = this._getSaveData();
        	
        	if(!base.isNull(saveData)){
        		base.ajax({
            		hintOnSuccess: true,
            		type: this.isAdd? 'POST' : 'PUT',
            		url: base.getServerNM() + 'abnormalpoint',
            		data: saveData,
            	}).success(function(ret){
            		topic.publish('component/ruleMgr/save/success', {ruleType: this.ruleType, isAdd: this.isAdd,  ruleObj: $.extend(saveData, ret.data)});
            	});
        	}
        },
        
        _getSaveData: function(){
        	//get the save data. should not modify this.ruleObj directly, save request could be fail on some case, like unauth
        	return $.extend({}, this.ruleObj, {});
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('component/ruleMgr/save', lang.hitch(this, function(data){
                this._save();
            }));
            
            this.own(sub1);
        }
    });
});
