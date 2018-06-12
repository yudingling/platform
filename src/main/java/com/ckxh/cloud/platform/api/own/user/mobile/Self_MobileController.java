package com.ckxh.cloud.platform.api.own.user.mobile;

import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.ResourceStatusGetter;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.RechargeType;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/mobile/self")
public class Self_MobileController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ResourceStatusGetter resourceStatusGetter;
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			//1. user info
			//get it from db instead of redis cache(value of profit field in redis is not the real-time value)
			MAIN_USER user = this.userInfoService.getUserInfo_fromDB(uid);
			
			String parentUnm = user.getU_PID() != null && user.getU_PID().length() > 0 ? this.userInfoService.getUserInfo(user.getU_PID()).getU_NM() : null;
			
			//clear the password
			user.setU_PWD(null);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("parentUnm", parentUnm);
			retMap.put("self", user);
			
			//2.resource status
			//image statistic
			retMap.put(RechargeType.image.toString(), this.resourceStatusGetter.getStatus(RechargeType.image, uid));
			
			//video statistic
			retMap.put(RechargeType.video.toString(), this.resourceStatusGetter.getStatus(RechargeType.video, uid));
			
			//sms statistic
			retMap.put(RechargeType.sms.toString(), this.resourceStatusGetter.getStatus(RechargeType.sms, uid));
			
			//3.clients count
			retMap.put("clientsCount", this.clientInfoService.getMyClientsCount(uid, false));
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
