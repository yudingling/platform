/**
 * 自定义滑动组件
 */

define(['dojo/_base/declare',
        'dojo/_base/lang',
        "dojo/topic",
        'tool/base',
        "root/customScrollbar/CustomScrollBar",
        'root/jquery-easing/jquery.easing-1.3', 
        'tool/css!./Slider.css'], 
        function(declare, lang, topic, base, CustomScrollBar, easing){
	
	var opts = {
        //停靠对象
        dependObj: null,
        //初始显示位置 left top right bottom
        position: {},
        //滑动方向 left, right, up, down
        direction: 'left',
        //隐藏时是否使用动画
        animateWhenHide: true,
        //easing 方式
        easing: 'easeOutCirc',
        //透明度
        opacity: 1,
        //宽度
        //width: 300,
        //高度
        //height: 400,
        //初始化后立即显示
        showOnInit: true,
        //设置 objectContainer 的 z-index
        zindex: null,
        //保留不缩进的高度/宽度
        retainSize: 0,
        //是否显示推拉button
        pullBtn: true,
        //背景色
        backgroundColor: '#fafafa',
        //是否自带滚动条
        customscrollbar: true,
        animateMs: 500
    };
	
	var setData = function (domIdOrObj, that) {
        if(Object.prototype.toString.call(domIdOrObj) === '[object String]')
        	domIdOrObj = $('#' + domId);
		var slideObj = domIdOrObj;
		
        //初始化 slideObj 并隐藏
        if(that.setting.width){
		  slideObj.width(that.setting.width);
        }else{
            slideObj.css('width', '100%');
        }
        if(that.setting.height){
            slideObj.height(that.setting.height);
        }else{
            slideObj.css('height', '100%');
        }
        
        slideObj.addClass('slider').hide();

		var objContainer = $('<div>').addClass('objContainer');
        if(that.setting.zindex){
            objContainer.css('z-index', that.setting.zindex);
        }

        that.setting.dependObj.parent().append(objContainer);

        //添加 slideObj 到 objContainer
        objContainer.append(slideObj);
        
        //coverReverse
        var coverReverse = $('<div class="slideCoverReverse"></div>');
        slideObj.contents().appendTo(coverReverse);
        
        slideObj.append(coverReverse);
        
        //cover
        var cover = $('<div class="slideCover"></div>').css('opacity', that.setting.opacity).css('background-color', that.setting.backgroundColor);
        slideObj.append(cover);
        
        //slide  的button
        var outWidth = slideObj.outerWidth();
        var outHeight = slideObj.outerHeight();
        
        var slideBtn = $('<div class="pullBtnDiv"><i></i></div>');
        if(that.setting.direction == 'right'){
        	slideObj.addClass('right');
        	
        	slideBtn.addClass('right');
        	slideBtn.children('i').addClass('fa fa-angle-right');
        	
        	objContainer.append(slideBtn);
        	
        }else if(that.setting.direction == 'left'){
        	slideObj.addClass('left');
        	
        	slideBtn.addClass('left');
        	slideBtn.children('i').addClass('fa fa-angle-left');
        	
        	objContainer.append(slideBtn);
        	
        }else if(that.setting.direction == 'up'){
        	slideObj.addClass('up');
        	
        	slideBtn.addClass('up');
        	slideBtn.children('i').addClass('fa fa-angle-down');
        	
        	objContainer.prepend(slideBtn);
        	
        }else{
        	slideObj.addClass('down');
        	
        	slideBtn.addClass('down');
        	slideBtn.children('i').addClass('fa fa-angle-up');
        	
        	objContainer.append(slideBtn);
        }
        
        if(!that.setting.pullBtn){
            slideBtn.css('display', 'none');
        }else{
            slideBtn.click(function(){
                togglePrivate(that);
            });
        }
  
        //注意，此处得加上，低版本的 jquery 中， 上面虽然设置了 display：none, 但不起作用，获取 visible 还是为 true
        objContainer.css('position', 'absolute').hide();
        
        that.slideData = {'slideObj':slideObj, 'slideBtn':slideBtn, 'objContainer':objContainer, 'coverReverse': coverReverse};
    };
	
	var showPrivate = function (that, animate, native) {
        if (!isSlideObjVisible(that)) {
            var curData = that.slideData;
            
            if(!curData.objContainer.is(':visible')){
                curData.objContainer.show();
            }
            
            //注意，高度及宽度要设定为 outer size
            var outWidth = curData.slideObj.outerWidth();
            var outHeight = curData.slideObj.outerHeight();
            
            //设置 objContainer 的宽高与位置
        	if(that.setting.direction == 'right' || that.setting.direction == 'left'){
        		curData.objContainer.width(outWidth + curData.slideBtn.outerWidth());
        	}else{
        		curData.objContainer.height(outHeight + curData.slideBtn.outerHeight());
        	}
        	
            var callback = lang.hitch(that, function (obj) {
                changeState(this);
                if(that.setting.customscrollbar){
                    showCustomScroll(this);
                }
            });
            
            var aniTM = animate? that.setting.animateMs : 0;

        	//不同的方向，按照不同的顺序添加 cover 对象，并设置不同的 float
            if (that.setting.direction == 'left') {
            	curData.objContainer.css('right', that.setting.position.right).css('top', that.setting.position.top).css('bottom', that.setting.position.bottom);
                
            	//设置 margin-left
            	if(base.isMobileDevice()){
            		curData.slideObj.css('margin-right', '0px');
                	callback();
            		
            	}else{
            		curData.slideObj.css('margin-right', (0 - outWidth) + 'px');
                	curData.slideObj.animate({ marginRight: '0px' }, aniTM, that.setting.easing, callback);
            	}
            }
            else if (that.setting.direction == 'right') {
            	curData.objContainer.css('left', that.setting.position.left).css('top', that.setting.position.top).css('bottom', that.setting.position.bottom);

            	if(base.isMobileDevice()){
            		curData.slideObj.css('margin-left', '0px');
                	callback();
                	
            	}else{
            		curData.slideObj.css('margin-left', (0 - outWidth) + 'px');
                	curData.slideObj.animate({ marginLeft: '0px' }, aniTM, that.setting.easing, callback);
            	}
            }
            else if (that.setting.direction == 'up') {
            	curData.objContainer.css('left', that.setting.position.left).css('right', that.setting.position.right).css('bottom', that.setting.position.bottom);

            	if(base.isMobileDevice()){
                	curData.slideBtn.css('margin-top', '0px');
                	callback();
                	
            	}else{
                	curData.slideBtn.css('margin-top', outHeight + 'px');
                	curData.slideBtn.animate({ marginTop: '0px' }, aniTM, that.setting.easing, callback);
            	}
            }
            else {
            	curData.objContainer.css('left', that.setting.position.left).css('right', that.setting.position.right).css('top', that.setting.position.top);
            	
            	if(base.isMobileDevice()){
                	curData.slideObj.css('margin-top', '0px');
                	callback();
                	
            	}else{
            		curData.slideObj.show().css('margin-top', (0 - outHeight) + 'px');
            		curData.slideObj.animate({ marginTop: '0px' }, aniTM, that.setting.easing, callback);
            	}
            }
            
            curData.slideObj.show()
        	curData.objContainer.show();
            
            topic.publish('root/slider/show', that.slideData.slideObj);
        }
    };
    
    //you cann't init customscrollbar on creating slider(cause some unexpected result). do it after being shown (here we called after 'showprivate' animate)
    var showCustomScroll = function(that){
        if(!that.slideData.customScrolled){
            CustomScrollBar.init(that.slideData.coverReverse);
            that.slideData.customScrolled = true;
        }
    };

    var hidePrivate = function (that, animate, native) {
        if (isSlideObjVisible(that)) {
            if(base.isNull(animate)){
                animate = that.setting.animateWhenHide;
            }
            
            if (animate) {
                var curData = that.slideData;
                
            	var outWidth = curData.slideObj.outerWidth();
                var outHeight = curData.slideObj.outerHeight();
                
                var callback = lang.hitch(that, function (obj) {
                    changeState(this);
                    hideObjectContainer(that, native);
                });
            	
                if (that.setting.direction == 'left') {
                	if(base.isMobileDevice()){
                		curData.slideObj.css('margin-right', (0 - outWidth) + 'px');
                		callback();
                	}else{
                		curData.slideObj.animate({ marginRight: (0 - outWidth) + 'px'}, that.setting.animateMs, that.setting.easing, callback);
                	}
                }
                else if (that.setting.direction == 'right') {
                	if(base.isMobileDevice()){
                		curData.slideObj.css('margin-left', (0 - outWidth + that.setting.retainSize) + 'px');
                		callback();
                	}else{
                		curData.slideObj.animate({ marginLeft: (0 - outWidth + that.setting.retainSize) + 'px' }, that.setting.animateMs, that.setting.easing, callback);
                	}
                }
                else if (that.setting.direction == 'up') {
                	if(base.isMobileDevice()){
                		curData.slideBtn.css('margin-top', (outHeight - that.setting.retainSize) + 'px');
                		callback();
                	}else{
                		curData.slideBtn.animate({ marginTop: (outHeight - that.setting.retainSize) + 'px' }, that.setting.animateMs, that.setting.easing, callback);
                	}
                }
                else {
                	if(base.isMobileDevice()){
                		curData.slideObj.css('margin-top', (0 - outHeight + that.setting.retainSize) + 'px');
                		callback();
                	}else{
                		curData.slideObj.animate({ marginTop: (0 - outHeight + that.setting.retainSize) + 'px'}, that.setting.animateMs, that.setting.easing, callback);
                	}
                }
                
            }else {
            	changeState(that);
                hideObjectContainer(that, native);
            }
            
            topic.publish('root/slider/hide', that.slideData.slideObj);
            
        }else{
            hideObjectContainer(that, native);
        }
    };
    
    var hideObjectContainer = function(that, native){
        if(native){
            that.slideData.objContainer.hide();
        }
    };
    
    var isSlideObjVisible = function(that){
    	var curData = that.slideData;
    	
    	if(!curData.objContainer.is(':visible')){
    		return false;
    	}else if(that.setting.direction == 'left'){
    		return curData.objContainer.width() > (curData.slideBtn.outerWidth() + that.setting.retainSize);
        }else if(that.setting.direction == 'right'){
        	return parseInt(curData.slideObj.css("marginLeft"))==0;
        }else if(that.setting.direction == 'up'){
        	return curData.objContainer.height() > (curData.slideBtn.outerHeight() + that.setting.retainSize);
        }else{
        	return parseInt(curData.slideObj.css("marginTop"))==0;
        }
    };

    //私有方法，toggle slide div
    var togglePrivate = function (that) {
        if(isSlideObjVisible(that)){
            hidePrivate(that);
        }else{
            showPrivate(that, true);
        }
    };
    
    var changeState = function(that){
    	var curData = that.slideData;
    	
    	var iObj = curData.slideBtn.find('i');
    	
    	if(that.setting.direction == 'left'){
    		if(parseInt(curData.slideObj.css("marginRight")) == 0){
    			iObj.removeClass('fa-angle-right').addClass('fa-angle-left');
    		}else{
    			iObj.removeClass('fa-angle-left').addClass('fa-angle-right');
    			curData.objContainer.width(curData.slideBtn.outerWidth() + that.setting.retainSize);
    		}
        }else if(that.setting.direction == 'right'){
        	if(parseInt(curData.slideObj.css("marginLeft")) == 0){
    			iObj.removeClass('fa-angle-right').addClass('fa-angle-left');
    		}else{
    			iObj.removeClass('fa-angle-left').addClass('fa-angle-right');
    			curData.objContainer.width(curData.slideBtn.outerWidth() + that.setting.retainSize);
    		}
        }else if(that.setting.direction == 'up'){
        	if(parseInt(curData.slideBtn.css("marginTop")) == 0){
    			iObj.removeClass('fa-angle-up').addClass('fa-angle-down');
    		}else{
    			iObj.removeClass('fa-angle-down').addClass('fa-angle-up');
    			curData.objContainer.height(curData.slideBtn.outerHeight() + that.setting.retainSize);
    			curData.slideBtn.css('margin-top', '0px');
    		}
        }else{
        	if(parseInt(curData.slideObj.css("marginTop")) == 0){
    			iObj.removeClass('fa-angle-down').addClass('fa-angle-up');
    		}else{
    			iObj.removeClass('fa-angle-up').addClass('fa-angle-down');
    			curData.objContainer.height(curData.slideBtn.outerHeight() + that.setting.retainSize);
    		}
        }
    };
    
    var setWidth = function(that, val){
        that.setting.width = val;
        that.slideData.slideObj.width(val);
    };
    
    var setHeight = function(that, val){
        that.setting.height = val;
        that.slideData.slideObj.height(val);
    };
	
	return declare('Slider', null, {
		type:'slider',
		constructor: function(domIdOrObj, options){
			
			this.setting = $.extend({}, opts, options);
			
			setData(domIdOrObj, this);
			
			if(this.setting.showOnInit){
				showPrivate(this, false);
			}
			//支持链式调用
			return this;
		},
		
		show: function(animate){
            if(base.isNull(animate)){
                animate = true;
            }
            showPrivate(this, animate);
			return this;
		},
		
        /*
          native == true means the container need hide
          'animate' will override the setting of animateWhenHide
        */
		hide: function(native, animate){
            hidePrivate(this, animate, native);
			return this;
		},
		
		toggle: function(){
			togglePrivate(this);
			return this;
		},
        
        destroy: function(){
            var orginal = this.slideData.coverReverse.find('.mCSB_container');
            if(!orginal || orginal.length == 0){
                orginal = this.slideData.coverReverse;
            }
            
            orginal = orginal.contents();
            //use detach instead of remove
            orginal.detach();
            
            //remove other children, include custom scroll bar
            this.slideData.slideObj.contents().remove();
            
            //here we need to make slideObj invisible. otherwise the container it append to below may generate scrollbar due to it's huge size(width/height)
            orginal.appendTo(this.slideData.slideObj.hide());
            this.slideData.slideObj.appendTo(this.slideData.objContainer.parent());
            
            this.slideData.objContainer.remove();
        },
        
        width: function(val){
            setWidth(this, val);
            return this;
        },
        
        height: function(val){
            setHeight(this, val);
            return this;
        },
        
        getScroll: function(){
            if(this.setting.customscrollbar && this.slideData.customScrolled){
                return this.slideData.coverReverse;
            }else{
                return null;
            }
        }
	});
});