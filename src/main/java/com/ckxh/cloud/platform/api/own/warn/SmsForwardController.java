package com.ckxh.cloud.platform.api.own.warn;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.model.Critical_Level;
import com.ckxh.cloud.base.model.PushStatus;
import com.ckxh.cloud.base.model.mqMsg.ClientWarnMsg3rd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_WARN_MSG;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MSG;
import com.ckxh.cloud.persistence.model.WarnInfo;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("/own/warn/forward/sms")
public class SmsForwardController {
	@Autowired
	private WarnInfoService warnInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam Long wrnId, @RequestParam String receivers, @RequestParam String content, HttpServletRequest request, HttpServletResponse response){
		try{
			if(wrnId == null || receivers == null || receivers.length() == 0 || content == null || content.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			WarnInfo warnInfo = this.warnInfoService.getWarn(uid, wrnId);
			if(warnInfo == null || !this.clientInfoService.clientAuthority(warnInfo.getC_ID(), uid, false) || warnInfo.getWRN_CLOSE() != 0){
				throw new Exception("参数错误");
			}
			
			Map<String, String> smsMap = MsgPackUtil.deserialize(receivers, new TypeReference<Map<String, String>>(){});
			
			List<MAIN_3RDPUSH_MSG> msg3rdList = new ArrayList<MAIN_3RDPUSH_MSG>();
			List<IOT_WARN_MSG> msgWarnList = new ArrayList<IOT_WARN_MSG>();
			Timestamp ts = DateUtil.getCurrentTS();
			
			if(!smsMap.isEmpty()){
				List<Long> uuids = SysTool.longUuid(smsMap.size() * 2);
				int uuidIndex = 0;
				
				for(String phone : smsMap.keySet()){
					if(Validator.isMobile(phone)){
						MAIN_3RDPUSH_MSG msg3rd = new MAIN_3RDPUSH_MSG(uuids.get(uuidIndex++), phone, PushStatus.sending.getValue(), content, 0, uid, ts, ts);
						
						IOT_WARN_MSG msgIot = new IOT_WARN_MSG(uuids.get(uuidIndex++), wrnId, msg3rd.getMSG_ID(), smsMap.get(phone), phone, ts, ts);
						
						msg3rdList.add(msg3rd);
						msgWarnList.add(msgIot);
					}
				}
				
				//save db first and then push to thirdParty send queue
				this.warnInfoService.saveWarnPushInfo(msg3rdList, null, msgWarnList, null);
				
				if(!msg3rdList.isEmpty()){
					WarnInfo warn = this.warnInfoService.getWarn(uid, wrnId);
					
					for(MAIN_3RDPUSH_MSG item: msg3rdList){
						this.acMq.sendQueue(
								new ClientWarnMsg3rd(uid, item.getMSG_ID(), item.getMSG_PHONE(), warn.getC_NM(), item.getMSG_DESC(), Critical_Level.valueOf(warn.getWRN_LEVEL())),
								ConstString.AcQueue_msg3rdPush);
					}
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, "发送成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
