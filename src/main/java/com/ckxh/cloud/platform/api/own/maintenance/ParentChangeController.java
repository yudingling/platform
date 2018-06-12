package com.ckxh.cloud.platform.api.own.maintenance;

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
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.sys.service.DataGroupService;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/maint/normal/parentChange")
@AuthPathOnBind("get:/platformApi/own/maint/normal/#")
public class ParentChangeController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private DataGroupService dataGroupService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam(required = false) String areas, @RequestParam(required = false) String users, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(areas != null && areas.length() > 0){
				Map<String, String> gpMap =  MsgPackUtil.deserialize(areas, new TypeReference<Map<String, String>>(){});
				if(!gpMap.isEmpty()){
					this.dataGroupService.updateParentGroup(gpMap, uid);
				}
			}
			
			if(users != null && users.length() > 0){
				Map<String, Long> userMap =  MsgPackUtil.deserialize(users, new TypeReference<Map<String, Long>>(){});
				if(!userMap.isEmpty()){
					this.maintenanceService.updateMaintUserAreaGroup(userMap, uid);
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, "更新成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
