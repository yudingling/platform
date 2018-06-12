
define(['tool/base',
        'dojo/_base/lang',
        "dojo/_base/declare",
        './flatpickr.min', 
        'tool/css!./flatpickr.min.css',
        'tool/css!./DateTimePicker.css'], 
       function(base, lang, declare){

    return declare('DateTimePicker', null, {
        constructor: function(domObjOrId, format, defaultDate){
            
            require(['root/dateTimePicker/l10n/zh'], lang.hitch(this, function(){
               this._createInner(domObjOrId, format, defaultDate); 
            }));
        },
        
        destroy: function(){
            if(this.dp.length){
                for(var i=0; i<this.dp.length; i++){
                    this.dp[i].destroy();
                }
            }else{
                this.dp.destroy();
            }
        },
        
        setDate: function(date){
            if(this.dp.length){
                for(var i=0; i<this.dp.length; i++){
                    this.dp[i].setDate(date, true);
                }
            }else{
                this.dp.setDate(date, true);
            }
        },
        
        _createInner: function(domObjOrId, format, defaultDate){
            if(Object.prototype.toString.call(domObjOrId) == "[object String]"){
                domObjOrId = $('#' + domObjOrId);
            }
            
            format = format? format:'Y-m-d H:i:S';
            
            var enableTime = format.match(/h|i|s/i)? true: false;
            var enableSeconds = format.match(/s/i)? true: false;
            var noCalendar = format.match(/y|m|d/i)? false: true;
            
            this.dp = domObjOrId.flatpickr({
            	dateFormat: format,
            	enableTime: enableTime,
            	enableSeconds: enableSeconds,
            	noCalendar: noCalendar,
                defaultDate: defaultDate,
            	time_24hr: true,
                locale: "zh",
                onChange: function(dateObj, dateStr, instance){
                    //trigger change，propertyChange，input event of domObjOrId
                    domObjOrId.trigger('change');
                    domObjOrId.trigger('propertychange');
                    domObjOrId.trigger('input');
                }
            });
            
            if(!format.match(/s/i)){
                this._disabledInit('.flatpickr-second');
            }
            if(!format.match(/i/i)){
                this._disabledInit('.flatpickr-minute');
            }
            if(!format.match(/h/i)){
                this._disabledInit('.flatpickr-hour');
            }
        },
        
        _disabledInit: function(selector){
            if(this.dp.length){
                for(var i=0; i<this.dp.length; i++){
                    $(this.dp[i].calendarContainer).find(selector).prop('disabled', true);
                }
            }else{
                $(this.dp.calendarContainer).find(selector).prop('disabled', true);
            }
        }
    });
});