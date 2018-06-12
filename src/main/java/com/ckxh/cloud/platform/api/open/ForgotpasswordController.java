package com.ckxh.cloud.platform.api.open;

import java.sql.Timestamp;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.model.PushStatus;
import com.ckxh.cloud.base.model.mqMsg.ForgotPwdMail3rd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.QuickAccessUrlCreator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MAIL;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyPushService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.QaString;

@Scope("singleton")
@Controller
@RequestMapping("/open/forgotpassword")
public class ForgotpasswordController {
	
	@Autowired
	private AcMq acMq;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ThirdPartyPushService thirdPartyPushService;
	@Autowired
	private QuickAccessUrlCreator quickAccessUrlCreator;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String done(@RequestParam String uid, HttpServletRequest request, HttpServletResponse response){
		if(uid != null && uid.length() > 0){
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			if(user != null){
				if(user.getU_ACTIVE() == 0){
					return JsonUtil.createSuccessJson(false, null, "用户未激活!", null);
				}
				if(user.getU_DISABLED() == 1){
					return JsonUtil.createSuccessJson(false, null, "用户被禁用!", null);
				}
				
				//send email
				Timestamp ts = DateUtil.getCurrentTS();
				MAIN_3RDPUSH_MAIL mail = new MAIN_3RDPUSH_MAIL(SysTool.longUuid(), user.getU_EMAIL(), PushStatus.sending.getValue(), "密码重置", uid, ts, ts);
				this.thirdPartyPushService.saveMAIN_3RDPUSH_MAIL(mail);
				
				//get the quick access url
				QaString qa = this.quickAccessUrlCreator.forgotPassword(uid);
				this.acMq.sendQueue(new ForgotPwdMail3rd(uid, mail.getMAIL_ID(), user.getU_EMAIL(), qa.getUrl(), qa.getExpireString(), user.getU_NM()), ConstString.AcQueue_mail3rdPush);
				
				return JsonUtil.createSuccessJson(true, null, "已发送重置密码的邮件", null);
				
			}else{
				return JsonUtil.createSuccessJson(false, null, "输入的用户不存在!", null);
			}
		}
		
		return JsonUtil.createSuccessJson(false, null, "输入错误!", null);
	}
}
