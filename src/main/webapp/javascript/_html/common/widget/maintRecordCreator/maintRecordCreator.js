
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    "root/spin/Spin",
    "root/pageSwitch/pageSwitch",
    "common/widget/deviceActionTree/deviceActionTree",
    'common/widget/maintAreaTree/maintAreaTree',
    "root/breadcrumb/BreadCrumb",
    "dojo/text!./template/maintRecordCreator.html",
    "tool/css!./css/maintRecordCreator.css"
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Spin,
        PageSwitch,
        DeviceActionTree,
        MaintAreaTree,
        BreadCrumb,
        template){
    
    return declare("common.widget.maintRecordCreator", [_Widget], {
        baseClass: "common_widget_maintRecordCreator",
        templateString: template,
        
        /**
         * args: {
                clientIds: [],  //default clients that need to be checked
                maintDesc: xxx, //description of the maintenance record
                wrnId: xxxx
        	}
         * 
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
        },
        
        destroy: function(){
        	this.inherited(arguments);
        },
        
        _checkClient: function(ztree){
            if(this.clientIds && this.clientIds.length > 0){
                var nodes = ztree.getAllNodes();
                for(var i=0; i<nodes.length; i++){
                    var curNode = nodes[i];
                    
                    if(curNode.type == 'client' && this.clientIds.indexOf(curNode.dId) >= 0){
                        ztree.checkNode(curNode);
                    }
                }
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
            
            
            var textArea = $(this.domNode).find('.steps .step2 textarea');
            this.ps.on('after', function(fixIndex, current){
                //should not focus after 'next' method is called, that will negative the animation. do it on callback. 
                if(fixIndex == 1){
                    textArea.focus();
                }
            });
        	
        	BreadCrumb.init($(this.domNode).find('.navSteps'), "cd-multi-steps text-top");
            
            this.ps.slide(0);
            $(this.domNode).find('.navSteps ol li').removeClass('visited').removeClass('current');
            $(this.domNode).find('.navSteps .step1').addClass('current');
            
            this._initDomStep1();
        	this._initDomStep2();
            this._initDomStep3();
        },
        
        _initDomStep1: function(){
            this.upgTree = new DeviceActionTree({
                groupSelect: false, 
                ownedClients: true, 
                showCheckBox: true, 
                maxTitleAsciiLen: 49, 
                loaded: lang.hitch(this, function(ztree){
                    this._checkClient(ztree);
            })});
            $(this.domNode).find('.steps .step1 .upgTree').append($(this.upgTree.domNode));
            this.upgTree.startup();
            this.own(this.upgTree);
            
        	$(this.domNode).find('.steps .step1 .next').click(lang.hitch(this, function(){
                var chkData = this.upgTree.getCheckedNodes();
                if(chkData.clients_hasId.length == 0){
                    base.error('输入错误', '请至少选择一个设备');
        			return;
                }
                
                $(this.domNode).find('.navSteps .step1').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step2').addClass('current');

                this.ps.next();
            }));
        },
        
        _initDomStep2: function(ps){
            $(this.domNode).find('.steps .step2 textarea').val(this.maintDesc);
            
        	$(this.domNode).find('.steps .step2 .next').click(lang.hitch(this, function(){
                
                var maintDesc = $(this.domNode).find('.steps .step2 textarea').val();
                
        		if(maintDesc.length == 0){
        			base.error('输入错误', '工单描述不能为空');
        			return;
        		}
        		
                this.ps.next();
                
                $(this.domNode).find('.navSteps .step2').removeClass('current').addClass('visited');
                $(this.domNode).find('.navSteps .step3').addClass('current');
            }));
        	
        	$(this.domNode).find('.steps .step2 .prev').click(lang.hitch(this, function(){
        		$(this.domNode).find('.navSteps .step1').removeClass('visited').addClass('current');
        		$(this.domNode).find('.navSteps .step2').removeClass('current');
        		
        		this.ps.prev();
            }));
        },
        
        _initDomStep3: function(ps){
            this.psDist = new PageSwitch($(this.domNode).find('.steps .step3>div:first-child')[0],{
        	    duration:600,
        	    direction:0,
        	    start:0,
        	    loop:false,
        	    ease:'ease',
        	    transition:'scrollY',
        	    freeze:false,
        	    mouse:false,
        	    mousewheel:false,
        	    arrowkey:false,
        	    autoplay:false,
        	    interval:0
        	});
            
            var split = $(this.domNode).find('.steps .step3>div:first-child>div.distKind>div.split');
            $(this.domNode).find('.steps .step3>div:first-child>div.distKind>div:not(.split)').hover(function(){
                split.css('opacity', '0');
                
            }, function(){
                split.css('opacity', '1');
                
            }).click(lang.hitch(this, function(e){
                if($(e.currentTarget).hasClass('area')){
                    this.distSel = 'area';
                    this.psDist.slide(1);
                }else{
                    this.distSel = 'person'
                    this.psDist.slide(2);
                }
            }));
            
            $(this.domNode).find('.steps .step3>div:first-child>div>.return').click(lang.hitch(this, function(e){
                this.distSel = null;
                this.maintAreaTree.clearSelect();
                this.maintUserTree.clearSelect();
                
                this.psDist.slide(0);
            }));
            
            this.maintAreaTree = new MaintAreaTree({showCheckBox: true, maxTitleAsciiLen: 40});
            $(this.domNode).find('.steps .step3>div:first-child>div.distArea>div').append($(this.maintAreaTree.domNode));
            this.maintAreaTree.startup();
            this.own(this.maintAreaTree);
            
            this.maintUserTree = new MaintAreaTree({showCheckBox: true, withUser: true, maxTitleAsciiLen: 40});
            $(this.domNode).find('.steps .step3>div:first-child>div.distPerson>div').append($(this.maintUserTree.domNode));
            this.maintUserTree.startup();
            this.own(this.maintUserTree);
            
        	$(this.domNode).find('.steps .step3 .next').click(lang.hitch(this, function(){
                var ids = null;
                if(this.distSel == 'area'){
                    ids = this._getDistAreaIds();
                    
                }else if(this.distSel == 'person'){
                    ids = this._getDistPersonIds();
                }
                
                if(!ids || ids.length == 0){
                    base.error('输入错误', '请选择工单分发目标');
        			return;
                }
                
                var params = {
                    clientIds: JSON.stringify(this.upgTree.getCheckedNodes().clients_hasId),
                    wrnId: this.wrnId,
                    content: $(this.domNode).find('.steps .step2 textarea').val()
                };
                
                if(this.distSel == 'area'){
                    params.distAreaIds = JSON.stringify(ids);
                    
                }else if(this.distSel == 'person'){
                    params.distUIds = JSON.stringify(ids);
                }
                
        		this._callAdd(ps, params);
            }));
        	
        	$(this.domNode).find('.steps .step3 .prev').click(lang.hitch(this, function(){
        		$(this.domNode).find('.navSteps .step2').removeClass('visited').addClass('current');
        		$(this.domNode).find('.navSteps .step3').removeClass('current');
        		
        		this.ps.prev();
            }));
        },
        
        _callAdd: function(ps, params){
            var spin = new Spin($(this.domNode).find('.steps .step3'), null, '处理中...');
            
            base.ajax({
                type: 'POST',
                url: base.getServerNM() + 'platformApi/own/maint/maintRecord/update',
                data: params
            }).success(lang.hitch(this, function(ret){
                spin.destroy();
                
                this._finish(ret.data);
                
            })).fail(lang.hitch(this, function(msg){
                spin.destroy();
            }));
        },
        
        _getDistAreaIds: function(){
            var chkData = this.maintAreaTree.getCheckedNodes();
            
            var retIds = [];
            var nodes = chkData.chkNodes;
            for(var i=0; i<nodes.length; i++){
                if(nodes[i].dId == '-1'){
                    retIds.push('-1');
                    
                }else{
                    retIds.push(nodes[i].nodeData.ma_ID);
                }
            }
            
            return retIds;
        },
        
        _getDistPersonIds: function(){
            var chkData = this.maintUserTree.getCheckedNodes();
            
            var retIds = [];
            var nodes = chkData.chkNodes;
            for(var i=0; i<nodes.length; i++){
                if(nodes[i].type == 'client'){
                    retIds.push(nodes[i].dId);
                }
            }
            
            return retIds;
        },
        
        _finish: function(newRecord){
            this.ps.next();
            
            $(this.domNode).find('.navSteps .step3').removeClass('current').addClass('visited');
            $(this.domNode).find('.navSteps .step4').addClass('current');
            
            topic.publish('common/widget/maintRecordCreator/finish', $.extend({instanceId: this.instanceId}, newRecord));
            
            $(this.domNode).find('.steps .step4 .btn').show().click(function(){
                topic.publish('common/widget/maintRecordCreator/close');
            });
            
            this.ps.next();
        },
        
        _initEvents: function () {
        }
    });
});
