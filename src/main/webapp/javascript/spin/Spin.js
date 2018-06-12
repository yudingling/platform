/**
 * 自定义等待遮罩
 */

define(['dojo/_base/declare',
        'dojo/_base/lang',
        'tool/css!./Spin.css'], function(declare, lang){
	
//	var opts = {            
//            lines: 13, // 花瓣数目
//            length: 5, // 花瓣长度
//            width: 5, // 花瓣宽度
//            radius: 10, // 花瓣距中心半径
//            corners: 1, // 花瓣圆滑度 (0-1)
//            rotate: 0, // 花瓣旋转角度
//            direction: 1, // 花瓣旋转方向 1: 顺时针, -1: 逆时针
//            color: '#000', // 花瓣颜色
//            speed: 1, // 花瓣旋转速度
//            trail: 60, // 花瓣旋转时的拖影(百分比)
//            shadow: false, // 花瓣是否显示阴影
//            hwaccel: false, //spinner 是否启用硬件加速及高速旋转            
//            className: 'spinner', // spinner css 样式名称
//            zIndex: 2e9, // spinner的z轴 (默认是2000000000)
//            top: '50%', // spinner 相对父容器Top定位 单位 px
//            left: '50%'// spinner 相对父容器Left定位 单位 px
//        };
	
//	var spinner = new Spinner(opts);
    
    return declare('Spin', null, {
        constructor: function(domIdOrObj, color, hint){
            if(Object.prototype.toString.call(domIdOrObj) == "[object String]")
                domIdOrObj = $('#'+domIdOrObj);
            
            this.wrapObj = $('<div class="spinnerWrapper"><div><i class="fa fa-spinner fa-spin fa-3x"></i></div><span></span></div>');
            
			domIdOrObj.append(this.wrapObj);

			if(color){
				this.wrapObj.css('color', color);
            }else{
                this.wrapObj.css('color', '#999');
            };
            
            if(hint){
            	this.wrapObj.find('span').text(hint);
            }
        },
        
        destroy: function(){
            this.wrapObj.remove();
        }
        
    });
});