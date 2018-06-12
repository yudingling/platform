package com.ckxh.cloud.platform.api.open;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/open/emailverify")
public class EmailVerifyController {
	
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String get(@RequestParam String email, HttpServletRequest request, HttpServletResponse response){
		if(email != null && email.length() > 0){
			if(this.userInfoService.emailExists(email)){
				return JsonUtil.createSuccessJson(false, null, "该邮箱已经被注册", null);
			}else{
				return JsonUtil.createSuccessJson(true, null, null, null);
			}
		}else{
			return JsonUtil.createSuccessJson(false, null, "参数错误", null);
		}
	}
}
