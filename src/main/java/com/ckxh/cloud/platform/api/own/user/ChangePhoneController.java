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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/changePhone")
public class ChangePhoneController {
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/user/normal/#")
	public String update(@RequestParam String newPhone, @RequestParam String verifyCode, HttpServletRequest request, HttpServletResponse response){
		try{
			if(newPhone == null || newPhone.length() == 0 || verifyCode == null || verifyCode.length() == 0){
				throw new Exception("参数错误");
			}
			
			if(this.userInfoService.msgVerify(newPhone, verifyCode)){
				String uid = AuthUtil.getIdFromSession(request.getSession());
				
				if(this.userInfoService.updateUserBaseInfo(uid, new String[]{"U_PHONE"}, new Object[]{newPhone})){
					return JsonUtil.createSuccessJson(true, null, "更改手机号成功", null);
				}
			}
			
			return JsonUtil.createSuccessJson(false, null, "更改手机号失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
