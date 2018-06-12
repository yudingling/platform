<%@ page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8" %>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <title>辰坤云-验证</title>
    
    <jsp:include page="cfg.jsp"/>
    
    <link rel="stylesheet" type="text/css" href="<%=request.getContextPath()%>/javascript/bootstrap-3.3.7/css/bootstrap.min.css" />
    <link rel="stylesheet" type="text/css" href="<%=request.getContextPath()%>/javascript/jquery-ui-1.12.0/jquery-ui.min.css" />
    <link rel="stylesheet" type="text/css" href="<%=request.getContextPath()%>/javascript/font-awesome-4.5.0/css/font-awesome.min.css" />
    <link rel="stylesheet" type="text/css" href="<%=request.getContextPath()%>/javascript/_html/common/linkcss/base.css" />
    <link rel="stylesheet" type="text/css" href="<%=request.getContextPath()%>/javascript/_html/common/linkcss/animate.css" />
    <link rel="stylesheet" type="text/css" href="<%=request.getContextPath()%>/javascript/_html/common/linkcss/hover-min.css" />
    
    <script type="text/javascript" src="<%=request.getContextPath()%>/javascript/tool/jquery-3.1.0.min.js"></script>
    <script type="text/javascript" src="<%=request.getContextPath()%>/javascript/jquery-ui-1.12.0/jquery-ui.min.js"></script>
    <script type="text/javascript" src="<%=request.getContextPath()%>/javascript/bootstrap-3.3.7/js/bootstrap.min.js"></script> 
    <script type="text/javascript" src="<%=request.getContextPath()%>/javascript/3.12compact/dojo/dojo.js"></script>
    
    <script>
    
    	require(['static/subUserVerify/subUserVerify'], function(Cls){
    		var obj = new Cls();
	        $('body').append($(obj.domNode));
            obj.startup();
	    });
	    
    </script>
</head>
<body class="gray-bg">
</body>
</html>