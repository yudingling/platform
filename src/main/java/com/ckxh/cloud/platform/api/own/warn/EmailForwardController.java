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
import com.ckxh.cloud.base.model.mqMsg.ClientWarnMail3rd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.QuickAccessUrlCreator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_WARN_MAIL;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MAIL;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.QaString;
import com.ckxh.cloud.persistence.model.WarnInfo;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("/own/warn/forward/email")
public class EmailForwardController {
	@Autowired
	private WarnInfoService warnInfoService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	@Autowired
	private QuickAccessUrlCreator quickAccessUrlCreator;
	
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
			
			Map<String, String> addrMap = MsgPackUtil.deserialize(receivers, new TypeReference<Map<String, String>>(){});
			
			List<MAIN_3RDPUSH_MAIL> mail3rdList = new ArrayList<MAIN_3RDPUSH_MAIL>();
			List<IOT_WARN_MAIL> mailWarnList = new ArrayList<IOT_WARN_MAIL>();
			Timestamp ts = DateUtil.getCurrentTS();
			
			if(!addrMap.isEmpty()){
				List<Long> uuids = SysTool.longUuid(addrMap.size() * 2);
				int uuidIndex = 0;
				
				for(String addr : addrMap.keySet()){
					if(Validator.isEmail(addr)){
						MAIN_3RDPUSH_MAIL pushMail = new MAIN_3RDPUSH_MAIL(uuids.get(uuidIndex++), addr, PushStatus.sending.getValue(), content, uid, ts, ts);
						
						IOT_WARN_MAIL iotMail = new IOT_WARN_MAIL(uuids.get(uuidIndex++), wrnId, pushMail.getMAIL_ID(), addrMap.get(addr), addr, ts, ts);
						
						mail3rdList.add(pushMail);
						mailWarnList.add(iotMail);
					}
				}
				
				//save db first and then push to thirdParty send queue
				this.warnInfoService.saveWarnPushInfo(null, mail3rdList, null, mailWarnList);
				
				if(!mail3rdList.isEmpty()){
					MAIN_USER user = this.userInfoService.getUserInfo(uid);
					WarnInfo warn = this.warnInfoService.getWarn(uid, wrnId);
					
					for(MAIN_3RDPUSH_MAIL item: mail3rdList){
						QaString qa = this.quickAccessUrlCreator.warnInfo(uid);
						this.acMq.sendQueue(
								new ClientWarnMail3rd(uid, item.getMAIL_ID(), item.getMAIL_ADDR(), qa.getUrl(), qa.getExpireString(),
										user.getU_NM(), warn.getC_NM(), Critical_Level.valueOf(warn.getWRN_LEVEL()), item.getMAIL_DESC()),
								ConstString.AcQueue_mail3rdPush);
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
