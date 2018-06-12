package com.ckxh.cloud.platform.api.open;

import java.sql.Timestamp;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.model.PushStatus;
import com.ckxh.cloud.base.model.mqMsg.VerificationMsg3rd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.redis.JedisHelper;
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MSG;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyPushService;

@Scope("singleton")
@Controller
@RequestMapping("/open/msgverify")
public class MsgVerifyController {
	
	@Autowired
	private AcMq acMq;
	@Autowired
	private ThirdPartyPushService thirdPartyPushService;
	
	//1 minute
	private static final int msgPeriodSeconds = 60;
	
	@ResponseBody
	@RequestMapping(path="/{mobile}", method=RequestMethod.POST)
	public String get(@PathVariable String mobile, HttpServletRequest request, HttpServletResponse response){
		
		if(mobile != null && mobile.length() > 0 && Validator.isMobile(mobile)){
			//ensure each number send once in one minute
			if(JedisHelper.get(ConstString.RedisPrefix_verifyMsg + mobile) == null){
				//malicious attacks check
				if(!this.maliceCheck(request)){
					this.sendVerify(mobile);
					return JsonUtil.createSuccessJson(true, null, "已发送验证码", null);
				}else{
					return JsonUtil.createSuccessJson(false, null, "监测到异常, 严禁该操作", null);
				}
				
			}else{
				return JsonUtil.createSuccessJson(false, null, "距离上次发送间隔小于1分钟", null);
			}
			
		}else{
			return JsonUtil.createSuccessJson(false, null, "手机号错误", null);
		}
	}
	
	/**
	 * multiple user may have a same ip address (same lan network), we limit one user up to 10 sms to send in one minute
	 */
	private boolean maliceCheck(HttpServletRequest request){
		//todo. need more testing, like network mapping, nginx reverse proxy
		String ip = Common.getRealIpAddress(request);
		
		if(ip == null || ip.length() == 0){
			return false;
		}
		
		String tmpStr = JedisHelper.get(ConstString.RedisPrefix_verifyMsg_malice + ip);
		if(tmpStr == null){
			JedisHelper.setNX(ConstString.RedisPrefix_verifyMsg_malice + ip, "1", msgPeriodSeconds);
			return false;
		}else{
			int count = Integer.parseInt(tmpStr);
			if(count > 10){
				return true; 
			}else{
				JedisHelper.setXX(ConstString.RedisPrefix_verifyMsg_malice + ip, (count+1) + "", msgPeriodSeconds);
				return false;
			}
		}
	}
	
	private void sendVerify(String mobile){
		Timestamp ts = DateUtil.getCurrentTS();
		
		String code = (int)(Math.random()*9000+1000) + "";
		
		MAIN_3RDPUSH_MSG msg3rd = new MAIN_3RDPUSH_MSG(
				SysTool.longUuid(), 
				mobile, 
				PushStatus.sending.getValue(), 
				code,
				0, 
				ConstString.Sys_3rdPush, 
				ts, ts);
		
		if(this.thirdPartyPushService.saveMAIN_3RDPUSH_MSG(msg3rd)){
			this.acMq.sendQueue(new VerificationMsg3rd(ConstString.Sys_3rdPush, msg3rd.getMSG_ID(), mobile, code), ConstString.AcQueue_msg3rdPush);
			
			//cache for check next
			JedisHelper.setNX(ConstString.RedisPrefix_verifyMsg + mobile, code, msgPeriodSeconds);
		}
	}
}
