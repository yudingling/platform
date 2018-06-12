package com.ckxh.cloud.platform.api.own.sysCheck;

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
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.SysManualCheckResult;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysCheck/thirdparty/serviceStatusAuth")
public class Service3rdStatusAuthController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody 
	@RequestMapping(method = RequestMethod.PUT)    
	public String update(@RequestParam Long tps_id, @RequestParam String tps_reliable, @RequestParam(required = false) String rl_info, @RequestParam int rl_result, HttpServletRequest request, HttpServletResponse response) {
		try {	
			if (tps_id == null || tps_reliable == null || tps_reliable.isEmpty()) {
				throw new Exception("参数错误");
			}
			
			SysManualCheckResult status = SysManualCheckResult.valueOf(rl_result);
		
			String rl_uid = AuthUtil.getIdFromSession(request.getSession());
		
			boolean updated = this.thirdPartyService.updateServiceAuthInfo(tps_id, status, rl_info, rl_uid, tps_reliable);
			 
			return JsonUtil.createSuccessJson(updated, null, updated ? "更新成功" : "更新失败", null);
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
