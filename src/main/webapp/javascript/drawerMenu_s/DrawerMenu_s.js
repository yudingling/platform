/*
 drawer menu for 'position: {right: 0px, top: 0px, direction: down}'
*/
define(['./prefixfree.min', 
        'tool/css!./DrawerMenu_s.css'], 
       function(){

    return {
        init: function(domObj, spanColor){
            domObj.addClass('drawer_s');
            
            domObj.find('li>ul>li').click(function(){
            	domObj.addClass('clicked');
            });
            
            domObj.find('li>a').hover(function(){
            	domObj.removeClass('clicked');
            });
            
            if(spanColor){
                domObj.find('li ul li span').css('color', spanColor);
            }
        }
    };
});