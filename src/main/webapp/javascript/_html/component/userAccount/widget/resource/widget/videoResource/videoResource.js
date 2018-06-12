
define([
    "tool/base",
    "dojo/_base/declare",
    "tool/_BaseWidget",
    "dojo/_base/lang",
    "dojo/topic",
    'root/jqwidgets/Jqx',
    "dojo/text!./template/videoResource.html",
    "tool/css!./css/videoResource.css",
], function(
        base,
        declare,
        _Widget,
        lang,
        topic,
        Jqx,
        template){
    
    return declare("component.userAccount.widget.resource.widget.videoResource", [_Widget], {
        baseClass: "component_userAccount_widget_resource_videoResource",
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
                this._setData();
                
            }), 500);
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
        	if(this.domNode){
        		$(this.domNode).find('.videoGrid>div').jqxGrid('destroy');
        	}
            
        	this.inherited(arguments);
        },
        
        _initDom: function(){
            $(this.domNode).find('.videoHead>a').click(lang.hitch(this, function(){
                topic.publish('component/userAccount/widget/resource/purchase', {resourceTp: 'video', minSize: 1});
            }));
        },
        
        _setData: function(){
            base.ajax({
                url: base.getServerNM() + 'platformApi/own/user/normal/resourceStatus/video'
            }).success(lang.hitch(this, function(ret){
                this._updateStatus(ret.data.status);
                this._createGrid(ret.data.videoList);
            }));
        },
        
        _updateStatus: function(status){
            var percent = 0;
            if(status.total < 0){
                percent = 0;
            }else if(status.total == 0){
                percent = 100;
            }else{
                percent = (status.current / status.total).toFixed(2);
                if(percent < 1){
                    percent *= 100;
                }else{
                    percent = 100;
                }
            }
            
            $(this.domNode).find('.progress-bar').attr('aria-valuenow', percent).css('width', percent + '%');
            $(this.domNode).find('.progress-bar>span').text(percent + '% 已用');
            if(status.total < 0){
                $(this.domNode).find('.processDesc').text('当前已用 ' + status.current +' 个，无限制');
            }else{
                var remain = status.total - status.current;
                if(remain < 0){
                    remain = 0;
                }
                $(this.domNode).find('.processDesc').text(remain + ' 个剩余，共 ' + status.total + ' 个')
            }
        },
        
        _createGrid: function(dataList){
            var source = {
                datatype: "array",
                localdata: dataList,
                datafields: [
                    { name: 'c_NM', type: 'string'},
                    { name: 'meta_NM', type: 'string'}
                ]
            };
            
            if(!this.gridInited){
                this.gridInited = true;
                
                $(this.domNode).find('.videoGrid>div').jqxGridCN({
                    width:'100%',
                    height: '100%',
                    source: new $.jqx.dataAdapter(source),
                    pageable: false,
                    autoheight: false,
                    sortable: false,
                    altrows: false,
                    enabletooltips: false,
                    editable: false,
                    theme: 'custom-zd',
                    showheader: true,
                    columnsresize: true,
                    columns: [
                        { text: '设备名称', datafield: 'c_NM', cellsalign: 'center', align: 'center', width: '55%'},
                        { text: '视频流元数据', datafield: 'meta_NM', cellsalign: 'center', align: 'center'}
                    ],
                    showtoolbar: true,
                    rendertoolbar: lang.hitch(this, function (toolbar){
                        toolbar.append($('<span class="videoGridTitle">当前视频流</span>'));
                    }),
                });
                
            }else{
                $(this.domNode).find('.videoGrid>div').jqxGrid({
                    source: new $.jqx.dataAdapter(source)
                });
            }
        },
        
        _initEvents: function(){
            var sub1 = topic.subscribe('component/userAccount/widget/resource/hide', lang.hitch(this, function(data){
            }));
            var sub2 = topic.subscribe('component/userAccount/widget/resource/changed', lang.hitch(this, function(data){
                if(data && data.resourceTp == 'video'){
                    this._updateStatus(data.status);
                }
            }));
            
            this.own(sub1);
            this.own(sub2);
        }
    });
});
