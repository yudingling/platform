package com.ckxh.cloud.platform.api.own.user;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/changePassword")
public class ChangePasswordController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam String oldPwd, @RequestParam String newPwd1, @RequestParam String newPwd2,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(oldPwd == null || oldPwd.length() == 0 || newPwd1 == null || newPwd1.length() == 0 || newPwd2 == null || newPwd2.length() == 0 
					|| !newPwd1.equals(newPwd2)){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			if(Encrypt.SHA1(oldPwd).equals(user.getU_PWD())){
				this.userInfoService.updateUserBaseInfo(uid, new String[]{"U_PWD"}, new Object[]{Encrypt.SHA1(newPwd1)});
				
				return JsonUtil.createSuccessJson(true, null, "更改密码成功", null);
			}else{
				throw new Exception("旧密码错误");
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
