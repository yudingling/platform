package com.ckxh.cloud.platform.api.own.user;

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
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.persistence.model.ResourceStatus;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/resourceStatus")
public class ResourceStatusController {
	@Autowired
	private ResourceStatusGetter resourceStatusGetter;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Map<String, ResourceStatus> status = new HashMap<String, ResourceStatus>();
			
			//image statistic
			status.put(RechargeType.image.toString(), this.resourceStatusGetter.getStatus(RechargeType.image, uid));
			
			//video statistic
			status.put(RechargeType.video.toString(), this.resourceStatusGetter.getStatus(RechargeType.video, uid));
			
			//sms statistic
			status.put(RechargeType.sms.toString(), this.resourceStatusGetter.getStatus(RechargeType.sms, uid));
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(status), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
