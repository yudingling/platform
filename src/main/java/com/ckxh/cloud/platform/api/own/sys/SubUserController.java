package com.ckxh.cloud.platform.api.own.sys;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
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
import com.ckxh.cloud.base.model.Critical_Level;
import com.ckxh.cloud.base.model.PushStatus;
import com.ckxh.cloud.base.model.mqMsg.SysWarnMail3rd;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.UserEffectiveTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_MAIL;
import com.ckxh.cloud.persistence.db.model.MAIN_ROLE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.AccountService;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyPushService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.ClientTreeNode;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/sys/normal/subUser")
@AuthPathOnBind("get:/platformApi/own/sys/normal/#")
public class SubUserController {
	@Autowired
	private AccountService accountService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private ThirdPartyPushService thirdPartyPushService;
	@Autowired
	private UserEffectiveTool userEffectiveTool;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) Boolean showCheck, HttpServletRequest request, HttpServletResponse response){
		try{
			String parentUid = AuthUtil.getIdFromSession(request.getSession());
			
			if(showCheck == null){
				showCheck = false;
			}
			
			List<ClientTreeNode> retList = this.accountService.getSubUser(parentUid, showCheck);
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String uId, @RequestParam String uNm, @RequestParam String roleId, @RequestParam(required = false) Boolean active, 
			@RequestParam String clientIds, HttpServletRequest request, HttpServletResponse response){
		try{
			if(uId == null || uId.length() == 0 || uNm == null || uNm.length() == 0 || roleId == null || roleId.length() == 0 || clientIds == null || clientIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			String parentUid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER user = this.userInfoService.getUserInfo(uId);
			if(user == null || !parentUid.equals(user.getU_PID())){
				throw new Exception("参数错误");
			}
			
			if(!ConstString.RoleTemplate_defaultUser.equals(roleId)){
				MAIN_ROLE roleObj = this.accountService.getRole(roleId);
				if(roleObj == null || !parentUid.equals(roleObj.getU_ID())){
					throw new Exception("参数错误");
				}
			}
			
			//only update 'u_active' when user is actived before (also make sense that the phone would not be null)
			String oldRoleId = user.getROLE_ID();
			if(user.getU_PHONE() != null && user.getU_PHONE().length() > 0){
				this.userInfoService.updateUserBaseInfo(uId, new String[]{"U_NM", "ROLE_ID", "U_ACTIVE"}, new Object[]{uNm, roleId, active != null? active : false});
				user.setU_NM(uNm);
				user.setROLE_ID(roleId);
				user.setU_ACTIVE(active.booleanValue()? 1 : 0);
			}else{
				this.userInfoService.updateUserBaseInfo(uId, new String[]{"U_NM", "ROLE_ID"}, new Object[]{uNm, roleId});
				user.setU_NM(uNm);
				user.setROLE_ID(roleId);
			}
			
			//clear role cache
			if(!roleId.equals(oldRoleId)){
				this.accountService.clearRoleRelativedCache(uId);
			}
			
			List<String> cidList = MsgPackUtil.deserialize(clientIds, new TypeReference<List<String>>(){});
			this.clientInfoService.updateClientsToSubUser(parentUid, uId, cidList);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(user), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String uId, @RequestParam String uNm, @RequestParam String roleId, @RequestParam String clientIds, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(uId == null || uId.length() == 0 || uNm == null || uNm.length() == 0 || roleId == null || roleId.length() == 0 || clientIds == null || clientIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			if(!Validator.isEmail(uId)){
				throw new Exception("email地址不符合规范");
			}
			
			if(this.userInfoService.emailExists(uId)){
				throw new Exception("email已经被使用");
			}
			
			String parentUid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!ConstString.RoleTemplate_defaultUser.equals(roleId)){
				MAIN_ROLE roleObj = this.accountService.getRole(roleId);
				if(roleObj == null || !parentUid.equals(roleObj.getU_ID())){
					throw new Exception("参数错误");
				}
			}
			
			MAIN_USER user = this.userInfoService.createSubUser(uId, uNm, parentUid, roleId);
			if(user != null){
				this.userEffectiveTool.afterSubUserCreate(user);
				
				List<String> cidList = MsgPackUtil.deserialize(clientIds, new TypeReference<List<String>>(){});
				this.clientInfoService.updateClientsToSubUser(parentUid, uId, cidList);
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(user), "用户创建成功。已发送验证邮件，请该子用户及时确认(24小时内)", null);
			}
			
			throw new Exception("用户创建失败");
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam String userIds, HttpServletRequest request, HttpServletResponse response){
		try{
			if(userIds == null || userIds.length() == 0){
				throw new Exception("参数错误");
			}
			
			String parentUid = AuthUtil.getIdFromSession(request.getSession());
			List<String> idList = MsgPackUtil.deserialize(userIds, new TypeReference<List<String>>(){});
			
			Map<String, MAIN_USER> deledMap = this.accountService.deleteSubUser(parentUid, idList);
			if(deledMap != null && !deledMap.isEmpty()){
				this.userEffectiveTool.afterDelete(new ArrayList<String>(deledMap.keySet()));
				
				MAIN_USER parentUser = this.userInfoService.getUserInfo(parentUid);
				
				Timestamp ts = DateUtil.getCurrentTS();
				String content = "您的账号已经被父级用户["+ parentUser.getU_NM() +"]禁用，如有疑问请及时联系该用户进行确认.";
				List<MAIN_3RDPUSH_MAIL> pushMailList = new ArrayList<MAIN_3RDPUSH_MAIL>();
				List<SysWarnMail3rd> mail3rdList = new ArrayList<SysWarnMail3rd>();
				
				List<Long> uuids = SysTool.longUuid(deledMap.size());
				int uuidIndex = 0;
				
				//send a email to notice the user that he was disabled
				for(String uid : deledMap.keySet()){
					//email address is the uid and the sender is system account
					MAIN_3RDPUSH_MAIL pushMail = new MAIN_3RDPUSH_MAIL(uuids.get(uuidIndex++), uid, PushStatus.sending.getValue(), content, ConstString.Sys_3rdPush, ts, ts);
					pushMailList.add(pushMail);
					
					SysWarnMail3rd mail3rd = new SysWarnMail3rd(ConstString.Sys_3rdPush, pushMail.getMAIL_ID(), uid, null, null, deledMap.get(uid).getU_NM(), Critical_Level.medium, content);
					mail3rdList.add(mail3rd);
				}
				
				if(this.thirdPartyPushService.saveMAIN_3RDPUSH_MAIL(pushMailList)){
					for(SysWarnMail3rd item : mail3rdList){
						this.acMq.sendQueue(item, ConstString.AcQueue_mail3rdPush);
					}
				}
			}
			
			return JsonUtil.createSuccessJson(true, null, "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
