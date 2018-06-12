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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.UserEffectiveTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/maint/normal/maintUser/verifyMail")
public class MaintUserVerifyMailController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private UserEffectiveTool userEffectiveTool;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	@AuthPathOnBind("get:/platformApi/own/maint/normal/#")
	public String get(@RequestParam String users, HttpServletRequest request, HttpServletResponse response){
		try{
			if(users == null || users.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<String> userList =  MsgPackUtil.deserialize(users, new TypeReference<List<String>>(){});
			if(userList.isEmpty()){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<MAIN_USER> tmpList = this.maintenanceService.getUnActiveMaintUsers(uid, userList);
			
			if(tmpList != null && !tmpList.isEmpty()){
				for(MAIN_USER item : tmpList){
					this.userEffectiveTool.afterMaintenanceUserCreate(item);
				}
				
				return JsonUtil.createSuccessJson(true, null, "已发送验证邮件，请运维用户及时确认(24小时内有效)", null);
				
			}else{
				return JsonUtil.createSuccessJson(false, null, "所指定的用户已经通过验证或被禁用", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
