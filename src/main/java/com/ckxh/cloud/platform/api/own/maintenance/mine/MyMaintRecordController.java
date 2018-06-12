package com.ckxh.cloud.platform.api.own.maintenance.mine;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_MAINTENANCE;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.MaintRecordInfo;
import com.ckxh.cloud.persistence.model.MaintRecordInfo_Topic;
import com.ckxh.cloud.persistence.model.MaintRecordStatus;
import com.ckxh.cloud.platform.api.websocket.TopicWebSocketHandler;
import com.fasterxml.jackson.core.JsonProcessingException;

@Scope("singleton")
@Controller
@RequestMapping("/own/myMaint/normal/maintRecord")
@AuthPathOnBind("get:/platformApi/own/myMaint/normal/#")
public class MyMaintRecordController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER_MAINTENANCE self = this.maintenanceService.getMaintenanceUser(uid);
			List<MaintRecordInfo_Topic> list = this.maintenanceService.getMaintenanceRecordsForTopic(uid);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("self", self);
			retMap.put("list", list);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam Long maintId, HttpServletRequest request, HttpServletResponse response){
		try{
			if(maintId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.maintenanceService.isUserAuthForActMaintRecord(uid, maintId)){
				//here we return 'true' instead of 'false' to avoid from showing the failure of Acting as a common logical error.
				return JsonUtil.createSuccessJson(true, null, "接收工单失败", null);
			}
			
			if(this.maintenanceService.updateMaintenanceRecordOnAct(uid, maintId)){
				MaintRecordInfo_Topic info = this.maintenanceService.getMaintenanceRecordForTopic(uid, maintId);
				if(info != null){
					Set<Long> destMaIds = this.maintenanceService.getMaintTopicAreas(info);
					if(destMaIds != null && !destMaIds.isEmpty()){
						MAIN_USER_MAINTENANCE maintUser = this.maintenanceService.getMaintenanceUser(uid);
						
						this.sendMaintTopic(maintUser.getOWNER_UID(), maintId, destMaIds, info);
					}
					
					MAIN_USER user = this.userInfoService.getUserInfo(uid);
					MAIN_USER userCrt = this.userInfoService.getUserInfo(info.getMAINT_CRT_UID());
					
					//return a MaintRecordInfo that contains the info of actUser and crtUser
					MaintRecordInfo retInfo = new MaintRecordInfo(maintId, null, null, MaintRecordStatus.executing.getValue(), 
							uid, userCrt.getU_ID(), null, DateUtil.getCurrentTS(), null,  null, null, user.getU_NM(), userCrt.getU_NM(), null);
					
					return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retInfo), "接收工单成功", null);
					
				}else{
					return JsonUtil.createSuccessJson(true, null, "接收工单失败", null);
				}
				
			}else{
				return JsonUtil.createSuccessJson(true, null, "接收工单失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam Long maintId, HttpServletRequest request, HttpServletResponse response){
		try{
			if(maintId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(this.maintenanceService.updateMaintenanceRecordOnClose(uid, maintId)){
				MAIN_USER user = this.userInfoService.getUserInfo(uid);
				
				//return a MaintRecordInfo that contains the endUser's info
				MaintRecordInfo retInfo = new MaintRecordInfo(maintId, null, null, MaintRecordStatus.closed.getValue(), 
						null, null, uid, null, DateUtil.getCurrentTS(), null, null, null, null, user.getU_NM());
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retInfo), "关闭工单成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "关闭工单失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private void sendMaintTopic(String ownerUid, Long maintId, Set<Long> destMaIds, MaintRecordInfo_Topic info){
		try {
			String msg = MsgPackUtil.serialize2Str(info);
			
			if(destMaIds.contains(MaintenanceService.defaultMAID)){
				//send to default area (topic value is equals to uid)
				TopicWebSocketHandler.sendMessageToUser(ownerUid, msg);
			}
			
			destMaIds.remove(MaintenanceService.defaultMAID);
			if(!destMaIds.isEmpty()){
				for(Long maId : destMaIds){
					//send to area
					TopicWebSocketHandler.sendMessageToUser(maId + "", msg);
				}
			}
			
		} catch (JsonProcessingException e) {
			e.printStackTrace();
		}
	}
}
