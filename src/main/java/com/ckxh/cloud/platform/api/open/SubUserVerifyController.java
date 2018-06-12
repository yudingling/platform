package com.ckxh.cloud.platform.api.open;

import java.io.IOException;

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
import com.ckxh.cloud.persistence.common.UserEffectiveTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/open/subUser/verify")
public class SubUserVerifyController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private UserEffectiveTool userEffectiveTool;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String post(@RequestParam String qa, @RequestParam String pwd, @RequestParam String phone, @RequestParam String verifyCode, 
			HttpServletRequest request, HttpServletResponse response) throws IOException{
		try{
			if(qa == null || qa.length() == 0 || pwd == null || pwd.length() == 0 || phone == null || phone.length() == 0 
					|| verifyCode == null || verifyCode.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = this.userInfoService.getQuickAccess(qa, false);
			if(uid == null || uid.length() == 0){
				throw new Exception("验证码超时, 请联系父级用户重新发送验证邮件");
			}
			
			if(this.userInfoService.msgVerify(phone, verifyCode)){
				MAIN_USER user = this.userInfoService.getUserInfo(uid);
				if(user != null && user.getU_ACTIVE() == 0 && user.getU_DISABLED() == 0 
						&& this.userInfoService.updateUserBaseInfo(uid, new String[]{"U_PHONE", "U_PWD", "U_ACTIVE"}, new Object[]{phone, Encrypt.SHA1(pwd), 1})){
					
					this.userEffectiveTool.afterSubUserVerify(user);
					
					this.userInfoService.deleteQuickAccess(qa);
					
					AuthUtil.setIdToSession(request, response, uid, false);
					
					return JsonUtil.createSuccessJson(true, null, "验证成功", null);
				}
			}
			
			return JsonUtil.createSuccessJson(false, null, "验证失败", null);
			
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
