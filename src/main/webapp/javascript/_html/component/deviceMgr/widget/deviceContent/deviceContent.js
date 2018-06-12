
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/customScrollbar/CustomScrollBar",
    "root/spin/Spin",
    "root/jquery-pwstabs-1.4.0/PwsTabs",
    'root/bootstrap-switch/BSwitch',
    './widget/metadata/metadata',
    "root/objectSelector/ObjectSelector",
    "root/bootstrap-tagsinput/tagsinput",
    "root/panel/Panel",
    "dojo/text!./template/deviceContent.html",
    "tool/css!./css/deviceContent.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        CustomScrollBar,
        Spin,
        PwsTabs,
        BSwitch,
        Metadata,
        ObjectSelector,
        Tagsinput,
        Panel,
        template){
    
    return declare("component.deviceMgr.widget.dc", [_Widget], {
        baseClass: "component_deviceMgr_widget_dc",
        templateString: template,
        
        authApi: {
            'clientInfo': '/platformApi/own/client/clientInfo',
            'firmwareUpgrade': '/platformApi/own/client/firmwareUpgrade'
        },
        
        /*
          args: {
            refreshInstanceId: 'xxxx'  //the instance id of the tree that this widget receive its topic message to refresh data
          }
        */
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
            }), 500);
        },
        
        destroy: function(){
        	this.inherited(arguments);
            
            if(this.hisFirmwareSelector){
                this.hisFirmwareSelector.destroy();
            }
            
            if(this.hisShadowSelector){
                this.hisShadowSelector.destroy();
            }
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
        },
        
        _formatJson: function(txt, compress){ 
            var indentChar = '    ';   
            if(/^\s*$/.test(txt)){    
                return txt;   
            }
            try{
            	var data=eval('('+txt+')');
            }   
            catch(e){
                console.log(e.description);   
                return txt;
            }
            var draw=[],last=false,This=this,line=compress?'':'\n',nodeCount=0,maxDepth=0;   
               
            var notify=function(name,value,isLast,indent,formObj){   
                nodeCount++;
                for (var i=0,tab='';i<indent;i++ )tab+=indentChar;
                tab=compress?'':tab;
                maxDepth=++indent;
                if(value&&value.constructor==Array){
                    draw.push(tab+(formObj?('"'+name+'":'):'')+'['+line);
                    for (var i=0;i<value.length;i++)   
                        notify(i,value[i],i==value.length-1,indent,false);   
                    draw.push(tab+']'+(isLast?line:(','+line)));
                }else   if(value&&typeof value=='object'){
                        draw.push(tab+(formObj?('"'+name+'":'):'')+'{'+line);
                        var len=0,i=0;   
                        for(var key in value)len++;   
                        for(var key in value)notify(key,value[key],++i==len,indent,true);   
                        draw.push(tab+'}'+(isLast?line:(','+line)));
                    }else{   
                        if(typeof value=='string')value='"'+value+'"';   
                            draw.push(tab+(formObj?('"'+name+'":'):'')+value+(isLast?'':',')+line);   
                    };
            };
            var isLast=true,indent=0;   
            notify('',data,isLast,indent,false);   
            return draw.join('');   
        },
        
        _initDom: function(){
        	this.tabs = PwsTabs.init($(this.domNode).find('.tabs'), {
                effect: 'none',
                tabChange: lang.hitch(this, function (preTab, currentTab) {
                    return true;
                })});
        	
        	BSwitch.init($(this.domNode).find('.bswitch'), {
        		handleWidth: 35, 
        		size: 'small', 
        		onColor: 'success', 
        		offColor: 'default', 
        		onText: '是', 
        		offText: '否', 
        		state: false, 
        		wrapperClass: 'bs', 
        		onChange: lang.hitch(this, function(e){
        		})
            });
        	
        	this.metadata = new Metadata();
        	$(this.domNode).find('.metadata').append($(this.metadata.domNode));
        	this.metadata.startup();
            this.own(this.metadata);
        	
        	$(this.domNode).find('.cmd button.save').click(lang.hitch(this, this._cmdSave));
            
            $(this.domNode).find('.cmd button.cancel').click(lang.hitch(this, function(){
                base.confirmSave('提示', '取消当前操作?', lang.hitch(this, function(){
                	topic.publish('common/widget/dat/canceAdd', this.selected);
                }));
            }));
            
            $(this.domNode).find('.stateDesc, .hisStateDesc').change(lang.hitch(this, function(e){
            	var state = $(e.currentTarget).val();
            	if(state.length > 0){
            		$(e.currentTarget).val(this._formatJson(state));
            	}
            }));
            
            base.ajax({
            	url: base.getServerNM() + 'platformApi/own/client/normal/manufacturer'
            }).success(lang.hitch(this, function(ret){
            	this.mfInfo = ret.data;
            	
            	var mf = $(this.domNode).find('select.manufacturer');
            	var pd = $(this.domNode).find('select.product');
            	for(var mfId in this.mfInfo){
            		mf.append('<option value="'+ this.mfInfo[mfId].mf_ID +'">'+ this.mfInfo[mfId].mf_NM +'</option>');
            	}
            	
            	mf.change(lang.hitch(this, function(e){
            		pd.find('option').remove();
            		
            		var item = this.mfInfo[mf.val()];
            		if(item && item.products){
            			for(var i=0; i<item.products.length; i++){
            				pd.append('<option value="'+ item.products[i].pd_ID +'">'+ item.products[i].pd_NM +'</option>');
            			}
            		}
            	}));
                
                mf.val(null);
            }));
            
            $(this.domNode).find('.lgtd,.lttd').change(lang.hitch(this, function(){
                if(this.selected && this.selected.newRow){
                    this._locationChange();
                }
            }));
            
            $(this.domNode).find('i.mapMarker').click(lang.hitch(this, function(){
                if(this.selected && this.selected.newRow){
                    var locMapDiv = $(this.domNode).find('div.locMap');
                    
                    if(!this.locMap){
                        spin = new Spin($(this.domNode).find('.clientCt div.base'));
                        
                        base.newDojo(
                            'component/deviceMgr/widget/deviceContent/widget/locationMap/locationMap',
                            'component.deviceMgr.widget.dc.locMap',
                            {center: [110.55, 33.25], zoom: 4}
                        ).success(lang.hitch(this, function(obj){
                            this.locMap = obj;
                            locMapDiv.find('div').append($(this.locMap.domNode));
                            
                            this.locMap.startup();
                            this.own(this.locMap);
                            
                            locMapDiv.slideDown(lang.hitch(this, function(){
                                /* locMap.refresh will reset the map its extent, but the the calculation of extend could be imprecision when the map haven't shown full(the animation such as sliding in jquery, even in the slideDown callback function), so we defer the action */
                                this.defer(lang.hitch(this, function(){
                                    this.locMap.resize();
                                    
                                    this.locMap.refresh(this.selected.newRow.dId);
                                    this._locationChange();
                                    
                                }), 200);
                                
                                spin.destroy();
                            }));
                        })).fail(function(){
                            spin.destroy();
                        });
                        
                    }else{
                        
                        locMapDiv.slideToggle(lang.hitch(this, function(){
                            if(locMapDiv.is(':visible')){
                                this.defer(lang.hitch(this, function(){
                                    this.locMap.resize();
                                    
                                    this.locMap.refresh(this.selected.newRow.dId);
                                    this._locationChange();
                                    
                                }), 200);
                            }
                        }));
                    }
                }
            }));
            
            Tagsinput.init({
                domNode: $(this.domNode).find('.clientCt .tabs>.base .cliTags'),
                valueField: 'value',
                textField: 'text',
                width: '100%',
                minHeight: '60px',
                focusWidth: '15px',
                keyCodes: [13, 9],
                createItem: lang.hitch(this, function(text){
                    text = text.trim();
                    if(text.length == 0){
                        return null;
                    }
                    
                    if(base.asciiLength(text) > 30){
                        base.error('错误', '标签长度最大30(ascii)');
                        return null;
                        
                    }else{
                        return {text: text, value: text};
                    }
                })
            });
            
            $(this.domNode).find('i.historyFirmware').click(lang.hitch(this, function(){
                if(this.selected && this.selected.newRow && this.selected.newRow.id && this.hisFirmwareSelector){
                    
                    this.hisFirmwareSelector.show(null, {width: '200px', height: '300px', top: '5px', right: '25px'});
                }
            }));
            
            $(this.domNode).find('i.historyShadow').click(lang.hitch(this, function(){
                if(this.selected && this.selected.newRow && this.selected.newRow.id && this.hisShadowSelector){
                    //okEvent, width, height, left, top, bottom, right
                    this.hisShadowSelector.show(lang.hitch(this, function(objContainer){
                        return this._hisShadowSelected(objContainer.data('data'));
                        
                    }), {width: '250px', height: '300px', top: '5px', right: '70px'});
                }
            }));
            
            $(this.domNode).find('i.upgradeFirmware').click(lang.hitch(this, function(){
                if(this.selected && this.selected.newRow && this.selected.newRow.id){
                    if(!this.firmwareUpgradePanel){
                        base.newDojo(
                            'component/deviceMgr/widget/deviceContent/widget/firmwareUpgrade/firmwareUpgrade',
                            'component.deviceMgr.widget.dc.fwUpg',
                            {clientId: this.selected.newRow.dId}
                        ).success(lang.hitch(this, function(obj){
                            
                            this.firmwareUpt = obj;
                            
                            this.firmwareUpgradePanel = new Panel($(this.domNode).find('.clientCt .tabs>.pro'), $(this.firmwareUpt.domNode), '固件升级');
                            this.own(this.firmwareUpgradePanel);
                            
                            this.firmwareUpt.startup();
                            this.own(this.firmwareUpt);
                            
                            this._showFirmwareUpgradePanel();
                        }));
                        
                    }else{
                        this._showFirmwareUpgradePanel();
                    }
                }
            }));
        },
        
        _hisShadowSelected: function(sel){
            if(base.isNull(sel)){
                base.info('提醒', '请选择一个参数版本');
                return false;

            }else if(sel.sd_ID != $(this.domNode).find('.curShadowID').val()){

                base.ajax({
                    url: base.getServerNM() + 'platformApi/own/client/normal/shadow',
                    data: {clientId: this.selected.newRow.dId, shadowId: sel.sd_ID}
                }).success(lang.hitch(this, function(ret){
                    var tmpList = ret.data;
                    if(tmpList && tmpList.length>0){
                        $(this.domNode).find('.hisShadowVersion').val(tmpList[0].sd_V);
                        $(this.domNode).find('.hisStateDesc').val(tmpList[0].sd_STATE_DESC).trigger('change');

                        $(this.domNode).find('.hisSD').show();
                    }
                }));
            }else{
                $(this.domNode).find('.hisSD').hide();
            }
            
            return true;
        },
        
        _locationChange: function(){
            var lgtd = $(this.domNode).find('.lgtd').val().trim();
            var lttd = $(this.domNode).find('.lttd').val().trim();

            if(this.locMap && lgtd && lgtd.length>0 && lttd && lttd.length>0){
                this.locMap.loc(lgtd, lttd);
            }else{
                this.locMap.loc(110.55, 33.25, 4);
            }
        },
        
        _showFirmwareUpgradePanel: function(){
            this.firmwareUpt.refresh(this.selected.newRow.dId);
            
            this.firmwareUpgradePanel.show({left: '20%', top: '60px'});
        },
        
        _initHistoryFirmWareSelector: function(){
            var tempDom = $(this.domNode).find('.tabs>.pro');
            
            this.hisFirewareInited = false;
            if(this.hisFirmwareSelector){
                this.hisFirmwareSelector.destroy();
            }
            
            this.hisFirmwareSelector = new ObjectSelector(
                tempDom, 
                '固件历史', 
                lang.hitch(this, function(objContainer){
                    
                    if(!this.hisFirewareInited){
                        var spin = new Spin(tempDom);
                    
                        base.ajax({
                            url: base.getServerNM() + 'platformApi/own/client/normal/historyFirmware',
                            data: {clientId: this.selected.newRow.dId}
                        }).success(lang.hitch(this, function(ret){
                            
                            for(var i=0; i<ret.data.length; i++){
                               objContainer.append(this._createHisFirmwareItem(ret.data[i])); 
                            }
                            
                            this.hisFirewareInited = true;
                            
                            spin.destroy();
                        })).fail(function(){
                            spin.destroy();
                        });
                    }
                }),
                '关 闭'
            );
        },
        
        _createHisFirmwareItem: function(item){
            var str = '<a href="javascript:void(0);" class="list-group-item hisItem2"><div>'+ item.fw_V +'</div>';

            str += '<span>'+ (new Date(item.upt_TS)).format('yyyy-MM-dd') +'</span><span>'+ (base.isNull(item.u_NM)? '' : item.u_NM) +'</span></a>';
            
            return str;
        },
        
        _initHistoryShadowSelector: function(){
            var tempDom = $(this.domNode).find('.tabs>.shadow');
            
            this.hisShadowInited = false;
            if(this.hisShadowSelector){
                this.hisShadowSelector.destroy();
            }
            
            this.hisShadowSelector = new ObjectSelector(
                tempDom, 
                '参数历史', 
                lang.hitch(this, function(objContainer){
                    objContainer.removeData('data');
                    objContainer.find('a.hisItem.active').removeClass('active');
                    
                    if(!this.hisShadowInited){
                        var spin = new Spin(tempDom);
                    
                        base.ajax({
                            url: base.getServerNM() + 'platformApi/own/client/normal/shadow',
                            data: {clientId: this.selected.newRow.dId}
                        }).success(lang.hitch(this, function(ret){
                            
                            for(var i=0; i<ret.data.length; i++){
                               this._createHisShadowItem(objContainer, ret.data[i]); 
                            }
                            
                            this.hisShadowInited = true;
                            
                            spin.destroy();
                        })).fail(function(){
                            spin.destroy();
                        });
                    }
                }),
                '查 看'
            );
        },
        
        _createHisShadowItem: function(objContainer, item){
            var str = '<a href="javascript:void(0);" class="list-group-item hisItem"><div>'+ item.sd_V +'</div>';

            str += '<span>'+ (new Date(item.upt_TS)).format('yyyy-MM-dd HH:mm') +'</span><span>'+ (base.isNull(item.u_NM)? '' : item.u_NM) +'</span></a>';
            
            var obj = $(str).click(function(){
                var self = $(this);
                self.parent().find('a').not(self).removeClass('active');
                self.addClass('active');
                
                objContainer.data('data', item);
                
            }).dblclick(lang.hitch(this, function(e){
                var self = $(e.currentTarget);
                self.parent().find('a').not(self).removeClass('active');
                self.addClass('active');
                
                this._hisShadowSelected(item);
                this.hisShadowSelector.hide();
            }));
            
            objContainer.append(obj);
        },
        
        _cmdSave: function(){
            if(this.selected && this.selected.newRow){
                if(this.selected.newRow.type == 'client'){
                    this._cmdSave_client();
                }else if(this.selected.newRow.type == 'group'){
                    this._cmdSave_group();
                }
            }
        },
        
        _cmdSave_client: function(){
            var cid = $(this.domNode).find('input.id').val().trim();
            var lgtd = $(this.domNode).find('.lgtd').val().trim();
            var lttd = $(this.domNode).find('.lttd').val().trim();
            
            if(cid.length == 0){
                base.info('提醒', '设备标识不能为空');
                return;
            }
            if(/\W/.test(cid)){
                base.info('提醒', '设备标识只能是数字/英文字符/下划线组成');
                return;
            }
            
            //if lgtd/lttd has value, it can't be an non floating value.
            if((lgtd.length > 0 && isNaN(parseFloat(lgtd)))
              || (lttd.length > 0 && isNaN(parseFloat(lttd)))
              || (lttd.length == 0 && lgtd.length > 0)
              || (lttd.length > 0 && lgtd.length == 0)){
                base.info('提醒', '经纬度输入错误');
                return;
            }
            
            var tagsArr = [];
            var tags = Tagsinput.items({domNode: $(this.domNode).find('.clientCt .tabs>.base .cliTags')});
            for(var i=0; i<tags.length; i++){
                tagsArr.push(tags[i].value);
            }
            
            var saveObj = {
                c_ID: cid,
                c_NM: $(this.domNode).find('.name').val().trim(),
                c_LGTD: lgtd,
                c_LTTD: lttd,
                c_PUBLIC: BSwitch.state($(this.domNode).find('.bswitch.isPublic'))? 1:0,
                mf_ID: $(this.domNode).find('select.manufacturer').val(),
                pd_ID: $(this.domNode).find('select.product').val(),
                cur_SD_STATE: $(this.domNode).find('.stateDesc').val(),
                gp_ID: this.selected.newRow.pDid,  //mind that pDid is the real value for 'group id in db'
                tags: tagsArr,
                metadatas: this.metadata.getDataForSave()
            };
            
            //clearly, this.selected != null, cause the save btn is invisible on add, so checking is unnecessary
            var isAdd = base.isNull(this.selected.newRow.id);
            
            base.ajax({
                hintOnSuccess: true,
                type: isAdd? 'POST' : 'PUT',  
                url: base.getServerNM() + 'platformApi/own/client/clientInfo',
                data: {'info': JSON.stringify(saveObj)}
            }).success(lang.hitch(this, function(ret){
                if(isAdd){
                    var treeData = ret.data;
                    $.extend(this.selected.newRow, {id: treeData.id, dId: treeData.dId, name: treeData.name, uid: base.getUid()});
                    
                }else{
                    $.extend(this.selected.newRow, {name: saveObj.c_NM});
                }
                
                //refresh the client data(change the dom visibility and value, such as id, crt_ts, etc..)
                this._setData(this.selected, true);
                
                topic.publish('common/widget/dat/update', this.selected.newRow);
                topic.publish('component/deviceMgr/widget/dc/widget/metadata/saved');
            }));
        },
        
        _cmdSave_group: function(){
            var gpName = $(this.domNode).find('input.gpName').val().trim();
            
            if(gpName.length == 0){
                base.info('提醒', '分组名字不能为空');
                return;
            }
            
            //mind that dId and pDid is the real value for 'group id in db'
            var saveObj = {
                id: this.selected.newRow.dId, 
                pId: this.selected.newRow.pDid,
                name: gpName,
            };
            
            var isAdd = base.isNull(this.selected.newRow.id);
            
            base.ajax({
                hintOnSuccess: true,
                type: isAdd? 'POST' : 'PUT',  
                url: base.getServerNM() + 'platformApi/own/sys/normal/dataGroup',
                data: saveObj
            }).success(lang.hitch(this, function(ret){
                if(isAdd){
                    $.extend(this.selected.newRow, {id: ret.data.id, dId: ret.data.dId, name: ret.data.name});
                }else{
                    $.extend(this.selected.newRow, {name: gpName});
                }
                
                topic.publish('common/widget/dat/update', this.selected.newRow);
                //hide cancel
                $(this.domNode).find('.cmd button.cancel').hide();
            }));
        },
        
        //if 'isAfterSaved == true', means the '_setData' action only need to refresh some specific dom node to reduce twinkle of page
        _setData: function(selected, isAfterSaved){
            this.selected = selected;
            
            if(!isAfterSaved){
                this._clearContent();
            }
            
            var btnSave = $(this.domNode).find('.cmd button.save');
            var benCancel = $(this.domNode).find('.cmd button.cancel');
            
            if(base.isNull(this.selected) || base.isNull(this.selected.newRow)){
            	btnSave.hide();
                benCancel.hide();
                
            }else{
            	if(this.selected.newRow.type == 'client'){
            		$(this.domNode).find('.groupCt').hide();
                	$(this.domNode).find('.clientCt').show();
                	
                }else if(this.selected.newRow.type == 'group'){
                	$(this.domNode).find('.clientCt').hide();
                	$(this.domNode).find('.groupCt').show();
                }
            	
                if(base.isNull(this.selected.newRow.id)){
                	btnSave.show();
                    benCancel.show();
                    
                    $(this.domNode).find('label.id').hide();
                    $(this.domNode).find('input.id').parent().show();
                    
                    this._setDataInner_add(this.selected.newRow);
                    
                }else{
                    benCancel.hide();
                    
                    $(this.domNode).find('input.id').parent().hide();
                    $(this.domNode).find('label.id').show();
                    
                    //some dom (like save button,firmware upgrade button) only visible when client's owner is the currentuser
                    if(this.selected.newRow.uid == base.getUid()){
                        btnSave.show();
                        
                    }else{
                        btnSave.hide();
                        $(this.domNode).find('i.upgradeFirmware').hide();
                    }
                    
                    this._setDataInner_edit(this.selected.newRow, isAfterSaved);
                }
            }
        },
        
        _clearContent: function(){
            $(this.domNode).find('.tabs input:not([type="radio"])').val(null).text('');
            $(this.domNode).find('.tabs label.labelForVal').html('');
            $(this.domNode).find('.tabs select').val(null);
            $(this.domNode).find('textarea').val(null);
            
            $(this.domNode).find('textarea.stateDesc').attr('disabled', 'disabled');
            
            Tagsinput.clear({
                domNode: $(this.domNode).find('.clientCt .tabs>.base .cliTags')
            });
            
            BSwitch.state($(this.domNode).find('.bswitch'), false);
            
            topic.publish('component/deviceMgr/widget/dc/widget/metadata/refresh', null);
            
            if(this.locMap){
                this.locMap.refresh();
            }
            
            $(this.domNode).find('.hisSD').hide();
            $(this.domNode).find('.locMap').hide();
            $(this.domNode).find('i.upgradeFirmware').show();
            
            if(this.firmwareUpgradePanel){
                this.firmwareUpgradePanel.hide();
            }
            
            if(this.hisFirmwareSelector){
                this.hisFirmwareSelector.destroy();
                this.hisFirmwareSelector = null;
            }
            
            if(this.hisShadowSelector){
                this.hisShadowSelector.destroy();
                this.hisShadowSelector = null;
            }
        },
        
        _setDataInner_add: function(row){
            if(row.type == 'client'){
            	$(this.domNode).find('input.name').val(row.name);
                
                topic.publish('component/deviceMgr/widget/dc/widget/metadata/refresh', {clientId: row.dId, uid: base.getUid(), metadata: []});
                
            }else if(row.type == 'group'){
            	$(this.domNode).find('input.gpName').val(row.name);
            }
        },
        
        _setDataInner_edit: function(row, isAfterSaved){
        	if(row.type == 'client'){
            	base.ajax({
                	url: base.getServerNM() + 'platformApi/own/client/clientInfo',
                	data: {clientId: row.dId}  //mind that dId is the 'client id in db'
                }).success(lang.hitch(this, function(ret){
                	var baseDom = $(this.domNode).find('.clientCt .tabs>.base');
                    var shadowDom = $(this.domNode).find('.clientCt .tabs>.shadow');
                    var proDom = $(this.domNode).find('.clientCt .tabs>.pro');
                    
                	var client = ret.data.client;
                    baseDom.find('label.id').text(client.c_ID);
                    
                    if(!isAfterSaved){
                        baseDom.find('input.id').val(client.c_ID);
                        baseDom.find('.name').val(client.c_NM);
                        baseDom.find('.lgtd').val(client.c_LGTD);
                        baseDom.find('.lttd').val(client.c_LTTD);
                        baseDom.find('select.manufacturer').val(client.mf_ID).trigger('change');
                        baseDom.find('select.product').val(client.pd_ID);
                        BSwitch.state(baseDom.find('.bswitch.isPublic'), client.c_PUBLIC == 1);
                        
                        if(client.tags && client.tags.length > 0){
                            var addedTags = [];
                            for(var i=0; i<client.tags.length; i++){
                                var tagNM = client.tags[i];
                                addedTags.push({
                                    text: tagNM,
                                    value: tagNM
                                });
                            }
                            
                            Tagsinput.add({
                                domNode: baseDom.find('.cliTags'),
                                data: addedTags
                            });
                        }
                    }
                    
                    baseDom.find('label.createTs').html((new Date(client.crt_TS)).format('yyyy-MM-dd HH:mm'));
                    
                    proDom.find('label.compress').html(client.c_COMPRESS? client.c_COMPRESS : '未压缩');
                    proDom.find('label.splitPacket').html(client.c_SPLITPACKET == 1 ? '需要' : '不需要');
                    proDom.find('label.minSubIntv').html(client.c_SUBINTV <= 0 ? '无限制' : (client.c_SUBINTV + ' ms'));
                    proDom.find('label.ptVersion').html(client.c_PV);
                    proDom.find('label.ownerUnm').html(client.c_OWNER_UNM);
                    proDom.find('.firmwareID').val(client.cur_FW_ID);
                    proDom.find('.firmwareNM').val(client.cur_FW_V);
                    
                    shadowDom.find('.curShadowID').val(client.cur_SD_ID);
                    shadowDom.find('.curShadowVersion').val(client.cur_SD_V);
                    
                    var stateDescObj = shadowDom.find('.stateDesc');
                    stateDescObj.val(client.cur_SD_STATE).trigger('change');
                    //the cur_SD_V != null, means the getShadow command created on device registration or append was successfully executed, client shadow has achieved and we can modify it now  
                    if(!base.isNull(client.cur_SD_V)){
                        stateDescObj.removeAttr('disabled');
                    }
                    
                    var metas = ret.data.metadata;
                    var metasList = [];
                    for(var i=0; i<metas.length; i++){
                        metasList.push($.extend({
                            id: metas[i].meta_ID,
                            pId: null,
                            name: base.isNull(metas[i].meta_NM) || metas[i].meta_NM.length ==0? metas[i].meta_CID : metas[i].meta_NM,
                            nocheck: true
                        }, metas[i]));
                    }
                    topic.publish('component/deviceMgr/widget/dc/widget/metadata/refresh', {clientId: row.dId, uid: row.uid, metadata: metasList, isAfterSaved: isAfterSaved});
                }));
                
                this._initHistoryShadowSelector();
                this._initHistoryFirmWareSelector();
            	
            }else if(row.type == 'group'){
            	$(this.domNode).find('input.gpName').val(row.name);
            }
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/dat/select', lang.hitch(this, function(data){
                if(!this.refreshInstanceId || (!base.isNull(data) && data.instanceId != this.refreshInstanceId)){
                    return;
                }
                
                this._setData(data);
            }));
            var sub2 = topic.subscribe('component/deviceMgr/widget/dc/widget/locMap/move', lang.hitch(this, function(data){
                $(this.domNode).find('.lgtd').val(data.lgtd);
                $(this.domNode).find('.lttd').val(data.lttd);
            }));
            var sub3 = topic.subscribe('component/deviceMgr/widget/dc/widget/firmwareUpgrade/finish', lang.hitch(this, function(data){
                this.firmwareUpgradePanel.hide();
                
                if(!base.isNull(data)){
                    $(this.domNode).find('.firmwareID').val(data.fw_ID);
                    $(this.domNode).find('.firmwareNM').val(data.fw_V);
                    
                    this._initHistoryFirmWareSelector();
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
            this.own(sub3);
        }
    });
});
