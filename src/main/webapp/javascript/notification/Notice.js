define(['./notification',
        'tool/css!./notification.css'], function(){
    
    var position = 2;
    var effect = 'fadeInDown';
    
    return {
        error: function(title, content){
            Notification.create(
                title,
                content,
                'fa fa-exclamation-triangle fa-lg',
                'fail',
                effect,
                position,
                4
            );
        },
        
        ok: function(title, content){
            Notification.create(
                title,
                content,
                'fa fa-check fa-lg',
                'success',
                effect,
                position,
                2
            );
        },

        info: function(title, content){
            Notification.create(
                title,
                content,
                'fa fa-info-circle fa-lg',
                'info',
                effect,
                position,
                2
            );
        },
        
    };
    
});