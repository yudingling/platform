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

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.model.MaintRecordStatus;

@Scope("singleton")
@Controller
@RequestMapping("/own/maint/normal/maintRecord")
public class MaintRecordController {
	@Autowired
	private MaintenanceService maintenanceService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam(required = false) String clientIds, 
			@RequestParam(required = false) String stm, @RequestParam(required = false) String etm,
			@RequestParam(required = false) Integer status, @RequestParam(required = false) String from,
			@RequestParam int start, @RequestParam int length, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(start < 0 || length <= 0){
				throw new Exception("参数错误");
			}
			
			String[] cidList = null;
			if(clientIds != null && clientIds.length() > 0){
				cidList = clientIds.split(",");
			}
			
			//parameter check
			int statusVal = -1;
			if(status != null){
				statusVal = MaintRecordStatus.valueOf(status.intValue()).getValue();
			}
			
			if(from != null){
				if(!from.equals("manual") && !from.equals("client")){
					throw new Exception("参数错误");
				}
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] records = this.maintenanceService.getMaintenanceRecords(uid, search, cidList, stm, etm, statusVal, from, start, length);
			Object[] statistic = this.maintenanceService.getMaintenaceStatistic(uid);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("records", records);
			retMap.put("statistic", statistic);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
