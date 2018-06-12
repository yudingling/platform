package com.ckxh.cloud.platform.api.own.sys;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;

@Scope("singleton")
@Controller
@RequestMapping("/own/sys/normal/signout")
public class SignoutController {
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String post(HttpServletRequest request, HttpServletResponse response){
		try{
			AuthUtil.removeIdFromSession(request, response);
			
			return JsonUtil.createSuccessJson(true, null, null, null);
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
