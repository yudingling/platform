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
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.UserEffectiveTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/open/signup")
public class SignupController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private UserEffectiveTool userEffectiveTool;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String email, @RequestParam String name, @RequestParam String pwd, @RequestParam String phone, @RequestParam String verifyCode,
			HttpServletRequest request, HttpServletResponse response){
		
		try{
			if(email != null && email.length() > 0 && name != null && name.length() > 0 && pwd != null && pwd.length() > 0 
					&& phone != null && phone.length() > 0 && verifyCode != null && verifyCode.length() > 0){
				if(!Validator.isEmail(email)){
					throw new Exception("email地址不符合规范");
				}
				
				if(this.userInfoService.emailExists(email)){
					throw new Exception("email已经被使用");
				}
				
				if(this.userInfoService.msgVerify(phone, verifyCode)){
					MAIN_USER user = this.userInfoService.createUser(email, name, Encrypt.SHA1(pwd), phone);
					if(user != null){
						this.userEffectiveTool.afterCreate(user);
						
						AuthUtil.setIdToSession(request, response, user.getU_ID(), false);
						
						return JsonUtil.createSuccessJson(true, null, "用户创建成功", null);
					}
				}
				
				throw new Exception("用户创建失败");
				
			}else
				throw new Exception("参数错误");
			
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
