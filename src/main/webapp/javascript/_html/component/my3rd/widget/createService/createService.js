
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "tool/validator",
    "root/pageSwitch/pageSwitch",
    "root/breadcrumb/BreadCrumb",
    "root/customScrollbar/CustomScrollBar",
    "root/fileSelector/FileSelector",
    "root/dateTimePicker/DateTimePicker",
    "root/dropdownBox/DropdownBox",
    "root/bootstrap-tagsinput/tagsinput",
    "dojo/text!./template/createService.html",
    "tool/css!./css/createService.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        validator,
        PageSwitch,
        BreadCrumb,
        CustomScrollBar,
        FileSelector,
        DateTimePicker,
        DropdownBox,
        Tagsinput,
        template){
    
    return declare("component.my3rd.widget.createService", [_Widget], {
        baseClass: "component_my3rd_widget_createService",
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
        
        _getEditData: function(callback){
            if(this.editData){
                callback();
            }else{
                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/thirdparty/normal/detail',
                    data: {
                        tpsId: this.tpsId
                    }
                }).success(lang.hitch(this, function(ret){
                    this.editData = $.extend({}, ret.data, {
                        tps_APIURL: this.tpsUrl,
                        tps_KEY: this.tpsKey
                    });
                    
                    callback();
                }));
            }
        },
        
        _initDom: function(){
            this.ps = new PageSwitch($(this.domNode).find('.steps')[0],{
        	    duration:600,
        	    direction:0,
        	    start:0,
        	    loop:false,
        	    ease:'ease',
        	    transition:'scrollX',
        	    freeze:false,
        	    mouse:false,
        	    mousewheel:false,
        	    arrowkey:false,
        	    autoplay:false,
        	    interval:0
        	});
        	
        	BreadCrumb.init($(this.domNode).find('.navSteps'), "cd-multi-steps text-top");
            
            this._initStep1();
            this._initStep2();
            this._initStep3();
            this._initStep4();
            this._initStep5();
            this._initStep6();
        },
        
        _step1Result: function(){
            var tpsNm = $(this.domNode).find('.steps .step1 .tpsNm').val();
            if(tpsNm.length == 0 || tpsNm.length > 30){
                base.error('错误', '名字不能为空长度不能超过30字符');
                return null;
            }
            
            if((!this.isEdit || this.imgModifiedOnEdit) && this.fileSel.getSelector()[0].files.length == 0){
                base.error('错误', '请选择图片');
                return null;
            }
            
            var tpsUrl = $(this.domNode).find('.steps .step1 .tpsUrl').val();
            if(tpsUrl.length == 0 || tpsUrl.length > 255){
                base.error('错误', '服务url地址不能为空且长度不能超过255字符');
                return null;
            }
            if(!validator.isUrl(tpsUrl)){
                base.error('错误', '服务url地址不合规范');
                return null;
            }
            
            //set the img id after uploaded
            return {tps_ID: this.tpsId, tps_NM: tpsNm, tps_APIURL: tpsUrl, tps_IMG: null, imgModifiedOnEdit: this.imgModifiedOnEdit};
        },
        
        _setp1Status: function(){
            this._getEditData(lang.hitch(this, function(){
                var parent = $(this.domNode).find('.steps .step1');
                
                parent.find('.tpsNm').val(this.editData.tps_NM);
                var lbSkey = parent.find('.lbSkey').text(this.editData.tps_KEY);
                lbSkey.parent().show();
                
                var img = $('<img>').attr('src', base.getServerNM('file') + 'fileApi/own/3rdService?fileId=' + this.editData.tps_IMG);
                parent.find('.imgDiv').append(img);
                
                parent.find('.tpsUrl').val(this.editData.tps_APIURL);
            }));
        },
        
        _initStep1: function(){
            this.fileSel = new FileSelector(
                $(this.domNode).find('.step1 .imgDiv'), 
                "image/jpeg,image/jpg,image/png,image/bmp", 
                lang.hitch(this, function(e){
                    this._loadImg(e);
                })
            );
            this.own(this.fileSel);
            
            $(this.domNode).find('.steps .step1 .next').click(lang.hitch(this, function(){
                if(!this._step1Result()){
                    return;
                }
                
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');
                
                this.ps.next();
            }));
            
            if(this.isEdit){
                this._setp1Status();
            }
        },
        
        _loadImg: function(file){
            var img = $(this.domNode).find('.step1 .imgDiv>img');
            
            if(file.currentTarget.files.length == 0){
                img.remove();
                return;
            }
            
            var upFile = file.currentTarget.files[0];
            
            if(upFile.size / 1024 > 200){
                base.error('错误', '图片不能超过200KB');
                img.remove();
                return;
            }
            
            //image preview in html5
            var reader = new FileReader();  
            reader.onload = lang.hitch(this, function(e){
                if(img.length == 0){
                    img = $('<img>');
                    $(this.domNode).find('.step1 .imgDiv').append(img);
                }
                
                img.attr('src', e.target.result);
                
                if(this.isEdit){
                    this.imgModifiedOnEdit = true;
                }
            });
            reader.readAsDataURL(upFile);
        },
        
        _step2Result: function(){
            var parent = $(this.domNode).find('.steps .step2');
            
            var brief = parent.find('.brief').val();
            if(brief.length == 0 || brief.length > 100){
                base.error('错误', '简介不能为空且不能超过100字符');
                return null;
            }
            
            var desc = parent.find('.desc').val();
            if(desc.length == 0 || desc.length > 1000){
                base.error('错误', '详述不能为空且不能超过1000字符');
                return null;
            }
            
            var help = parent.find('.help').val();
            if(help.length == 0 || help.length > 255){
                base.error('错误', '帮助url地址不能为空且不能超过255字符');
                return null;
            }
            if(!validator.isUrl(help)){
                base.error('错误', '帮助url地址不合规范');
                return null;
            }
            
            var visibleUids = null; 
            var visibleUidSel = parent.find('input[name="s3rdVisible"]:checked').val();
            if(visibleUidSel == '1'){
                visibleUids = base.getUid();
                
            }else if(visibleUidSel == '2'){
                var tags = Tagsinput.items({domNode: parent.find('input.visibleUids')});
                if(tags.length == 0){
                    base.error('错误', '指定可见的用户不能为空');
                    return null;
                    
                }else{
                    visibleUids = '';
                    for(var i=0; i<tags.length; i++){
                        visibleUids += tags[i].value + ',';
                    }
                    
                    visibleUids = visibleUids.substr(0, visibleUids.length - 1);
                    if(visibleUids.length > 1000){
                        base.error('错误', '指定可见的用户长度不能超过1000字符');
                        return null;
                    }
                }
            }
            
            return {tps_BRIEF: brief, tps_DESC: desc, tps_HELPURL: help, tps_VISIBLE_UIDS: visibleUids};
        },
        
        _setp2Status: function(){
            this._getEditData(lang.hitch(this, function(){
                var parent = $(this.domNode).find('.steps .step2');
                
                parent.find('.brief').val(this.editData.tps_BRIEF);
                parent.find('.desc').val(this.editData.tps_DESC);
                parent.find('.help').val(this.editData.tps_HELPURL);
                
                if(base.isNull(this.editData.tps_VISIBLE_UIDS)){
                    parent.find('input[name="s3rdVisible"][value="0"]').prop('checked', true).change();
                }else if(this.editData.tps_VISIBLE_UIDS == base.getUid()){
                    parent.find('input[name="s3rdVisible"][value="1"]').prop('checked', true).change();
                }else{
                    parent.find('input[name="s3rdVisible"][value="2"]').prop('checked', true).change();
                    
                    var addedData = [];
                    var uids = this.editData.tps_VISIBLE_UIDS.split(',');
                    if(uids.length > 0){
                        for(var i=0; i<uids.length; i++){
                            var tmp = uids[i].trim();
                            if(tmp.length > 0){
                                addedData.push({
                                    text: tmp,
                                    value: tmp
                                });
                            }
                        }
                    }
                    
                    if(addedData.length > 0){
                        Tagsinput.add({
                            domNode: parent.find('input.visibleUids'),
                            data: addedData
                        });
                    }
                }
            }));
        },
        
        _initStep2: function(){
            var step2Node = $(this.domNode).find('.steps .step2');
            
            step2Node.find('.prev').click(lang.hitch(this, function(){
                $(this.domNode).find('.navSteps .step1').removeClass('visited').addClass('current');
                $(this.domNode).find('.navSteps .step2').removeClass('current');
                
                this.ps.prev();
            }));
            
            step2Node.find('.next').click(lang.hitch(this, function(){
                if(!this._step2Result()){
                    return;
                }
                
                $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step3').addClass('current');
                
                this.ps.next();
            }));
            
            var visibleUidsNode = step2Node.find('input.visibleUids');
            Tagsinput.init({
                domNode: visibleUidsNode,
                valueField: 'value',
                textField: 'text',
                width: '100%',
                createItem: lang.hitch(this, function(text){
                    return {text: text, value: text};
                })
            });
            
            var visibleUidsCC = step2Node.find('div.visibleUidsCC');
            step2Node.find('input[name="s3rdVisible"]').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    var val = $(e.currentTarget).val();
                    if(val == '2'){
                        visibleUidsCC.show();
                    }else{
                        visibleUidsCC.hide();
                    }
                }
            }));
            
            if(this.isEdit){
                this._setp2Status();
            }
        },

        _step3Result: function(){
            var retObj = {
                tps_EXEC_TP: null,
                tps_TMS: null
            };
            
            var execTP = $(this.domNode).find('.steps .step3 .radioGp input:checked').val();
            retObj.tps_EXEC_TP = parseInt(execTP);
            
            if(execTP == '0'){
                var tmTypeSel = this.tmType.getCurrentSelect().value;
                if(base.isNull(tmTypeSel)){
                    base.error('错误', '请选择调用方式');
                    return null;
                }
                
                if(tmTypeSel == 'periodic'){
                    var interval = $(this.domNode).find('.steps .step3 .tmForm .interval').val();
                    if(!validator.isInt(interval) || parseInt(interval) < 1){
                        base.error('错误', '间隔周期必须为大于等于1的整数');
                        return null;
                    }
                    
                    //periodic time string starts with '+'
                    retObj.tps_TMS = ['+' + (parseInt(interval) * 60000)];
                    
                }else if(tmTypeSel == 'fixedTime'){
                    var ttArr = this._getSaveTTData();
                    if(base.isNull(ttArr)){
                        //_getSaveTTData has shown error
                        return null;
                    }
                    
                    retObj.tps_TMS = ttArr;
                }
            }
            
            return retObj;
        },
        
        _setp3Status: function(){
            this._getEditData(lang.hitch(this, function(){
                var parent = $(this.domNode).find('.steps .step3');
                
                var execTP = parseInt(this.editData.tps_EXEC_TP);
                
                parent.find('.radioGp input[value="'+ execTP +'"]').click();
                
                if(execTP == 0){
                    if(this.editData.tps_TMSTR.indexOf('+') == 0){
                        this.tmType.select('periodic');
                        parent.find('.tmForm .interval').val(parseInt(this.editData.tps_TMSTR) / 60000);
                        
                    }else{
                        this.tmType.select('fixedTime');
                        
                        var itemList = JSON.parse(this.editData.tps_TMSTR);
                        var tmParent = parent.find('.tmForm .chkTTs');
                        
                        for(var i=0; i<itemList.length; i++){
                            this._createChkTM(tmParent, itemList[i]);
                        }
                    }
                }
            }));
        },
        
        _initStep3: function(){
            var tmForm = $(this.domNode).find('.steps .step3 .tmForm');
            
            $(this.domNode).find('.steps .step3 .radioGp input').click(lang.hitch(this, function(e){
                var nodeVal = $(e.currentTarget).val();
                if(nodeVal == '1'){
                    tmForm.hide();
                }else{
                    tmForm.show();
                }
            }));
            
            this.tmType = new DropdownBox(tmForm.find('.tmType'), {
                minWidth: 60,
			    dropMinWidth: 80,
                placeholder: '选择方式',
                options: [{name: '周期性调用', value: 'periodic'}, {name: '固定时刻调用', value: 'fixedTime'}],
                onclick: lang.hitch(this, function(name, value){
                    var periodic = tmForm.find('.periodic');
                    var fixedTime = tmForm.find('.fixedTime');
                    if(value == 'periodic'){
                        fixedTime.hide();
                        periodic.show();
                    }else{
                        periodic.hide();
                        fixedTime.show();
                    }
                })
            });
            this.own(this.tmType);
            
            tmForm.find('i.add').click(lang.hitch(this, function(){
        		this._createChkTM(tmForm.find('.chkTTs'));
        	}));
            
            
            $(this.domNode).find('.steps .step3 .prev').click(lang.hitch(this, function(){
                $(this.domNode).find('.navSteps .step2').removeClass('visited').addClass('current');
                $(this.domNode).find('.navSteps .step3').removeClass('current');
                
                this.ps.prev();
            }));
            
            $(this.domNode).find('.steps .step3 .next').click(lang.hitch(this, function(){
                if(!this._step3Result()){
                    return;
                }
                
                $(this.domNode).find('.navSteps .step3').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step4').addClass('current');
                
                this.ps.next();
            }));
            
            if(this.isEdit){
                this._setp3Status();
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
        
        _getSaveTTData: function(){
        	var td_CHKTM = [];
        	
        	var chkTms = $(this.domNode).find('.steps .step3 .tmForm .chkTTs .chkTT');
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
        		
        		td_CHKTM.push(detail);
        	});
        	
        	if(!ok){
        		return null;
        	}
        	
        	return td_CHKTM;
        },
        
        _step4Result: function(){
            var apiIds = [];
            
            $(this.domNode).find('.steps .step4 .authListCC input:checked').each(function(){
                apiIds.push($(this).attr('apiId'));
            });
            
            return {authApis: apiIds};
        },
        
        _setp4Status: function(){
            this._getEditData(lang.hitch(this, function(){
                var parent = $(this.domNode).find('.steps .step4 .authListCC');
                
                for(var i=0; i<this.editData.auth_API.length; i++){
                    parent.find('.checkbox>input[apiId="'+ this.editData.auth_API[i].api_ID +'"]').prop('checked', true);
                }
            }));
        },
        
        _initStep4: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/authApis'
            }).success(lang.hitch(this, function(ret){
                this._createAuthList(ret.data);
                
                if(this.isEdit){
                    this._setp4Status();
                }
            }));
            
            $(this.domNode).find('.steps .step4 .prev').click(lang.hitch(this, function(){
                $(this.domNode).find('.navSteps .step3').removeClass('visited').addClass('current');
                $(this.domNode).find('.navSteps .step4').removeClass('current');
                
                this.ps.prev();
            }));
            
            $(this.domNode).find('.steps .step4 .next').click(lang.hitch(this, function(){
                if(!this._step4Result()){
                    return;
                }
                
                $(this.domNode).find('.navSteps .step4').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step5').addClass('current');
                
                this.ps.next();
            }));
        },
        
        _createAuthList: function(dataList){
            var addList = [];
            for(var i=0; i<dataList.length; i++){
                addList.push($('<div class="checkbox checkbox-primary"><input class="styled" type="checkbox" apiId="'+ dataList[i].api_ID +'" ><label>'+ dataList[i].api_NM +'</label></div>'));
            }
            
            $(this.domNode).find('.steps .step4 .authListCC').append(addList);
        },
        
        _step5Result: function(){
            var retObj = {
                fee_TP: null,
                fee_COUNT_FREE: null,
                fee_COUNT_NUM: null,
                fee_COUNT_BASE: null,
                fee_TIME_FREE: null,
                fee_TIME_PERIOD: null,
                fee_TIME_BASE: null
            };
            
            var feeTP = $(this.domNode).find('.steps .step5 .radioGp input:checked').val();
            retObj.fee_TP = parseInt(feeTP);
            
            if(feeTP == '1'){
                var countFree = $(this.domNode).find('.steps .step5 .countFree').val();
                if(!validator.isInt(countFree) || parseInt(countFree) < 0){
                    base.error('错误', '试用次数必须是大于等于0的整数');
                    return null;
                }
                
                var countNumSel = this.countNum.getCurrentSelect();
                if(base.isNull(countNumSel.value)){
                    base.error('错误', '请选择购买次数');
                    return null;
                }
                
                var countBase = $(this.domNode).find('.steps .step5 .countBase').val();
                if(!validator.isDouble(countBase) || parseFloat(countBase) < 0.01 ){
                    base.error('错误', '费用不能小于0.01');
                    return null;
                }
                
                retObj.fee_COUNT_FREE = parseInt(countFree);
                retObj.fee_COUNT_NUM = parseInt(countNumSel.value);
                retObj.fee_COUNT_BASE = parseFloat(countBase).toFixed(2);
                
            }else if(feeTP == '2'){
                var timeFree = $(this.domNode).find('.steps .step5 .timeFree').val();
                if(!validator.isInt(timeFree) || parseInt(timeFree) < 0){
                    base.error('错误', '试用天数必须是大于等于0的整数');
                    return null;
                }
                
                var timePeriodSel = this.timePeriod.getCurrentSelect();
                if(base.isNull(timePeriodSel.value)){
                    base.error('错误', '请选择购买时长');
                    return null;
                }
                
                var timeBase = $(this.domNode).find('.steps .step5 .timeBase').val();
                if(!validator.isDouble(timeBase) || parseFloat(timeBase) < 0.01){
                    base.error('错误', '费用不能小于0.01');
                    return null;
                }
                
                retObj.fee_TIME_FREE = parseInt(timeFree);
                retObj.fee_TIME_PERIOD = parseInt(timePeriodSel.value);
                retObj.fee_TIME_BASE = parseFloat(timeBase).toFixed(2);
            }
            
            return retObj;
        },
        
        _setp5Status: function(){
            this._getEditData(lang.hitch(this, function(){
                var parent = $(this.domNode).find('.steps .step5');
                
                var feeTP = parseInt(this.editData.fee_TP);
                
                parent.find('.radioGp input[value="'+ feeTP +'"]').click();
                
                if(feeTP == 1){
                    parent.find('.countFree').val(this.editData.fee_COUNT_FREE);
                    this.countNum.select('' + this.editData.fee_COUNT_NUM);
                    parent.find('.countBase').val(this.editData.fee_COUNT_BASE);
                    
                }else if(feeTP == 2){
                    parent.find('.timeFree').val(this.editData.fee_TIME_FREE);
                    this.timePeriod.select('' + this.editData.fee_TIME_PERIOD);
                    parent.find('.timeBase').val(this.editData.fee_TIME_BASE);
                }
            }));
        },
        
        _initStep5: function(){
            var feeCount = $(this.domNode).find('.steps .step5 .feeCount');
            var feeTime = $(this.domNode).find('.steps .step5 .feeTime');
            
            $(this.domNode).find('.steps .step5 .radioGp input').click(lang.hitch(this, function(e){
                var nodeVal = $(e.currentTarget).val();
                if(nodeVal == '0'){
                    feeCount.hide();
                    feeTime.hide();
                }else if(nodeVal == '1'){
                    feeTime.hide();
                    feeCount.show();
                }else{
                    feeCount.hide();
                    feeTime.show();
                }
            }));
            
            this.timePeriod = new DropdownBox($(this.domNode).find('.steps .step5 .timePeriod'), {
                minWidth: 60,
			    dropMinWidth: 80,
                placeholder: '选择购买时长',
                options: [{name: '1个月(30天)', value: '30'}, {name: '半年(180天)', value: '180'}, {name: '1年(360天)', value: '360'}]
            });
            this.own(this.timePeriod);
            
            this.countNum = new DropdownBox($(this.domNode).find('.steps .step5 .countNum'), {
                minWidth: 60,
			    dropMinWidth: 80,
                placeholder: '选择购买次数',
                options: [{name: '2000', value: '2000'}, {name: '5000', value: '5000'}, {name: '1万', value: '10000'}, {name: '5万', value: '50000'}, {name: '10万', value: '100000'}]
            });
            this.own(this.countNum);
            
            $(this.domNode).find('.steps .step5 .prev').click(lang.hitch(this, function(){
                $(this.domNode).find('.navSteps .step4').removeClass('visited').addClass('current');
                $(this.domNode).find('.navSteps .step5').removeClass('current');
                
                this.ps.prev();
            }));
            
            $(this.domNode).find('.steps .step5 .next').click(lang.hitch(this, function(){
                if(!this._step5Result()){
                    return;
                }
                
                this._save();
            }));
            
            if(this.isEdit){
                this._setp5Status();
            }
        },
        
        _save: function(){
            var step1Data = this._step1Result();
            if(step1Data == null){
                return;
            }
            var step2Data = this._step2Result();
            if(step2Data == null){
                return;
            }
            var step3Data = this._step3Result();
            if(step3Data == null){
                return;
            }
            var step4Data = this._step4Result();
            if(step4Data == null){
                return;
            }
            var step5Data = this._step5Result();
            if(step5Data == null){
                return;
            }
            
            var saveData = $.extend({}, step1Data, step2Data, step3Data, step4Data, step5Data);
            
            if(!this.isEdit || step1Data.imgModifiedOnEdit){
                base.upload({
                    url: base.getServerNM('file') + 'fileApi/own/3rdService',
                    inputFileObj: this.fileSel.getSelector()
                }).success(lang.hitch(this, function(upRet){
                    saveData.tps_IMG = upRet.data.fileId;
                    this._saveInner(saveData);
                }));
                
            }else{
                this._saveInner(saveData);
            }
        },
        
        _saveInner: function(saveData){
            base.ajax({
                hintOnSuccess: true,
                type: this.isEdit? 'PUT' : 'POST',
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/create',
                data: {
                    objStr: JSON.stringify(saveData)
                }
            }).success(lang.hitch(this, function(ret){
                topic.publish('component/my3rd/widget/createService/finished', ret.data);

                $(this.domNode).find('.steps .step6 .svNm').text(saveData.tps_NM);

                $(this.domNode).find('.navSteps .step5').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step6').addClass('current');

                this.ps.next();
            }));
        },
        
        _initStep6: function(){
            $(this.domNode).find('.steps .step6 .btn').click(lang.hitch(this, function(){
                topic.publish('component/my3rd/widget/createService/closeModal');
            }));
        },
        
        _initEvents: function(){
        }
    });
});
