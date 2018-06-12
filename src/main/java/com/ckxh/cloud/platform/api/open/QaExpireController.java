package com.ckxh.cloud.platform.api.open;

import java.util.List;

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
import com.ckxh.cloud.persistence.db.model.MAIN_USER_MAINTENANCE;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.ClientTreeNode;

@Scope("singleton")
@Controller
@RequestMapping("/open/qaExpire")
public class QaExpireController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private MaintenanceService maintenanceService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String qa, @RequestParam(required = false) String params, 
			HttpServletRequest request, HttpServletResponse response) {
		try {
			if(qa == null || qa.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = this.userInfoService.getQuickAccess(qa, false);
			
			Object ret = uid != null ? this.handleParams(uid, params) : null;
			
			return JsonUtil.createSuccessJson(uid != null, MsgPackUtil.serialize2Str(ret), null, null);
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	private Object handleParams(String uid, String params){
		if(params != null){
			if(params.equals("maintUserVerify")){
				//return the area id and maintenance area list
				MAIN_USER_MAINTENANCE maintUser = this.maintenanceService.getMaintenanceUser(uid);
				
				List<ClientTreeNode> areas = this.maintenanceService.getAreaTree(maintUser.getOWNER_UID(), null, false, false);
				
				return new Object[]{maintUser.getMA_ID(), areas};
			}
		}
		
		return null;
	}
}
