
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/echarts/echarts.min',
    "tool/validator",
    "root/jquery-pwstabs-1.4.0/PwsTabs",
    "root/customScrollbar/CustomScrollBar",
    "root/bootstrap-tagsinput/tagsinput",
    "dojo/text!./template/editor.html",
    "tool/css!./css/editor.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        echarts,
        validator,
        PwsTabs,
        CustomScrollBar,
        Tagsinput, 
        template){
    
    return declare("component.my3rd.widget.myCreated.widget.editor", [_Widget], {
        baseClass: "component_my3rd_widget_myCreated_widget_editor",
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
                
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            $(this.domNode).find('.cmd .cancel').click(lang.hitch(this, function(){
                topic.publish('component/my3rd/widget/myCreated/closeModal');
            }));
            
            this.tabs = PwsTabs.init($(this.domNode).find('.tabs'), {
                effect: 'none'
            });
            
            var baseNode = $(this.domNode).find('.base');
            var visibleUidsNode = baseNode.find('input.visibleUids');
            Tagsinput.init({
                domNode: visibleUidsNode,
                valueField: 'value',
                textField: 'text',
                width: '100%',
                focusWidth: '140px',
                createItem: lang.hitch(this, function(text){
                    return {text: text, value: text};
                })
            });
            
            var visibleUidsCC = baseNode.find('div.visibleUidsCC');
            baseNode.find('input[name="s3rdVisible"]').change(lang.hitch(this, function(e){
                if($(e.currentTarget).is(':checked')){
                    var val = $(e.currentTarget).val();
                    if(val == '2'){
                        visibleUidsCC.show();
                    }else{
                        visibleUidsCC.hide();
                    }
                }
            }));
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/detail',
                data: {
                    tpsId: this.tpsId
                }
            }).success(lang.hitch(this, function(ret){
                this._setContent(ret.data);
                
                $(this.domNode).find('.cmd .save').click(lang.hitch(this, function(){
                    this._save(ret.data);
                }));
            }));
        },
        
        _setContent: function(data){
            var baseNode = $(this.domNode).find('.base');
            baseNode.find('.brief').val(data.tps_BRIEF);
            baseNode.find('.desc').val(data.tps_DESC);
            baseNode.find('.help').attr('href', data.tps_HELPURL);
            
            if(base.isNull(data.tps_VISIBLE_UIDS)){
                baseNode.find('input[name="s3rdVisible"][value="0"]').prop('checked', true).change();
            }else if(data.tps_VISIBLE_UIDS == base.getUid()){
                baseNode.find('input[name="s3rdVisible"][value="1"]').prop('checked', true).change();
            }else{
                baseNode.find('input[name="s3rdVisible"][value="2"]').prop('checked', true).change();

                var addedData = [];
                var uids = data.tps_VISIBLE_UIDS.split(',');
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
                        domNode: baseNode.find('input.visibleUids'),
                        data: addedData
                    });
                }
            }
            
            var authList = $(this.domNode).find('.auth .authList');
            var lilist = [];
            for(var i=0; i<data.auth_API.length; i++){
                lilist.push($('<li>' + data.auth_API[i].api_NM + '</li>'));
            }
            authList.append(lilist);
            
            var feeFree = $(this.domNode).find('.feeset .feeFree').hide();
            var feeCount = $(this.domNode).find('.feeset .feeCount').hide();
            var feeTime = $(this.domNode).find('.feeset .feeTime').hide();
            
            var feeTp = parseInt(data.fee_TP);
            if(feeTp == 0){
                feeFree.show();
                
            }else if(feeTp == 1){
                feeCount.show();
                feeCount.find('.countFree').val(data.fee_COUNT_FREE);
                feeCount.find('.countNum').text(this._getCountStr(data));
                feeCount.find('.countBase').val(data.fee_COUNT_BASE);
                
            }else if(feeTp == 2){
                feeTime.show();
                feeTime.find('.timeFree').val(data.fee_TIME_FREE);
                feeTime.find('.timePeriod').text(this._getTimePeriodStr(data));
                feeTime.find('.timeBase').val(data.fee_TIME_BASE);
            }
            
            $(this.domNode).find('.runset .serviceKey').text(this.tpsKey);
            $(this.domNode).find('.runset .apiUrl').text(this.tpsUrl);
            $(this.domNode).find('.runset .execTp .execTpcc').html(this._getExecTpStr(data));
        },
        
        _getCountStr: function(data){
            var countNum = parseInt(data.fee_COUNT_NUM);
            var countNumStr = '';

            if(data.fee_COUNT_NUM < 10000){
                countNumStr = data.fee_COUNT_NUM;
            }else{
                var tmp = parseInt(countNum / 10000), tmp1 = countNum % 10000;
                if(tmp1 == 0){
                    countNumStr = tmp + '万';
                }else{
                    countNumStr = data.fee_COUNT_NUM;
                }
            }
            
            return countNumStr;
        },
        
        _getTimePeriodStr: function(data){
            var period = parseInt(data.fee_TIME_PERIOD);
            var tmp = parseInt(period / 30), tmp1 = period % 30;
            if(tmp == 1 && tmp1 == 0){
                return '1个月';
            }

            tmp = parseInt(period / 180);
            tmp1 = period % 180;
            if(tmp == 1 && tmp1 == 0){
                return '半年';
            }

            tmp = parseInt(period / 360);
            tmp1 = period % 360;
            if(tmp1 == 0){
                return tmp + '年';
            }

            return period + '天';
        },
        
        _getExecTpStr: function(data){
            var ttTp = parseInt(data.tps_EXEC_TP);
            
            if(ttTp == 0){
                var ttStr = data.tps_TMSTR;
                if(ttStr.indexOf('+') == 0){
                    return '后台自动调用，每隔' + (parseInt(ttStr) / 60000) + '分钟执行一次';
                    
                }else{
                    var chkTM = JSON.parse(ttStr);
                    
                    var added = [];
            		for(var i = 0; i < chkTM.length; i++){
            			var strObj = this._getChkTM(chkTM[i]);
                        if(strObj){
                            added.push(strObj);
                        }
                    }
                    
                    return added;
                }
                
            }else if(ttTp == 1){
                return '主动访问';
            }
        },
        
        _getChkTM: function(item){
            switch(item.length){
                case 2:
                    return '<span>每分的第' + item + '秒执行</span>';
                case 5:
                    return '<span>每时的' + item + '执行</span>';
                case 8:
                    return '<span>每日的' + item + '执行</span>';
                case 11:
                    return '<span>每月的' + item + '执行</span>';
                case 14:
                    return '<span>每年的' + item + '执行</span>';
                default:
                    return null;
            }
        },
        
        _save: function(data){
            var brief = $(this.domNode).find('.base .brief').val();
            if(brief.length == 0 || brief.length > 100){
                base.error('错误', '简介不能为空且不能超过100字符');
                return;
            }
            
            var desc = $(this.domNode).find('.base .desc').val();
            if(desc.length == 0 || desc.length > 1000){
                base.error('错误', '详述不能为空且不能超过1000字符');
                return;
            }
            
            var visibleUids = null; 
            var visibleUidSel = $(this.domNode).find('.base input[name="s3rdVisible"]:checked').val();
            if(visibleUidSel == '1'){
                visibleUids = base.getUid();
                
            }else if(visibleUidSel == '2'){
                var tags = Tagsinput.items({domNode: $(this.domNode).find('.base input.visibleUids')});
                if(tags.length == 0){
                    base.error('错误', '指定可见的用户不能为空');
                    return;
                    
                }else{
                    visibleUids = '';
                    for(var i=0; i<tags.length; i++){
                        visibleUids +=  tags[i].value + ',';
                    }
                    
                    visibleUids = visibleUids.substr(0, visibleUids.length - 1);
                    if(visibleUids.length > 1000){
                        base.error('错误', '指定可见的用户长度不能超过1000字符');
                        return;
                    }
                }
            }
            
            var feeTp = parseInt(data.fee_TP);
            var countFree, countBase, timeFree, timeBase;
            
            if(feeTp == 1){
                countFree = $(this.domNode).find('.feeset .countFree').val();
                if(!validator.isInt(countFree) || parseInt(countFree) < 0){
                    base.error('错误', '试用次数输入错误，必须为大于等于0的整数');
                    return;
                }
                countFree = parseInt(countFree);
                
                countBase = $(this.domNode).find('.feeset .countBase').val();
                if(!validator.isDouble(countBase) || parseFloat(countBase) < 0.01){
                    base.error('错误', '费用不能小于0.01');
                    return;
                }
                countBase = parseFloat(countBase).toFixed(2);
                
            }else if(feeTp == 2){
                timeFree = $(this.domNode).find('.feeset .timeFree').val();
                if(!validator.isInt(timeFree) || parseInt(timeFree) < 0){
                    base.error('错误', '试用天数输入错误，必须为大于等于0的整数');
                    return;
                }
                timeFree = parseInt(timeFree);
                
                timeBase = $(this.domNode).find('.feeset .timeBase').val();
                if(!validator.isDouble(timeBase) || parseFloat(timeBase) < 0.01){
                    base.error('错误', '费用不能小于0.01');
                    return;
                }
                timeBase = parseFloat(timeBase).toFixed(2);
            }
            
            base.ajax({
                type: 'PUT',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/thirdparty/normal/detail',
                data: {
                    tpsId: this.tpsId,
                    brief: brief,
                    desc: desc,
                    visibleUids: visibleUids,
                    countFree: countFree,
                    countBase: countBase,
                    timeFree: timeFree,
                    timeBase: timeBase
                }
            }).success(lang.hitch(this, function(ret){
                topic.publish('component/my3rd/widget/myCreated/updated', ret.data);
            }));
        },
        
        _initEvents: function(){
        }
    });
});
