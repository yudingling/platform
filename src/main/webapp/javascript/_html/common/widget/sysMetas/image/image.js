
define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/_base/lang",
    "dojo/topic",
    "../metaPlugin/metaPlugin",
    "root/spin/Spin",
    "tool/validator",
    'root/pageSwitch/pageSwitch',
    'root/drawerMenu_s/DrawerMenu_s',
    'root/unitegallery/gallery',
    "dojo/text!./template/image.html",
    "tool/css!./css/image.css"
], function(
        base,
        declare,
        lang,
        topic,
        metaPlugin,
        Spin,
        Validator,
        PageSwitch,
        DrawerMenu,
        Gallery,
        template){
    
    return declare("common.widget.sysMetas.image", [metaPlugin], {
        baseClass: "common_widget_sysMetas_image",
        templateString: template,
        
        authApi: {
            'imageData': '/platformApi/own/seriesUpdate/imageData',
            'metaCommand_realTime': '/platformApi/own/command/getRealTimeData'
        },
        
        /**
         * all required options defined in 'metaPlugin.baseOptions' and 'this.options' should be provided in args of constructor
         *   like 'metaPlugin.baseOptions', 'options' also a reference type, we need to mix its value to the instance in the constructor.
         */
        options: {
            dataUrl: 'platformApi/own/series/imageData',
            stm: '2015-12-10 08:00:00',     //required
            etm: '2015-12-15 08:30:00'      //required
        },
        
        constructor: function (args) {
            declare.safeMixin(this, this.options);
            declare.safeMixin(this, args);
            
            this._initEvents();
        },
        
        postCreate: function () {
            this.inherited(arguments);
            
            this._initDom();
        },
        
        startup: function () {
            this.inherited(arguments);
            
            this.resizeBind = lang.hitch(this, function(){
                this._resizeManual();
            });
            $(window).resize(this.resizeBind);
            
            this.defer(lang.hitch(this, function(){
                this._setData();
                
            }), 500);
        },
        
        bindAuthed: function(){
            this.inherited(arguments);
            
            this._setCmdVisible();
        },
        
        destroy: function(){
            //jqxGrid need to be destroy before parent.destroy being called.(this action need the dom node and parent.destroy will destroy all dom nodes)
            //editor contains jqxGrid
            this._destroyEditor();
            
        	this.inherited(arguments);
            
            if(this.resizeBind){
                $(window).unbind('resize', this.resizeBind);
            }
            
            this._destroyGallery();
        },
        
        refresh: function(args){
            this.inherited(arguments);
            
            this._clearData();
            
            declare.safeMixin(this, args);
            
            this._setData();
        },
        
        _resizeManual: function(){
            if(this.gallery){
                this.gallery.resize($(this.domNode).width(), $(this.domNode).height());
            }
        },
        
        _setCmdVisible: function(){
            if(!this.showEditor){
                $(this.domNode).find('.drawerMenu li.editData').hide();
            }
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + 'platformApi/own/client/normal/base',
                data: {
                    clientId: this.clientId
                }
            }).success(lang.hitch(this, function(ret){
                if(base.getUid() != ret.data.c_OWNER_UID){
                    $(this.domNode).find('.drawerMenu li.showCmd').hide();
                }
                
            })).fail(lang.hitch(this, function(ret){
                $(this.domNode).find('.drawerMenu li.showCmd').hide();
            }));
        },
        
        _initDom: function(){
            this.ps = new PageSwitch($(this.domNode).find('.slc')[0],{
                duration:600,
                direction:0,
                start:0,
                loop:false,
                ease:'ease',
                transition:'scrollX',  //flowX
                freeze:false,
                mouse:false,
                mousewheel:false,
                arrowkey:false,
                autoplay:false,
                interval:0
            });
            
            this.ps.on('after', lang.hitch(this, function(index){
                if(index == 0){
                    this._resizeManual();
                }
            }));
            
            $(this.domNode).find('.drawerMenu li.showChart').css('display', 'block').click(lang.hitch(this, function(){
                this.ps.prev();
            }));
            
            $(this.domNode).find('.drawerMenu li.showCmd').click(lang.hitch(this, function(){
                this.ps.next();
            }));
            
            $(this.domNode).find('.drawerMenu li.editData').click(lang.hitch(this, function(){
                this._showEditor();
            }));
            
            DrawerMenu.init($(this.domNode).find('.drawerMenu'), '#67bbaa');
            
            $(this.domNode).find('.callDataContainer button.cmdBtn').click(lang.hitch(this, function(){
                this._callDataInCmd();
            }));
            
            $(this.domNode).find('.callDataContainer .clientNm').html(this.clientNm);
            $(this.domNode).find('.callDataContainer .metaNm').html(this.metaNm? this.metaNm : this.metaCId);
            
            //hide the menu when size is 'small'
            if(this.size == 'small'){
                $(this.domNode).find('.drawerMenu').hide();
            }
            
            $(this.domNode).children('.modal').on('hide.bs.modal', lang.hitch(this, function(e){
                if(!this.closeByEditor){
                    topic.publish('common/widget/sysMetas/image/modalClosing');
                    e.preventDefault();
                }
            }));
        },
        
        _showEditor: function(){
            this._destroyEditor();
            
            base.newDojo(
                'common/widget/sysMetas/image/widget/editor/editor', 
                'image.editor', 
                {
                    stm: this.stm,
                    etm: this.etm,
                    clientId: this.clientId,
                    metaId: this.metaId
                }
            ).success(lang.hitch(this, function(obj){
                this.editor = obj;
                
                var modal = $(this.domNode).children('.modal').modal({backdrop: 'static', keyboard: false});
                modal.find('.modal-title').html(this.clientNm + '<span style="color: #f3f3f3; margin-left: 5px;">[' + (this.metaNm? this.metaNm : this.metaCid) + ']</span>');
                modal.find('.modal-body').removeClass('editor').append($(this.editor.domNode));
                this.editor.startup();
            }));
        },
        
        _destroyEditor: function(){
            if(this.editor){
                this.editor.destroyRecursive();
                this.editor = null;
            }
            
            this.closeByEditor = false;
        },
        
        _callDataInCmd: function(){
            base.ajax({
                type: 'POST',
                hintOnSuccess: true,
                url: base.getServerNM() + 'platformApi/own/command/getRealTimeData',
                data: {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    metaCId: this.metaCId
                }
            }).success(lang.hitch(this, function(ret){
                var descLabel = $(this.domNode).find('.callDataContainer label.desc');
                descLabel.show().html('已提交指令，设备会自动响应并返回您的数据，但何时响应依赖于设备的在线状态，请耐心等待.').css('opacity', 1);
                
                if(this.descTimeOut){
                    clearTimeout(this.descTimeOut);
                    this.descTimeOut = null;
                }
                
                this.descTimeOut = setTimeout(function(){
                    descLabel.css('opacity', 0).one('webkitTransitionEnd transitionend', function(){
                    	descLabel.off('webkitTransitionEnd transitionend');
                    	descLabel.html('').hide();
                    });
                }, 5000);
                
            }));
        },
        
        _refreshChart: function(data){
            var nodes = [];
            var titleDesc = (this.metaNm? this.metaNm : this.metaCid) + (this.size == 'normal'? (' [' + this.clientNm + ']') : '') + '：';
            
            var isEmpty = false;
            if(base.isNull(data) || data.length == 0){
                isEmpty = true;
                data.push({if_ID: null, if_COLTS: null, url: base.getServerNM() + 'javascript/_html/common/widget/sysMetas/image/img/empty.png'});
            }
            
            for(var i=0; i<data.length; i++){
                var descFix = base.isNull(data[i].if_COLTS) ? '暂无数据' : (new Date(data[i].if_COLTS)).format('yyyy-MM-dd HH:mm:ss.fff');
                nodes.push($('<img src="'+ data[i].url +'" data-image="'+ data[i].url +'" data-description="'+ titleDesc + descFix +'">'));
            }
            
            var galleryNode = $(this.domNode).find('.slc>div.galleryCC>div');
            
            galleryNode.append(nodes);
            
            var options = {
                gallery_width: $(this.domNode).width(),
				gallery_height: $(this.domNode).height(),
                slider_enable_zoom_panel: false,
                gallery_preserve_ratio: false,
                theme_enable_play_button: false,
                slider_enable_play_button: false,
                slider_scale_mode: 'fit'
            };
            
            if(this.size == 'small'){
                options['slider_controls_always_on'] = false;
                options['gallery_theme'] = 'compact';
                options['theme_panel_position'] = 'right';
                
                options['slider_fullscreen_button_offset_hor'] = 11;
                
                options['strippanel_enable_buttons'] = true;
                options['strip_control_avia'] = false;
            }
            
            if(isEmpty){
                options['theme_enable_fullscreen_button'] = false;
                options['slider_enable_arrows'] = false;
                options['slider_enable_fullscreen_button'] = false;
            }
            
            this.gallery = new Gallery(galleryNode, options);
        },
        
        _clearData: function(){
            this._destroyGallery();
        },
        
        _destroyGallery: function(){
            if(this.gallery){
                this.gallery.destroy();
                this.gallery = null;
            }
        },
        
        _setData: function(){
            var spin = new Spin($(this.domNode));
            
            base.ajax({
                type: 'GET',
                url: base.getServerNM() + this.dataUrl,
                data: {
                    clientId: this.clientId,
                    metaId: this.metaId,
                    stm: this.stm,
                    etm: this.etm
                }
            }).success(lang.hitch(this, function(ret){
                this._refreshChart(ret.data);
                
                spin.destroy();
            })).fail(function(){
                spin.destroy();
            });
        },
        
        _initEvents: function () {
            var sub1 = topic.subscribe('common/widget/sysMetas/image/closeModal', lang.hitch(this, function(){
                this.closeByEditor = true;
                $(this.domNode).children('.modal').modal('hide');
            }));
            
            this.own(sub1);
        }
    });
});
