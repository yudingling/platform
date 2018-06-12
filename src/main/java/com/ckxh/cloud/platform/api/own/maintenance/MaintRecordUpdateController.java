package com.ckxh.cloud.platform.api.own.maintenance;

import java.util.HashSet;
import java.util.List;
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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.MaintRecordInfo;
import com.ckxh.cloud.persistence.model.MaintRecordInfo_Topic;
import com.ckxh.cloud.persistence.model.MaintRecordStatus;
import com.ckxh.cloud.persistence.model.WarnInfo;
import com.ckxh.cloud.platform.api.websocket.TopicWebSocketHandler;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("/own/maint/maintRecord/update")
public class MaintRecordUpdateController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private WarnInfoService warnInfoService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String clientIds, @RequestParam(required = false) Long wrnId , 
			@RequestParam String content, @RequestParam(required = false) String distAreaIds, @RequestParam(required = false) String distUIds,
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(clientIds == null || clientIds.length() <= 0 || content == null || content.length() <= 0){
				throw new Exception("参数错误");
			}
			
			if((distAreaIds == null || distAreaIds.length() <= 0) && (distUIds == null || distUIds.length() <= 0)){
				throw new Exception("参数错误");
			}
			
			List<String> clientIdList = MsgPackUtil.deserialize(clientIds, new TypeReference<List<String>>(){});
			if(clientIdList.isEmpty()){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(wrnId != null){
				WarnInfo wrn = this.warnInfoService.getWarn(uid, wrnId);
				if(wrn == null){
					throw new Exception("参数错误");
				}
				
			}else{
				wrnId = null;
			}
			
			Set<Long> maIdList = null;
			Set<String> uIdList = null;
			//distribute to a maintenance user get an higher priority than area
			if(distUIds != null && distUIds.length() > 0){
				uIdList = MsgPackUtil.deserialize(distUIds, new TypeReference<Set<String>>(){});
				if(uIdList.isEmpty()){
					throw new Exception("参数错误");
				}
				
				if(!this.maintenanceService.isMaintUserBelongToUser(uid, uIdList)){
					throw new Exception("参数错误");
				}
				
			}else if(distAreaIds != null && distAreaIds.length() > 0){
				maIdList = MsgPackUtil.deserialize(distAreaIds, new TypeReference<Set<Long>>(){});
				if(maIdList.isEmpty()){
					throw new Exception("参数错误");
				}
				
				Set<Long> maIdCheckList = null;
				if(maIdList.contains(MaintenanceService.defaultMAID)){
					maIdCheckList = new HashSet<Long>(maIdList);
					maIdCheckList.remove(MaintenanceService.defaultMAID);
				}else{
					maIdCheckList = maIdList;
				}
				
				if(!maIdCheckList.isEmpty() && !this.maintenanceService.isMaintAreasBelongToUser(uid, maIdCheckList)){
					throw new Exception("参数错误");
				}
			}
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			MaintRecordInfo retRec = this.maintenanceService.createMaintenanceRecord(clientIdList, wrnId, content, uIdList, maIdList, user);
			
			if(retRec != null){
				MaintRecordInfo_Topic info = this.maintenanceService.getMaintenanceRecordForTopic(uid, retRec.getMAINT_ID());
				if(info != null){
					Set<Long> destMaIds = this.maintenanceService.getMaintTopicAreas(info);
					if(destMaIds != null && !destMaIds.isEmpty()){
						this.sendMaintTopic(uid, retRec.getMAINT_ID(), destMaIds, info);
					}
				}
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retRec), null, null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "创建失败", null);
			}
			
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
			
			MaintRecordInfo_Topic info = this.maintenanceService.getMaintenanceRecordForTopic(uid, maintId);
			
			if(info != null && this.maintenanceService.updateMaintenanceRecordOnClose(uid, maintId)){
				//send topic message if the maintenance record has not been activated
				if(info.getMAINT_STATUS() == MaintRecordStatus.wait.getValue()){
					info.setMAINT_END_UID(uid);
					info.setMAINT_END_TS(DateUtil.getCurrentTS());
					info.setMAINT_STATUS(MaintRecordStatus.closed.getValue());
					
					Set<Long> destMaIds = this.maintenanceService.getMaintTopicAreas(info);
					if(destMaIds != null && !destMaIds.isEmpty()){
						this.sendMaintTopic(uid, maintId, destMaIds, info);
					}
				}
				
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
	
	private void sendMaintTopic(String uid, Long maintId, Set<Long> destMaIds, MaintRecordInfo_Topic info){
		try {
			String msg = MsgPackUtil.serialize2Str(info);
			
			if(destMaIds.contains(MaintenanceService.defaultMAID)){
				//send to default area (topic value is equals to uid)
				TopicWebSocketHandler.sendMessageToUser(uid, msg);
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
