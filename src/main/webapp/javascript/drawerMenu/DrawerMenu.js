/*
 drawer menu for 'position: {right: 0px, top: 0px, direction: left}'
*/
define(['./prefixfree.min', 
        'tool/css!./DrawerMenu.css'], 
       function(){

    return {
        init: function(domObj){
            domObj.addClass('drawer');
            
            domObj.find('li>ul>li').click(function(){
            	domObj.addClass('clicked');
            });
            
            domObj.find('li>a').hover(function(){
            	domObj.removeClass('clicked');
            });
        }
    };
});