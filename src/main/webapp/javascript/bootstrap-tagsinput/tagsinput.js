define(['./bootstrap-tagsinput.min',
        'tool/css!./bootstrap-tagsinput.css'], function(){
    
    var addInner = function(node, data){
        if(data){
            for(var i=0; i<data.length; i++){
                node.tagsinput('add', data[i]);
            }
        }
    };
    
    var removeInner = function(node, data){
        if(data){
            for(var i=0; i<data.length; i++){
                node.tagsinput('remove', data[i]);
            }
        }
    };
	
    return {
        /*
          args: {
            domNode: xxxx,
            valueField: 'value',
            textField: 'text',
            width: '100%',
            minHeight: '100%',
            focusWidth: '10px',
            keyCodes: [13, 9, 32],
            data: [{text: xxx, value: xxx, otherAttr: xxx}, {text: xxx, value: xxx, otherAttr: xxx}]
            createItem: function(text){},   //create a customized item object on tag creating. return null can stop adding
            removed: function(item){}
          }
        */
        init: function(args){
            args.domNode.tagsinput({
                itemValue: args.valueField,
                itemText: args.textField
            });
            
            if(args.removed){
                args.domNode.data('removed', args.removed).on('itemRemoved', function(event){
                    args.removed(event.item);
                });
            }
            
            var keyCodes = args.keyCodes;
            if(!keyCodes){
                keyCodes = [13, 9, 32];
            }
            
            var tagsDiv = args.domNode.parent().find('.bootstrap-tagsinput');
            //after initialization, 'args.domNode' was hidden and a new input tag was append which use to receive user's input
            var newInput = tagsDiv.find('input');
            if(args.createItem){
                newInput.keydown(function(event){
                    if(keyCodes.indexOf(event.keyCode) >= 0){
                        var tmpNode = args.createItem(newInput.val());
                        if(tmpNode){
                            args.domNode.tagsinput('add', tmpNode);
                            newInput.val(null);
                            if(args.focusWidth){
                                newInput.css('width', args.focusWidth);
                            }
                        }
                        
                        return false;
                    }else{
                        if(args.focusWidth){
                            if(newInput.css('width') != 'auto'){
                                newInput.css('width', 'auto');
                            }
                        }
                    }
                }).focus(function(){
                    if(newInput.val().length > 0){
                        newInput.css('width', 'auto');
                    }
                }).blur(function(){
                    if(args.focusWidth && newInput.val().length == 0){
                        newInput.css('width', args.focusWidth);
                    }
                });
            }
            
            
            
            if(args.width){
                tagsDiv.css('width', args.width);
            }
            if(args.minHeight){
                tagsDiv.css('min-height', args.minHeight);
            }
            
            if(args.focusWidth){
                newInput.css('width', args.focusWidth);
            }
            
            addInner(args.domNode, args.data);
        },
        
        /*
          args: {
            domNode: xxxx,
            data: [{text: xxx, value: xxx, otherAttr: xxx}, {text: xxx, value: xxx, otherAttr: xxx}]
          }
        */
        add: function(args){
            addInner(args.domNode, args.data);
        },
        
        /*
          args: {
            domNode: xxxx,
            data: [{text: xxx, value: xxx, otherAttr: xxx}, {text: xxx, value: xxx, otherAttr: xxx}]
          }
        */
        remove: function(args, silent){
            var removed;
            if(silent){
                args.domNode.off('itemRemoved');
                removed = args.domNode.data('removed');
            }
            
            removeInner(args.domNode, args.data);
            
            if(silent && removed){
                args.domNode.on('itemRemoved', function(event){
                    removed(event.item);
                });
            }
        },
        
        /*
          args: {
            domNode: xxxx
          }
        */
        clear: function(args){
            args.domNode.tagsinput('removeAll');
        },
        
        /*
          args: {
            domNode: xxxx
          }
        */
        items: function(args){
            return args.domNode.tagsinput('items');
        }
    };
});