
define(['./xlsx'], function(){
	
	var to_json = function(workbook) {
		var result = {};
		workbook.SheetNames.forEach(function(sheetName) {
			var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
			if(roa.length > 0){
				result[sheetName] = roa;
			}
		});
		return result;
	};
	
	return {
		parse: function(file){
			var def = $.Deferred();
			
			var reader = new FileReader();
			reader.onload = function(e) {
				try{
					var wb = XLSX.read(e.target.result, {type: 'binary'});
					def.resolve(to_json(wb));
					
				}catch (e){
	            	def.reject("parse xlsx error: " + e.message);
	            }
			};
			
			reader.readAsBinaryString(file);
			
			return {
				success: function(callBack){
					def.promise().done(callBack);
					return this;
				},
				fail: function(callBack){
					def.promise().fail(callBack);
					return this;
				}
			};
		}
	}
});