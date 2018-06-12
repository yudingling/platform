package com.ckxh.cloud.platform.api.own.maintenance;

import java.util.HashMap;
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
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.MaintRecordInfo;

@Scope("singleton")
@Controller
@RequestMapping("/own/maint/normal/maintRecord/detail")
public class MaintRecordDetailController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private UserInfoService userInfoService;
	
	//@AuthPathOnBind is needed, maintenance user also using this api to get the defailt of a maintenance record, not just the 'creator'.
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	@AuthPathOnBind("get:/platformApi/own/myMaint/normal/#")
	public String get(@RequestParam Long maintId, @RequestParam(required = false) Boolean getSelf, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(maintId == null){
				throw new Exception("参数错误");
			}
			
			if(getSelf == null){
				getSelf = true;
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			
			if(getSelf){
				MaintRecordInfo rec = this.maintenanceService.getMaintenanceRecordForDetail(uid, user.getU_ISMAINT() == 1, maintId);
				if(rec != null){
					retMap.put("self", rec);
					this.setRecordDetail(maintId, retMap);
				}
			}else{
				if(this.maintenanceService.isUserAllowToMaintenanceRecordForDetail(uid, user.getU_ISMAINT() == 1, maintId)){
					this.setRecordDetail(maintId, retMap);
				}
			}
			
			if(!retMap.isEmpty()){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			}else{
				throw new Exception("参数错误");
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private void setRecordDetail(Long maintId, Map<String, Object> retMap){
		retMap.put("clients", this.maintenanceService.getMaintenanceClients(maintId));
		retMap.put("dist", this.maintenanceService.getMaintenanceDists(maintId));
		retMap.put("response", this.maintenanceService.getMaintenanceResponses(maintId));
	}
}
