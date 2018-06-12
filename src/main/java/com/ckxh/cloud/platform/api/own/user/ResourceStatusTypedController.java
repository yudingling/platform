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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.ResourceStatusGetter;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.persistence.model.ResourceStatus;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/resourceStatus/typed")
public class ResourceStatusTypedController {
	@Autowired
	private ResourceStatusGetter resourceStatusGetter;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String resourceTp, HttpServletRequest request, HttpServletResponse response){
		try{
			if(resourceTp == null || resourceTp.length() == 0){
				throw new Exception("参数错误");
			}
			
			RechargeType resTP = RechargeType.valueOf(resourceTp);
			if(resTP == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			ResourceStatus status = this.resourceStatusGetter.getStatus(resTP, uid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(status), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
