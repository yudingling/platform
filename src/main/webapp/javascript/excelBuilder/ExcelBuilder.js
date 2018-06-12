
/**
 * excel builder
 */
define(["tool/base", "./simple-excel"], function (base) {
    	
	return {
		/**
		 * obj: json object array.
		 * columns: map of columns, key is the attribute of json object, value is the column name.
		 * fileNm: name of the exported excel file.
		 * columnsOrderdKey: the orderd key of columns.
		 */
		exportData: function(obj, columns, fileNM, columnsOrderdKey){
			var xlsxWriter = new SimpleExcel.Writer.CSV();
            var xlsxSheet = new SimpleExcel.Sheet();
            var Cell = SimpleExcel.Cell;
            
            var rows = [];
            var head = [];
            
            var columnKeys = columnsOrderdKey? columnsOrderdKey : Object.keys(columns);
            for(var i=0;i<columnKeys.length; i++){
            	head.push(new Cell(columns[columnKeys[i]], 'TEXT'));
            }
            
            rows.push(head);
            
            if(obj && obj.length>0){
                
                for(var i=0;i<obj.length; i++){
                    var oneRow = [];
                    
                    for(var j=0;j<columnKeys.length;j++){
                        var tmpVal = (obj[i])[columnKeys[j]];
                        
						var isnull = base.isNull(tmpVal);
                        //判断是否时间
                        if(!isnull && tmpVal.time){
                            tmpVal = (new Date(tmpVal.time)).format('yyyy-MM-dd HH:mm:ss.fff');
                        }
                        
                        oneRow.push(new Cell(isnull? "" : tmpVal, 'TEXT'));
                    }
                    
                    rows.push(oneRow);
                }
            }
            
            xlsxSheet.setRecords(rows);
            xlsxWriter.insertSheet(xlsxSheet);
            
            xlsxWriter.saveFile(fileNM);
		}
	};
	
});