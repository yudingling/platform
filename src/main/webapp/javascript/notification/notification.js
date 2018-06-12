/**
 * Created by Let Aurn IV on 22/09/2015.
 */

/*global  $*/

Notification = window.Notification || {};

Notification = function () {

    'use strict';

    var number = [];
    var incPosition = 0;

    var template = function (title, text, iconClass, typeClass, position) {
        
        var curNum = 0;
        var preNum = 0;
        if(number.length == 0){
            curNum = 1;
        }else{
            preNum = number[number.length-1];
            curNum = preNum + 1;
        }
        
        number.push(curNum);
        
        var preObj = $(document).find('.notification-' + preNum);
        if(preObj.length>0){
            incPosition = preObj.position().top + preObj.outerHeight() + 7;
        }else
            incPosition = 7;
        
        var textHtml = '<div class="text"></div>';
        var titleHtml = (!title ? '' : '<div class="title"></div>');
        var iconHtml = '<div class="illustration"><i class="'+ iconClass +'" /></div>';
        var style;
        switch (parseInt(position, 10)) {
            case 1:
                style = "top:" + incPosition + "px; left:20px;";
                break;
            case 2:
                style = "top:" + incPosition + "px; right:20px;";
                break;
            case 3:
                style = "bottom:" + incPosition + "px; right:20px;";
                break;
            case 4:
                style = "bottom:" + incPosition + "px; left:20px;";
                break;
            default:
                ;
        }
        return {
            id: curNum,
            content: '<div class="notification '+ typeClass +' notification-' + curNum + ' " style="' + style + '">' +
                '<div class="dismiss">&#10006;</div>' +
                iconHtml +
                '<div class="text">' + titleHtml + textHtml + '</div>' +
                '</div>',
            timeout: null
        };
    };

    var hide = function (id) {
        var obj = $(document).find('.notification-' + id);
		if(obj){
            obj.addClass('fadeOut').one('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend', function(){
                obj.off('webkitAnimationEnd mozAnimationEnd MSAnimationEnd oanimationend animationend');
                obj.remove();
                number.remove(id);
            });
		}
    };

    var create = function (title, text, iconClass, typeClass, animation, position, delay) {
        var notification = template(title, text, iconClass, typeClass, position);
        
        var obj = $(notification.content);
        
        obj.find('.text>.text').text(text);
        obj.find('.text>.title').text(title);
        
        obj.addClass('animated ' + animation).appendTo('body').find('.dismiss').click(function(){
            if(notification.timeout){
                clearTimeout(notification.timeout);
            }
            hide(notification.id);
        });
        
        if (!delay && delay != 0) {
            delay = 2;
        }
        if(delay > 0){
            notification.timeout = setTimeout(function () {
                hide(notification.id);
            }, 1000 * delay);
        }
    };

    return {
        create: create
    };

}();
