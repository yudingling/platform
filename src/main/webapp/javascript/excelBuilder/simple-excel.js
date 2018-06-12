// SimpleExcel.js v0.1.3
// Client-side script to easily parse / convert / write any Microsoft Excel XLSX / XML / CSV / TSV / HTML / JSON / etc formats
// https://github.com/faisalman/simple-excel-js
// 
// Copyright © 2013-2014 Faisal Salman <fyzlman@gmail.com>
// Dual licensed under GPLv2 & MIT

(function (window, undefined) {

    'use strict';

    ///////////////////////
    // Constants & Helpers
    ///////////////////////

    var Char = {
        COMMA           : ',',
        RETURN          : '\r',
        NEWLINE         : '\n',
        SEMICOLON       : ';',
        TAB             : '\t'
    };
    
    var DataType = {
        CURRENCY    : 'CURRENCY',
        DATETIME    : 'DATETIME',
        FORMULA     : 'FORMULA',
        LOGICAL     : 'LOGICAL',
        NUMBER      : 'NUMBER',
        TEXT        : 'TEXT'
    };

    var Exception = {    
        CELL_NOT_FOUND              : 'CELL_NOT_FOUND',
        COLUMN_NOT_FOUND            : 'COLUMN_NOT_FOUND',
        ROW_NOT_FOUND               : 'ROW_NOT_FOUND',
        ERROR_READING_FILE          : 'ERROR_READING_FILE',
        ERROR_WRITING_FILE          : 'ERROR_WRITING_FILE',
        FILE_NOT_FOUND              : 'FILE_NOT_FOUND',
        //FILE_EXTENSION_MISMATCH     : 'FILE_EXTENSION_MISMATCH',
        FILETYPE_NOT_SUPPORTED      : 'FILETYPE_NOT_SUPPORTED',
        INVALID_DOCUMENT_FORMAT     : 'INVALID_DOCUMENT_FORMAT',
        INVALID_DOCUMENT_NAMESPACE  : 'INVALID_DOCUMENT_NAMESPACE',
        MALFORMED_JSON              : 'MALFORMED_JSON',
        UNIMPLEMENTED_METHOD        : 'UNIMPLEMENTED_METHOD',
        UNKNOWN_ERROR               : 'UNKNOWN_ERROR',
        UNSUPPORTED_BROWSER         : 'UNSUPPORTED_BROWSER'
    };

    var Format = {        
        CSV     : 'csv',
        HTML    : 'html',
        JSON    : 'json',
        TSV     : 'tsv',
        XLS     : 'xls',
        XLSX    : 'xlsx',
        XML     : 'xml'
    };

    var MIMEType = {
        CSV     : 'text/csv',
        HTML    : 'text/html',
        JSON    : 'application/json',
        TSV     : 'text/tab-separated-values',
        XLS     : 'application/vnd.ms-excel',
        XLSX    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        XML     : 'text/xml',
        XML2003 : 'application/xml'
    };

    var Regex = {
        FILENAME    : /.*\./g,
        LINEBREAK   : /\r\n?|\n/g,
        COMMA       : /(,)(?=(?:[^"]|"[^"]*")*$)/g,
        QUOTATION   : /(^")(.*)("$)/g,
        TWO_QUOTES  : /""/g
    };

    var Utils = {
        getFiletype : function (filename) {
            return filename.replace(Regex.FILENAME, '');
        },
        isEqual     : function (str1, str2, ignoreCase) {
            return ignoreCase ? str1.toLowerCase() == str2.toLowerCase() : str1 == str2;
        },
        isSupportedBrowser: function() {
            return !![].forEach && !!window.FileReader;
        },
        overrideProperties : function (old, fresh) {
            for (var i in old) {
                if (old.hasOwnProperty(i)) {
                    old[i] = fresh.hasOwnProperty(i) ? fresh[i] : old[i];
                }
            }
            return old;
        }
    };
    
    /////////////////////////////
    // Spreadsheet Constructors
    ////////////////////////////

    var Cell = function (value, dataType) {
        var defaults = {
            value    : value || '',
            dataType : dataType || DataType.TEXT
        };
        if (typeof value == typeof {}) {
            defaults = Utils.overrideProperties(defaults, value);
        }
        this.value = defaults.value;
        this.dataType = defaults.dataType;
        this.toString = function () {
            return value.toString();
        };
    };
        
    var Records = function() {};
    Records.prototype = [];
    Records.prototype.getCell = function(colNum, rowNum) {
        return this[rowNum - 1][colNum - 1];
    };
    Records.prototype.getColumn = function (colNum) {        
        var col = [];
        this.forEach(function (el, i) {
            col.push(el[colNum - 1]);
        });
        return col;
    };
    Records.prototype.getRow = function (rowNum) {
        return this[rowNum - 1];
    };
    
    var Sheet = function () {
        this.records = new Records();
    };
    Sheet.prototype.getCell = function (colNum, rowNum) {
        return this.records.getCell(colNum, rowNum);
    };
    Sheet.prototype.getColumn = function (colNum) {
        return this.records.getColumn(colNum);
    };
    Sheet.prototype.getRow = function (rowNum) {
        return this.records.getRow(rowNum);
    };
    Sheet.prototype.insertRecord = function (array) {
        this.records.push(array);
        return this;
    };
    Sheet.prototype.removeRecord = function (index) {
        this.records.splice(index - 1, 1);
        return this;
    };
    Sheet.prototype.setRecords = function (records) {
        this.records = records;
        return this;
    };
    
    /////////////
    // Parsers
    ////////////

    // Base Class
    var BaseParser = function () {};
    BaseParser.prototype = {
        _filetype   : '',
        _sheet      : [],
        getSheet    : function(number) {
            number = number || 1;
            return this._sheet[number - 1].records;
        },
        loadFile    : function (file, callback) {
            var self = this;
            //var filetype = Utils.getFiletype(file.name);
            //if (Utils.isEqual(filetype, self._filetype, true)) {
                var reader = new FileReader();
                reader.onload = function () {
                    self.loadString(this.result, 0);
                    callback.apply(self);
                };
                reader.readAsText(file);
            //} else {
                //throw Exception.FILE_EXTENSION_MISMATCH;
            //}
            return self;
        },
        loadString  : function (string, sheetnum) {
            throw Exception.UNIMPLEMENTED_METHOD;
        }
    };

    // CSV
    var CSVParser = function () {};
    CSVParser.prototype = new BaseParser();
    CSVParser.prototype._delimiter = Char.COMMA;
    CSVParser.prototype._filetype = Format.CSV;
    CSVParser.prototype.loadString = function (str, sheetnum) {
        // TODO: implement real CSV parser
        var self = this;
        sheetnum = sheetnum || 0;
        self._sheet[sheetnum] = new Sheet();       
        
        str.replace(Regex.LINEBREAK, Char.NEWLINE)
           .split(Char.NEWLINE)
           .forEach(function(el, i)
        {
            var sp = el.split(Regex.COMMA);
            var row = [];
            sp.forEach(function(cellText) {
                if (cellText !== self._delimiter) {
                    cellText = cellText.replace(Regex.QUOTATION, "$2");
                    cellText = cellText.replace(Regex.TWO_QUOTES, "\"");
                    row.push(new Cell(cellText));
                }
            });
            self._sheet[sheetnum].insertRecord(row);
        });
        return self;
    };
    CSVParser.prototype.setDelimiter = function (separator) {
        this._delimiter = separator;
        return this;
    };
    
    // HTML
    var HTMLParser = function () {};
    HTMLParser.prototype = new BaseParser();
    HTMLParser.prototype._filetype = Format.HTML;
    HTMLParser.prototype.loadString = function(str, sheetnum) {
        var self = this;
        var domParser = new DOMParser();
        var domTree = domParser.parseFromString(str, MIMEType.HTML);
        var sheets = domTree.getElementsByTagName('table');
        sheetnum = sheetnum || 0;
        [].forEach.call(sheets, function(el, i) {
            self._sheet[sheetnum] = new Sheet();
            var rows = el.getElementsByTagName('tr');
            [].forEach.call(rows, function (el, i) {
                var cells = el.getElementsByTagName('td');
                var row = [];
                [].forEach.call(cells, function (el, i) {
                    row.push(new Cell(el.innerHTML));
                });
                self._sheet[sheetnum].insertRecord(row);
            });
            sheetnum++;
        });
        return self;
    };

    // TSV
    var TSVParser = function () {};
    TSVParser.prototype = new CSVParser();
    TSVParser.prototype._delimiter = Char.TAB;
    TSVParser.prototype._filetype = Format.TSV;

    // XML
    var XMLParser = function () {};
    XMLParser.prototype = new BaseParser();
    XMLParser.prototype._filetype = Format.XML;
    XMLParser.prototype.loadString = function(str, sheetnum) {
        var self = this;
        var domParser = new DOMParser();
        var domTree = domParser.parseFromString(str, MIMEType.XML);
        var sheets = domTree.getElementsByTagName('Worksheet');
        sheetnum = sheetnum || 0;
        [].forEach.call(sheets, function(el, i) {
            self._sheet[sheetnum] = new Sheet();
            var rows = el.getElementsByTagName('Row');
            [].forEach.call(rows, function (el, i) {
                var cells = el.getElementsByTagName('Data');
                var row = [];
                [].forEach.call(cells, function (el, i) {
                    row.push(new Cell(el.innerHTML));
                });
                self._sheet[sheetnum].insertRecord(row);
            });
            sheetnum++;
        }); 
        return self;
    };

    // Export var
    var Parser = {
        CSV : CSVParser,
        HTML: HTMLParser,
        TSV : TSVParser,
        XML : XMLParser
    };

    /////////////
    // Writers
    ////////////

    // Base Class
    var BaseWriter = function () {};
    BaseWriter.prototype = {
        _filetype   : '',
        _mimetype   : '',
        _sheet      : [],
        getSheet    : function(number) {
            number = number || 1;
            return this._sheet[number - 1].records;
        },
        getString   : function () {
            throw Exception.UNIMPLEMENTED_METHOD;
        },
        insertSheet : function (data) {
            if (!!data.records) {
                this._sheet.push(data);
            } else {
                var sheet = new Sheet();
                sheet.setRecords(data);
                this._sheet.push(sheet);
            }
            return this;
        },
        removeSheet : function (index) {
            this._sheet.splice(index - 1, 1);
            return this;
        },
        saveFile: function (filename) {
            var text = this.getString();
            
            var hasie = this._has('ie');
            if (hasie && hasie < 10) {
              // has module unable identify ie11 and Edge
              var oWin = window.top.open("about:blank", "_blank");
              oWin.document.write('sep=,\r\n' + text);
              oWin.document.close();
              oWin.document.execCommand('SaveAs', true, filename);
              oWin.close();
            }else if (hasie >=10) {
              var BOM = "\uFEFF";
              var csvData = new Blob([BOM + text], { type: 'text/csv' });
              navigator.msSaveBlob(csvData, filename);
            } else {
                
                var link = $('<a target="_blank" style="display:none"></a>').attr('href', this._getDownloadUrl(text)).attr('download', filename);
                if (this._has('safari') || this._has('ff')) {
                    // # First create an event
                    var click_ev = document.createEvent("MouseEvents");
                    // # initialize the event
                    click_ev.initEvent("click", true , true );
                    // # trigger the evevnt/
                    link[0].dispatchEvent(click_ev);
                } else {
                    //jquery 的click 方法并不跳转 url， 如果非要采用这种方法，则需要往 a 标签中增加内容，比如一个 span，然后再点击该 span 以实现 href 的跳转，因为 href 的跳转并不是捕捉的 a 标签本身，而是其中的内容
                    //link.click();
                    link[0].click();
                }
                
                link.remove();
            }
            
            return this;
        },

        _has: function(typeStr){
            var agent = navigator.userAgent.toLowerCase() ;
            
            var regStr_ff = /firefox\/[\d.]+/gi
            var regStr_chrome = /chrome\/[\d.]+/gi ;
            var regStr_saf = /safari\/[\d.]+/gi ;
            //IE
            if(typeStr == 'ie'){
                var temp = this._isEdge();
                if(temp)
                    return temp;
                
                temp = this._isIE0_11();
                if(temp)
                    return temp;
            }

            //firefox
            if(typeStr == 'ff' && agent.indexOf("firefox") > 0){
                return (agent.match(regStr_ff) + "").replace(/[^0-9.]/ig, "") ;
            }

            //Chrome
            if(typeStr == 'chrome' && agent.indexOf("chrome") > 0){
                return (agent.match(regStr_chrome) + "").replace(/[^0-9.]/ig, "") ;
            }

            //Safari
            if(typeStr == 'safari' && agent.indexOf("safari") > 0 && agent.indexOf("chrome") < 0){
                return (agent.match(regStr_saf) + "").replace(/[^0-9.]/ig, "");
            }
            
            return false;
        },
        
        _isIE0_11: function() {
            var iev = 0;
            var ieold = (/MSIE (\d+\.\d+);/.test(navigator.userAgent));
            var trident = !!navigator.userAgent.match(/Trident\/7.0/);
            var rv = navigator.userAgent.indexOf("rv:11.0");

            if (ieold) {
              iev = Number(RegExp.$1);
            }
            if (navigator.appVersion.indexOf("MSIE 10") !== -1) {
              iev = 10;
            }
            if (trident && rv !== -1) {
              iev = 11;
            }

            return iev;
        },

        _isEdge: function() {
            return /Edge\/12/.test(navigator.userAgent);
        },

        _getDownloadUrl: function(text) {
            var BOM = "\uFEFF";
            // Add BOM to text for open in excel correctly,  如果少了这个 bom 头，带有中文的话将是乱码
            if (window.Blob && window.URL && window.URL.createObjectURL) {
              var csvData = new Blob([BOM + text], { type: 'text/csv' });
              return URL.createObjectURL(csvData);
            } else {
              return 'data:attachment/csv;charset=utf-8,' + BOM + encodeURIComponent(text);
            }
        }
    };

    // CSV
    var CSVWriter = function () {
        //edit by zd. 
        //  to descendent class, reference type in parent always has the some address(point to the same object), so we need to
        //  init its value on construction
        this._sheet =[];
    };
    CSVWriter.prototype = new BaseWriter();
    CSVWriter.prototype._delimiter = Char.COMMA;
    CSVWriter.prototype._filetype = Format.CSV;
    CSVWriter.prototype._mimetype = MIMEType.CSV;
    CSVWriter.prototype.getString = function () {
        // TODO: implement real CSV writer
        var self = this;
        var string = '';
        this.getSheet(1).forEach(function (el, i) {
            el.forEach(function (el) {
                string += el + self._delimiter;
            });
            string += '\r\n';
        });
        return string;
    };
    CSVWriter.prototype.setDelimiter = function (separator) {
        this._delimiter = separator;
        return this;
    };

    // TSV
    var TSVWriter = function () {
        this._sheet =[];
    };
    TSVWriter.prototype = new CSVWriter();
    TSVWriter.prototype._delimiter = Char.TAB;
    TSVWriter.prototype._filetype = Format.TSV;
    TSVWriter.prototype._mimetype = MIMEType.TSV;
    
    // Export var
    var Writer = {
        CSV : CSVWriter,
        TSV : TSVWriter
    };

    /////////////
    // Exports
    ////////////

    var SimpleExcel = {
        Cell                : Cell,
        DataType            : DataType,
        Exception           : Exception,
        isSupportedBrowser  : Utils.isSupportedBrowser(),
        Parser              : Parser,
        Sheet               : Sheet,
        Writer              : Writer
    };

    window.SimpleExcel = SimpleExcel;

})(this);
