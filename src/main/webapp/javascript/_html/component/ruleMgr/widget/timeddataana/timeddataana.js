
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/dateTimePicker/DateTimePicker",
    "dojo/text!./template/timeddataana.html",
    "tool/css!./css/timeddataana.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        DateTimePicker,
        template){
    
    return declare("component.ruleMgr.widget.tda", [_Widget], {
        baseClass: "component_ruleMgr_widget_tda",
        templateString: template,
        
        constructor: function (args) {
            declare.safeMixin(this, args);
            
            this.dateTimePickers = {};
            
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
        	this.inherited(arguments);
            
            this._destroyTimePicker();
        },
        
        _initDom: function(){
        	$(this.domNode).find('i.add').click(lang.hitch(this, function(){
        		this._createChkTM($(this.domNode).find('.chkTTs'));
        	}));
        	
        	if(!this.isAdd){
        		base.ajax({
            		type: 'GET',
            		url: base.getServerNM() + 'platformApi/own/rule/normal/ruleDetail',
            		data: {clientId: this.ruleObj.c_ID, ruleUnionID: this.ruleObj.uar_ID, ruleID: this.ruleObj.rule_ID}
        		}).success(lang.hitch(this, function(ret){
            		
                    this.editData = ret.data;
                    
            		$(this.domNode).find('.delay').val(ret.data.td_DELAY_S);
            		
            		var parent = $(this.domNode).find('.chkTTs');
            		var chkTM = JSON.parse(ret.data.td_CHKTM);
            		for(var i = 0; i < chkTM.length; i++){
            			this._createChkTM(parent, chkTM[i]);
            		}
            	}));
                
        	}else{
                this.editData = {};
            }
        },
        
        _destroyTimePicker: function(dataId){
            if(dataId){
                var obj = this.dateTimePickers[dataId];
                if(obj){
                    obj.destroy();
                    delete this.dateTimePickers[dataId];
                }
                
            }else{
                for(var key in this.dateTimePickers){
                    this.dateTimePickers[key].destroy();
                }
                this.dateTimePickers = {};
            }
        },
        
        _createChkTM: function(parent, item){
            var dataId = base.uuid();
            
        	var obj = $('<div class="chkTT">'
        		+ '<span>每 </span>'
        		+ '<select class="form-control ttSection">'
        		+ '	<option value="m">分</option>'
        		+ '	<option value="h">时</option>'
        		+ '	<option value="d">日</option>'
        		+ '	<option value="M">月</option>'
        		+ '	<option value="y">年</option>'
        		+ '</select>'
        		+ '<span> 的 </span>'
        		+ '<input type="text" class="form-control ttDetail" disabled>'
        		+ '<i class="fa fa-minus-circle fa-lg delete" title="删除"></i>'
        		+ '</div>');
        	
        	parent.append(obj);
        	
        	obj.find('i.delete').click(lang.hitch(this, function(){
                this._destroyTimePicker(dataId);
        		obj.remove();
        	}));
        	
        	var ttSection = obj.find('.ttSection');
        	var ttDetail = obj.find('.ttDetail');
        	
        	ttSection.val(null);
        	ttSection.change(lang.hitch(this, function(){
                this._destroyTimePicker(dataId);
                
        		if(ttSection.val()){
        			ttDetail.prop('disabled', false);
        			ttDetail.val('');
        			
            		switch(ttSection.val()){
                        case 'm':
                            this.dateTimePickers[dataId] = new DateTimePicker(ttDetail, 'S', '2016-01-01 00:00:00');
                            break;
                        case 'h':
                            this.dateTimePickers[dataId] = new DateTimePicker(ttDetail, 'i:S', '2016-01-01 00:00:00');
                            break;
                        case 'd':
                            this.dateTimePickers[dataId] = new DateTimePicker(ttDetail, 'H:i:S', '2016-01-01 00:00:00');
                            break;
                        case 'M':
                            this.dateTimePickers[dataId] = new DateTimePicker(ttDetail, 'd H:i:S', (new Date()).format('yyyy-MM-dd 00:00:00'));
                            break;
                        case 'y':
                            this.dateTimePickers[dataId] = new DateTimePicker(ttDetail, 'm-d H:i:S', (new Date()).format('yyyy-MM-dd 00:00:00'));
                            break;
                        default:
                            ttDetail.prop('disabled', true);
                            break;
                	}
            		
        		}else{
        			ttDetail.prop('disabled', true);
        		}
        	}));
            
        	if(item){
            	/*如果为 "06-03 08:30:10" 表示每年的这个时刻必须有数据，
            	"03 08:30:10" 表示每月的这个时刻有数据，
            	"08:30:10" 表示每日的这个时刻有数据，
            	"30:10" 表示每时的这个时刻有数据，
            	"10" 表示每分的这个时刻有数据，*/
            	switch(item.length){
                    case 2:
                        ttSection.val('m');
                        break;
                    case 5:
                        ttSection.val('h');
                        break;
                    case 8:
                        ttSection.val('d');
                        break;
                    case 11:
                        ttSection.val('M');
                        break;
                    case 14:
                        ttSection.val('y');
                        break;
            	}
            	
            	ttSection.trigger('change');
                
                ttDetail.val(item);
        	}
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
        	var obj = {td_DELAY_S: 300, td_CHKTM: []};
        	
        	obj.td_DELAY_S = parseInt($(this.domNode).find('.delay').val().trim());
        	if(isNaN(obj.td_DELAY_S) || obj.td_DELAY_S < 120){
        		base.error('提醒', '延迟时间不能为空，且至少120 秒');
        		return null;
        	}
        	
        	var chkTms = $(this.domNode).find('.chkTT');
        	if(chkTms.length == 0){
        		base.error('提醒', '时间点不能为空');
        		return null;
        	}
        	
        	var ok = true;
        	chkTms.each(function(){
        		var chkTm = $(this);
        		
        		var sec = chkTm.find('.ttSection').val();
        		var detail = chkTm.find('.ttDetail').val().trim();
        		
        		var slen = 0;
        		switch(sec){
                    case 'm':
                        if(detail.length != 2){
                            base.error('提醒', '输入错误，"分"检查对应的时间点长度为 2');
                            ok = false;
                            return false;
                        }
                        break;
                    case 'h':
                        if(detail.length != 5){
                            base.error('提醒', '输入错误，"时"检查对应的时间点长度为 5');
                            ok = false;
                            return false;
                        }
                        break;
                    case 'd':
                        if(detail.length != 8){
                            base.error('提醒', '输入错误，"日"检查对应的时间点长度为 8');
                            ok = false;
                            return false;
                        }
                        break;
                    case 'M':
                        if(detail.length != 11){
                            base.error('提醒', '输入错误，"月"检查对应的时间点长度为 11');
                            ok = false;
                            return false;
                        }
                        break;
                    case 'y':
                        if(detail.length != 14){
                            base.error('提醒', '输入错误，"年"检查对应的时间点长度为 14');
                            ok = false;
                            return false;
                        }
                        break;

                    default:
                        base.error('提醒', '输入错误，时间点不能为空');
                        ok = false;
                        return false;
            	}
        		
        		obj.td_CHKTM.push(detail);
        	});
        	
        	if(!ok){
        		return null;
        	}
        	
        	obj.td_CHKTM = JSON.stringify(obj.td_CHKTM);
        	
        	//get the save data. should not modify this.ruleObj directly, save request could be fail on some case, like unauth
        	return $.extend({}, this.editData, this.ruleObj, obj);
        },
        
        _initEvents: function () {
        	var sub1 = topic.subscribe('component/ruleMgr/save', lang.hitch(this, function(data){
                this._save();
            }));
            
            this.own(sub1);
        }
    });
});
