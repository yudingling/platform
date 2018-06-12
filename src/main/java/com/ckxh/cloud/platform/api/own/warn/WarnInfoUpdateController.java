package com.ckxh.cloud.platform.api.own.warn;

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
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * should not combine with @WarnInfoController. this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("/own/warn/update")
public class WarnInfoUpdateController {
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String update(@RequestParam String wrnIds, @RequestParam String actionType, HttpServletRequest request, HttpServletResponse response){
		try{
			if(wrnIds == null || wrnIds.length() == 0 || actionType == null || actionType.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<Long> wrnIdList = MsgPackUtil.deserialize(wrnIds, new TypeReference<List<Long>>(){});
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if("close".equals(actionType)){
				if(this.warnInfoService.updateWarnForClose(uid, wrnIdList)){
					return JsonUtil.createSuccessJson(true, null, "关闭告警成功", null);
				}else{
					return JsonUtil.createSuccessJson(false, null, "关闭告警失败", null);
				}
			}else if("check".equals(actionType)){
				if(this.warnInfoService.updateWarnForCheck(uid, wrnIdList)){
					return JsonUtil.createSuccessJson(true, null, "确认告警成功", null);
				}else{
					return JsonUtil.createSuccessJson(false, null, "确认告警失败", null);
				}
			}else{
				throw new Exception("参数错误");
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
