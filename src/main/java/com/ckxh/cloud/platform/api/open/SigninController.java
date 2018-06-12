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

import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/open/signin")
public class SigninController {
	
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String uid, @RequestParam String pwd, @RequestParam(required = false) Boolean keep, 
			HttpServletRequest request, HttpServletResponse response){
		
		try{
			if(uid != null && uid.length() > 0 && pwd != null && pwd.length() > 0){
				MAIN_USER user = this.userInfoService.getUserInfo(uid);
				if(user != null && Encrypt.SHA1(pwd).equals(user.getU_PWD())){
					if(user.getU_DISABLED() == 0 && user.getU_ACTIVE() == 1){
						AuthUtil.setIdToSession(request, response, uid, keep == null ? false : keep.booleanValue());
						
						return JsonUtil.createSuccessJson(true, null, null, null);
					}
					else
						return JsonUtil.createSuccessJson(false, null, "用户被禁用或未激活!", null);
				}else
					return JsonUtil.createSuccessJson(false, null, "登陆失败!", null);
			}else
				return JsonUtil.createSuccessJson(false, null, "用户名、密码不能为空!", null);
			
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
