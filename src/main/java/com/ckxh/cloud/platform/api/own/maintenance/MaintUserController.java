package com.ckxh.cloud.platform.api.own.maintenance;

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

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.UserEffectiveTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_MAINTENANCE_AREA;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.UserInfoSimple;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/maint/normal/maintUser")
@AuthPathOnBind("get:/platformApi/own/maint/normal/#")
public class MaintUserController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private UserEffectiveTool userEffectiveTool;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam(required = false) Long gpId, @RequestParam int start, @RequestParam int length, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(start < 0 || length <= 0){
				throw new Exception("参数错误");
			}
			
			//-1 is default group
			if(gpId != null && gpId == MaintenanceService.defaultMAID){
				gpId = null;
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] ret = this.maintenanceService.getMaintenanceUsers(search, gpId, uid, start, length);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String editType, @RequestParam String users, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(editType == null || editType.length() == 0 || (!editType.equals("disable") && !editType.equals("enable"))
					|| users == null || users.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<String> userList =  MsgPackUtil.deserialize(users, new TypeReference<List<String>>(){});
			if(userList.isEmpty()){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			this.maintenanceService.updateMaintenanceUsers(uid, userList, editType);
			
			return JsonUtil.createSuccessJson(true, null, "更新成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String uId, @RequestParam String uNm, @RequestParam(required = false) Long gpId, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(uId == null || uId.length() == 0 || uNm == null || uNm.length() == 0){
				throw new Exception("参数错误");
			}
			
			if(!Validator.isEmail(uId)){
				throw new Exception("email地址不符合规范");
			}
			
			if(this.userInfoService.emailExists(uId)){
				throw new Exception("email已经被使用");
			}
			
			//-1 is default group
			if(gpId != null && gpId == MaintenanceService.defaultMAID){
				gpId = null;
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_MAINTENANCE_AREA area = this.maintenanceService.getArea(uid, gpId);
			
			MAIN_USER user = this.maintenanceService.createMaintenanceUser(uId, uNm, uid, ConstString.RoleTemplate_maintenanceUser, area != null ? area.getMA_ID() : null);
			if(user != null){
				this.userEffectiveTool.afterMaintenanceUserCreate(user);
				
				UserInfoSimple simpleInfo = new UserInfoSimple(user);
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(simpleInfo), "运维用户创建成功。已发送验证邮件，请该用户及时确认(24小时内)", null);
			}
			
			throw new Exception("用户创建失败");
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
