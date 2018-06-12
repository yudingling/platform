/**
 * base widget，all descendant inherit from this
 */
define([
    "tool/base",
    "dojo/_base/declare",
    "dojo/query",
    "dijit/registry",
    "dojo/dom-construct",
    "dijit/_TemplatedMixin",
    "dijit/_WidgetsInTemplateMixin",
    "dojo/_base/lang",
    "dijit/_WidgetBase",
    "dijit/WidgetSet"
], function(
    base,
    declare,
    query,
    registry,
    domConstruct,
    _TemplatedMixin,
    _WidgetsInTemplateMixin,
    lang,
    _Widget,
    WidgetSet) {

    return declare("tool._BaseWidget", [_Widget, _TemplatedMixin], {
    	
    	/**
    	 * selfAuth = true, means the widget will check authorization on creating itself, generally used for "menu component"
    	 */
    	selfAuth: false,
    	
    	/**
    	 * map, assign by descendant. contain the api for bindAuth. 
    	 *   sample: 
    	 *       {'client': '/platformApi/own/client', 'maintaince': '/platformApi/own/mt'}
    	 *   
    	 *   key: alias name of api, use on dom's bindAuth
    	 *   value: api
         *
         * &&&&&&&&&&&&&&&&&&&&&&&&&&&
         *    authApi is a reference type, and we can not set its value an empty object '{}' except null. 
         *    to its descendant, any reference type defined in parent class (like this class) is always an singleton object, and the descendant 
         * could not change its address (cause this is in parent's prototype), and in that case, any change to 'authApi' from one descendant will 
         * affect other instance althought they are not the same type. 
         *    back to the situation, we just set it to null, if a descendant want to use this object, it need to define 'authApi' explicitly and that  
         * works perfectly.
         *
    	 */
    	authApi: null,
    	
        constructor: function(){
            //instanceId can use to differentiate multiInstances of same widget type in a page when a topic message was published 
            this.instanceId = base.uuid();
            
            if(this.selfAuth){
            	$.ajax({
            		type: 'GET',
            		async: false, //set to false
            		url: base.getServerNM() + 'platformApi/own/componentAuth/self',
            		data: {cls: this.declaredClass}
            	}).done(function(ret){
            		ret = base.evalJson(ret);
            		if(ret.success){
            			/**
                         * dojo config got the setting: parseOnLoad = false
                         * to ensure the declaration of data-dojo-type has the expected behavior, here we need to call parse manually。but we recommend to create a widget by 'new' action in code and avoid using 'data-dojo-type' to improve efficiency
                         */
                		dojo.ready(function(){
                            dojo.parser.parse();
                        });
            		}else{
            			throw new Error(ret.message);
            		}
            		
            	}).fail(function(error){
            		throw new Error("Status: " + error.status + "<br/>StatusText: " + error.statusText + "<br/>ResponseText: " + error.responseText);
            	});
            	
            }else{
                dojo.ready(function(){
                    dojo.parser.parse();
                });
            }
        },
        
        startup: function(){
        	this.inherited(arguments);
        	
        	this.bindAuth();
        },
        
        bindAuth: function(){
        	if(this.authApi){
        		base.ajax({
            		type: 'GET',
            		url: base.getServerNM() + 'platformApi/own/componentAuth/bind',
            		data: {authApi: JSON.stringify(this.authApi)}
            	}).success(lang.hitch(this, function(ret){
            		this.setAuthForDom(ret.data);
                    this.bindAuthed();
            	}));
        	}
        },
        
        /**
         * bindAuth finished callback
         */
        bindAuthed: function(){
        },
        
        /**
         * init dom's visiblility with the attribute 'bindAuth'
         * example:  <button bindAuth='{xxxApikeyName1 allowAuthType}&&{xxxApikeyName2 allowAuthType}..'>, allowAuthType could be combination of one or more value shows below: 
         *     post/get/delete/put/all/none
         * if allowAuthType is 'get put', means only the user has the "get" and "put" authorization of the given api that he can see the button, 
         * otherwise the button is invisible. and allowAuthType = 'none' or '', means everyone could see the button. 
         * 
         * support '&&' and '||' operation for multi auth
         *
         * params: authMap
    	 *   key: api key name
    	 *   value: array of the authorization, item value could be: post/get/put/delete
         */
        setAuthForDom: function(authMap){
        	if(!authMap){
        		return;
        	}
        	
        	$(this.domNode).find('[bindAuth]').each(lang.hitch(this, function(index, e){
                var visible = false;
                
                var orList = $(e).attr('bindAuth').trim().split(/\|\|/);
                if(orList.length > 0){
                    for(var i=0; i<orList.length; i++){
                        if(this.doAndAuth(orList[i], authMap)){
                            visible = true;
                            break;
                        }
                    }
                }
                
                //add an additional attribute to the element
                $(e).attr('bindAuthResult', visible);
                
                if(visible){
                    $(e).show();
                }else{
                    $(e).hide();
                }
        		
        	}));
        },
        
        doAndAuth: function(andAuthStr, authMap){
            var andList = andAuthStr.trim().split(/&&/);
            
            if(andList.length > 0){
                for(var i=0; i<andList.length; i++){
                    var bindAuth = andList[i].trim();
                    if(bindAuth.length >= 2 && bindAuth[0] == '{' && bindAuth.endsWith('}')){
                        if(!this.domAuth(bindAuth.substring(1, bindAuth.length - 1), authMap)){
                            return false;
                        }
                    }
                }
            }
            
            return true;
        },
        
        domAuth: function(bindAuth, authMap){
            bindAuth = bindAuth.trim();
            if(bindAuth.length == 0)
                return;
            
            bindAuth = bindAuth.split(' ');
            if(bindAuth.length == 0)
                return;
            
            var apiKey = bindAuth[0];

            var needAuth = {};

            if(bindAuth.length > 1){
                for(var i=1; i<bindAuth.length; i++){
                    var temp = bindAuth[i].trim();
                    if(temp.length > 0){

                        if(temp == 'all'){
                            needAuth["put"] = '';
                            needAuth["get"] = '';
                            needAuth["delete"] = '';
                            needAuth["post"] = '';
                        }else if(temp == 'none'){
                            needAuth = {};
                        }else{
                            needAuth[temp] = ''; 
                        }
                    }
                }
            }

            var visible = false;

            var dbAuth = authMap[apiKey];
            if(dbAuth){
                visible = true;
                for(var auth in needAuth){
                    if(dbAuth.indexOf(auth) < 0){
                        return false;
                    }
                }
            }
            
            return true;
        }
        
        
        
//        //stop using this, in that case：  new -》 destroy -》 new ，css will load for multi times
//        setCss: function(css, media) {
//            if (registry.byClass(this.declaredClass).length > 0) {
//                //widget is already loaded so css node has already been added to page
//                return;
//            }
//            var css = css || '',
//                tag = 'style',
//                attributes = {
//                    media: media || 'all'
//                },
//                refNode = query('head script')[0],
//                position = 'before';
//
//            if (this.cssNode) {
//                domConstruct.destroy(this.cssNode);
//            }
//
//            // place it before the first <script>
//            this.cssNode = domConstruct.create(tag, attributes, refNode, position);
//
//            if (this.cssNode.styleSheet) {
//                this.cssNode.styleSheet.cssText = css; // IE
//            } else {
//                this.cssNode.innerHTML = css; // the others
//            }
//        }
    });
});
