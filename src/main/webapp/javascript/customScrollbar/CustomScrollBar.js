/**
 * mCustomScrollbar
 */
define(['tool/base',
        'root/jquery-mousewheel/jquery.mousewheel-3.0.6.min',
        './jquery.mCustomScrollbar',
        'tool/css!./jquery.mCustomScrollbar.css'], 
        function(base, jqMouseWheel, mCustomScrollbar){
	
	return {
		init: function(classNMOrObj, axis, moreDataCallBack, mouseWheel){
            if(Object.prototype.toString.call(classNMOrObj) == "[object String]"){
                classNMOrObj = $('.'+classNMOrObj);
            }
            if(classNMOrObj && classNMOrObj.length>0){
                if(!axis){
                    axis = 'y';
                }
                axis = axis.toLowerCase();
                
                //use the local scrollbar to improve performance on mobile
                if(base.isMobileDevice()){
                    if(axis == 'xy' || axis == 'yx'){
                        classNMOrObj.css('overflow', 'auto');
                    }else{
                        classNMOrObj.css('overflow-' + axis, 'auto');
                    }
                    
                    classNMOrObj.data('mobileScroll', true);
                    
                    if(moreDataCallBack){
                        var hei = classNMOrObj.height();
                        var _callMoreDataMobile = function(){
                            var scrollTop = classNMOrObj.scrollTop();
                            var scrollHeight = classNMOrObj[0].scrollHeight;
                            if(scrollTop == 0 || scrollTop + hei >= scrollHeight){
                                try{
                                    moreDataCallBack();
                                }catch(e){
                                }
                            }
                        };

                        classNMOrObj.on('touchstart', function(event){
                            if(event.changedTouches && event.changedTouches.length > 0){
                                classNMOrObj.data('t_start', {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY});
                            }
                        });

                        classNMOrObj.on('touchend', function(event){
                            if(event.changedTouches && event.changedTouches.length > 0){
                                var endPoint = {x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY};

                                var startPoint = classNMOrObj.data('t_start');
                                if(startPoint){
                                    if(axis == 'y'){
                                        if(startPoint.y - endPoint.y >= 70){
                                            _callMoreDataMobile();
                                        }

                                    }else if(axis == 'x'){
                                        if(startPoint.x - endPoint.x >= 70){
                                            _callMoreDataMobile();
                                        }
                                    }
                                }
                            }
                        });
                    }
                    
                    return;
                }
                
                classNMOrObj.mCustomScrollbar({
                    theme: "dark",
                    scrollInertia: 400,
                    axis: axis,
                    mouseWheel: {enable: (base.isNull(mouseWheel)? true : false)},
                    callbacks: {
                        onOverflowY: function(){
                            classNMOrObj.data('flowed', true);
                        },
                        onOverflowYNone: function(){
                            classNMOrObj.data('flowed', false);
                        },
                        onOverflowX: function(){
                            classNMOrObj.data('flowed', true);
                        },
                        onOverflowXNone: function(){
                            classNMOrObj.data('flowed', false);
                        },
                        onTotalScroll: function(){
                            classNMOrObj.data('ended', true);
                        },
                        onScrollStart: function(){
                            classNMOrObj.data('ended', false);
                        }
                    }
                });
                
                if(moreDataCallBack){
                    var timeOut = null;
                    var _getDeltaCount = function(){
                        var count = classNMOrObj.data('deltaCount');
                        if(base.isNull(count)){
                            count = 0;
                        }
                        return count;
                    };
                    
                    //mouse wheel only fired on 'scrollbar was not added' or 'event onTotalScroll/onTotalScrollBack fired'
                    classNMOrObj.mousewheel(function(event, delta, deltaX, deltaY) {
                        if(moreDataCallBack && delta < 0){
                            classNMOrObj.data('deltaCount', _getDeltaCount() + 1);

                            if(!timeOut){
                                timeOut = setTimeout(function(){
                                    //cause we got nowhere to clear the timeout, so we need to catch the implementation to avoid error throw out that happen in callback
                                    try{
                                        var count =  _getDeltaCount();
                                        if(count >= 5){
                                            moreDataCallBack();
                                        }

                                        classNMOrObj.data('deltaCount', 0);
                                        timeOut = null;
                                    }catch(e){
                                        timeOut = null;
                                    }

                                }, 1000);
                            }
                        }
                    });
                }
            }
		},
        
        /*positionOrVal  
           "string"
                e.g. element selector: "#element-id"
                e.g. special pre-defined position: "bottom"
                e.g. number of pixels less/more: "-=100"/"+=100"
            integer
                e.g. number of pixels: 100
            [array]
                e.g. different y/x position: [100,50]
            object/function
                e.g. jQuery object: $("#element-id")
                e.g. js object: document.getelementbyid("element-id")
                e.g. function: function(){ return 100; }
            
            Pre-defined position strings:
                "bottom" – scroll to bottom
                "top" – scroll to top
                "right" – scroll to right
                "left" – scroll to left
                "first" – scroll to the position of the first element within content
                "last" – scroll to the position of the last element within content
        */
        scrollTo: function(classNMOrObj, positionOrVal){
            if(Object.prototype.toString.call(classNMOrObj) == "[object String]"){
                classNMOrObj = $('.'+classNMOrObj);
            }
            if(classNMOrObj && classNMOrObj.length>0){
                if(classNMOrObj.data('mobileScroll')){
                    return;
                }
                
                classNMOrObj.mCustomScrollbar("scrollTo", positionOrVal, {scrollEasing:"easeOut"});
            }
        },
        
        disable: function(classNMOrObj){
            if(Object.prototype.toString.call(classNMOrObj) == "[object String]"){
                classNMOrObj = $('.'+classNMOrObj);
            }
            if(classNMOrObj && classNMOrObj.length>0){
                if(classNMOrObj.data('mobileScroll')){
                    return;
                }
                
                classNMOrObj.mCustomScrollbar("disable");
            }
        },
        
        update: function(classNMOrObj, axis){
            if(Object.prototype.toString.call(classNMOrObj) == "[object String]"){
                classNMOrObj = $('.'+classNMOrObj);
            }
            if(classNMOrObj && classNMOrObj.length>0){
                if(classNMOrObj.data('mobileScroll')){
                    return;
                }
                
                if(axis){
                    axis = axis.toLowerCase();
                    //important, in some case, this will make calculation more precision
                    var container = classNMOrObj.children('.mCustomScrollBox').children('.mCSB_container');
                    if(axis == 'x'){
                        container.css('width', '100%');
                    }else if(axis == 'y'){
                        container.css('height', '100%');
                    }else{
                        container.css('width', '100%').css('height', '100%');
                    }
                }
                
                classNMOrObj.mCustomScrollbar('update');
            }
        }
	};
});