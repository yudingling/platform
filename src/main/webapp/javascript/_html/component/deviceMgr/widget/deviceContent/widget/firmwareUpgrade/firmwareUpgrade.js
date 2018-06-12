
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/pageSwitch/pageSwitch",
    "root/fileSelector/FileSelector",
    "common/widget/deviceActionTree/deviceActionTree",
    "root/breadcrumb/BreadCrumb",
    "dojo/text!./template/firmwareUpgrade.html",
    "tool/css!./css/firmwareUpgrade.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        PageSwitch,
        FileSelector,
        DeviceActionTree,
        BreadCrumb,
        template){
    
    return declare("component.deviceMgr.widget.dc.fwUpg", [_Widget], {
        baseClass: "component_deviceMgr_widget_dc_fwUpg",
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
        
        refresh: function(clientId){
            this.clientId = clientId;
            
            $(this.domNode).find('.steps .step2 .upgFile').val(null);
            $(this.domNode).find('.steps .step2 .upgVersion').val(null);
            $(this.domNode).find('.steps .step3 .btn').hide().unbind();
            $(this.domNode).find('.steps .step3 .finalInfo').html(null);
            
            $(this.domNode).find('.navSteps ol li').removeClass('visited').removeClass('current');
            $(this.domNode).find('.navSteps .step1').addClass('current');
            
            if(this.fileSel){
                this.fileSel.destroy();
                this.fileSel = null;
            }
            this.fileSel = new FileSelector($(this.domNode).find('i.fa-file'), ".*", lang.hitch(this, function(e){
                $(this.domNode).find('.steps .step2 .upgFile').val(e.currentTarget.files[0].name);
            }));
            this.own(this.fileSel);
            
            if(this.ps){
                this.ps.slide(0);
            }
            
            if(!this.upgTree){
                this.upgTree = new DeviceActionTree({
                    groupSelect: false, 
                    ownedClients: true, 
                    showCheckBox: true, 
                    loaded: lang.hitch(this, function(ztree){
                        this._checkClient(ztree);
                })});
                $(this.domNode).find('.steps .step1 .upgTree').append($(this.upgTree.domNode));
                this.upgTree.startup();
                this.own(this.upgTree);
                
            }else{
                this.upgTree.refresh(lang.hitch(this, function(ztree){
                    this._checkClient(ztree);
                }));
            }
        },
        
        _checkClient: function(ztree){
            var curNode = null;
                    
            var nodes = ztree.getAllNodes();
            for(var i=0; i<nodes.length; i++){
                if(nodes[i].dId == this.clientId){
                    curNode = nodes[i];
                    break;
                }
            }

            if(curNode){
                ztree.checkNode(curNode);
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
            
            this._initDomStep1();
        	this._initDomStep2();
        },
        
        _initDomStep1: function(){
        	$(this.domNode).find('.steps .step1 .next').click(lang.hitch(this, function(){
                var chkData = this.upgTree.getCheckedNodes();
                if(chkData.clients.length == 0){
                    base.error('输入错误', '请至少选择一个设备');
        			return;
                }
                
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');

                this.ps.next();
            }));
        },
        
        _initDomStep2: function(ps){
        	$(this.domNode).find('.steps .step2 .next').click(lang.hitch(this, function(){
                
                var upgFile = $(this.domNode).find('.steps .step2 .upgFile').val();
                var upgVersion = $(this.domNode).find('.steps .step2 .upgVersion').val().trim();
                
        		if(upgFile.length == 0){
        			base.error('输入错误', '请选择一个用于升级的固件');
        			return;
        		}
        		
        		if(upgVersion.length == 0){
        			base.error('输入错误', '版本号不能为空');
        			return;
        		}
                
                this.ps.next();
                
                $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step3').addClass('current');
                
        		this._initDomStep3(ps);
            }));
        	
        	$(this.domNode).find('.steps .step2 .prev').click(lang.hitch(this, function(){
        		$(this.domNode).find('.navSteps .step1').removeClass('visited').addClass('current');
        		$(this.domNode).find('.navSteps .step2').removeClass('current');
        		
        		this.ps.prev();
            }));
        },
        
        _initDomStep3: function(ps){
            var spin = new Spin($(this.domNode).find('.steps .step3'), null, '处理中...');
            
            base.upload({
                url: base.getServerNM('file') + 'fileApi/own/firmware',
                inputFileObj: this.fileSel.getSelector()
            }).success(lang.hitch(this, function(upRet){
                base.ajax({
                    type: 'POST',
                    url: base.getServerNM() + 'platformApi/own/client/firmwareUpgrade',
                    data: {
                        fileId: upRet.data.fileId,
                        curId: this.clientId,
                        clientIds: JSON.stringify(this.upgTree.getCheckedNodes().clients), 
                        version: $(this.domNode).find('.steps .step2 .upgVersion').val().trim()
                    }
                }).success(lang.hitch(this, function(ret){
                    
                    this._finishSetHtml(true, ret.data.ok, ret.data.fail);
                    
                    $(this.domNode).find('.steps .step3 .btn').show().click(function(){
                        topic.publish('component/deviceMgr/widget/dc/widget/firmwareUpgrade/finish', ret.data.curCf);
                    });
                    
                    spin.destroy();
                    
                })).fail(lang.hitch(this, function(msg){
                    this._finishSetHtml(false);
                    
                    $(this.domNode).find('.steps .step3 .btn').show().click(function(){
                        topic.publish('component/deviceMgr/widget/dc/widget/firmwareUpgrade/finish');
                    });
                    
                    spin.destroy();
                }));
                
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _finishSetHtml: function(success, ok, fail){
            if(success){
                var str = "成功升级 <span class='ok'>" + ok.length + "</span> 个设备：<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                    
                if(ok.length > 0){
                    for(var i=0; i<ok.length; i++){
                        str += "[" + ok[i] + ((i == ok.length-1)? "]" : "]、");
                    }
                }

                if(fail.length > 0){
                    str += "<br><br>其中 <span class='error'>" + fail.length + "</span> 个失败(设备所属者非当前用户)： <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
                    for(var i=0; i<fail.length; i++){
                        str += "[" + fail[i] + ((i == fail.length-1)? "]" : "]、");
                    }
                }

                $(this.domNode).find('.steps .step3 .finalInfo').html(str);
                
            }else{
                $(this.domNode).find('.steps .step3 .finalInfo').html("升级失败");
            }
        },
        
        _initEvents: function () {
        }
    });
});
