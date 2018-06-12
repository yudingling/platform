<script>

var dojoConfig = {
    isDebug: true,
    trace: "",
    async: true,
    parseOnLoad: false,  //false. call the parse func manually when dojo is ready. you can neglect this if you never use "data-dojo-type" and that could speed up the loading 
    devMode: true,
    waitSeconds: 100,
    baseUrl: '<%=request.getContextPath()%>/javascript/',
    packages:[{
    		//cause you can not use the baseUrl directly, we need a 'root' path
	        name: "root",
	        location: "<%=request.getContextPath()%>/javascript"
	    },{
            name: "esri",
            location:"3.12compact/esri"
        },{
            name: "dojo",
            location:"3.12compact/dojo"
        },{
            name: "dojox",
            location:"3.12compact/dojox"
        },{
            name: "dijit",
            location:"3.12compact/dijit"
        },{
            name: "static",
            location:"_html/static"
        },{
            name: "main",
            location:"_html/main"
        },{
            name: "component",
            location:"_html/component"
        },{
            name: "common",
            location:"_html/common"
        },{
            name: "tool",
            location:"tool"
        }
    ]
};

var serverName = "<%= request.getContextPath() + "/" %>";

</script>
    