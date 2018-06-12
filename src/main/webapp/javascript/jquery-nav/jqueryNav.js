define(["tool/base",
        "dojo/_base/declare",
        "dojo/_base/lang",
        'tool/css!./jqueryNav.css'],
        function(base, declare, lang){

	return declare('jqueryNav', null, {

        opts: {
            programNoLongerBeingMonitored: !1,
            timeOfFirstCallToShouldStopLoop: 0,
            _loopExits: {},
            _loopTimers: {},
            START_MONITORING_AFTER: 2e3,
            STOP_ALL_MONITORING_TIMEOUT: 5e3,
            MAX_TIME_IN_LOOP_WO_EXIT: 2200,
            onChange: null
        },

        constructor: function(domObj, args){
            declare.safeMixin(this, this.opts);
            declare.safeMixin(this, args);

            this._initDom(domObj);
        },

        destroy: function(){
            this.inherited(arguments);
        },

        _exitedLoop: function(o){
            this._loopExits[o] = !0
        },

        _shouldStopLoop: function(o){
            if(this.programKilledSoStopMonitoring){
                return !0;
            }
            if(this.programNoLongerBeingMonitored){
                return !1;
            }
            if(this._loopExits[o]){
                return !1;
            }
            var t = (new Date()).getTime();
            if (0 == this.timeOfFirstCallToShouldStopLoop){
                this.timeOfFirstCallToShouldStopLoop = t
                return !1;
            }

            var i = t - this.timeOfFirstCallToShouldStopLoop;
            if(i < this.START_MONITORING_AFTER){
                return !1;
            }
            if(i > this.STOP_ALL_MONITORING_TIMEOUT){
                this.programNoLongerBeingMonitored = !0;
                return !1;
            }
            try{
                this._checkOnInfiniteLoop(o, t);
            }catch(e){
                console.log(e.message);

                this.programKilledSoStopMonitoring = !0;
                return !0;
            }

            return !1;
        },

        _initDom: function(domObj){
            domObj.addClass('jqNav');
            domObj.children().addClass('jqNav__section');

            var numOfSections = domObj.children().length;

            var children = domObj.children();
            for(var i=0; i<numOfSections; i++){
                $(children[i]).attr('data-section', i+1).addClass('jqNav__section' + ' jqNav__section-' + (i+1));
                if(i > 0){
                    $(children[i]).addClass('inactive');
                }else{
                    $(children[i]).addClass('active');
                }

                $(children[i]).children('div:first-child').addClass('jqNav__menu-btn');
                $(children[i]).children('h2').addClass('jqNav__section-heading');
            }

            domObj.find('.jqNav__menu-btn').click(lang.hitch(this, function(e){
                domObj.find('.jqNav__section').css('z-index', 'inherit');
                
                domObj.find('.jqNav__section').append($('<div>').addClass('fixed'));
                
            	domObj.addClass('menu-active');
            	e.preventDefault();
            	e.stopPropagation();
            }));
            
            domObj.find('.jqNav__section').click(lang.hitch(this, function(e){
                if(domObj.hasClass('menu-active')){
                    domObj.find('.jqNav__section>div.fixed').remove();
                    
                    var section = $(e.currentTarget);
                    var index = parseInt(section.attr('data-section'));

                    domObj.find('.jqNav__section.active').removeClass('active');
                    domObj.find('.jqNav__section.inactive').removeClass('inactive');

                    section.addClass('active');
                    domObj.removeClass('menu-active');

                    for (var i = index + 1; i <= numOfSections; i++) {
                        if (this._shouldStopLoop(1)) {
                            break;
                        }
                        domObj.find('.jqNav__section[data-section=' + i + ']').addClass('inactive');
                    }
                    this._exitedLoop(1);

                    if(this.onChange){
                        this.onChange(index);
                    }
                    
                    e.preventDefault();
            	    e.stopPropagation();
                }
            })).on('webkitTransitionEnd transitionend', lang.hitch(this, function(){
                if(!domObj.hasClass('menu-active')){
                    this._setInvisible(domObj);
                }
            }));
            
            this._setInvisible(domObj);
        },
        
        _setInvisible: function(domObj){
            domObj.find('.jqNav__section:not(.active)').css('z-index', -1);
            domObj.find('.jqNav__section.active').css('z-index', 'inherit');
        },

        _checkOnInfiniteLoop: function(o, t){
            if(!this._loopTimers[o]){
                this._loopTimers[o] = t;
                return !1;
            }

            var i = t - this._loopTimers[o];
            if(i > this.MAX_TIME_IN_LOOP_WO_EXIT){
                throw "Infinite Loop found on loop: " + o;
            }
        }
    });
});