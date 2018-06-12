package com.ckxh.cloud.platform.api.own.user;

import java.util.HashMap;
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

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;
import com.ckxh.cloud.persistence.db.user.service.UserRemindService;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/infoList")
public class InfoListController {
	@Autowired
	private UserRemindService userRemindService;
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String excludeRemindIds,  @RequestParam(required = false) String excludeWarnIds,
			@RequestParam(required = false) String dataType, @RequestParam(required = false) Boolean ignoreSize, @RequestParam Integer length, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(length == null || length <= 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<Long> excludeRemindList = excludeRemindIds == null? null : MsgPackUtil.deserialize(excludeRemindIds, new TypeReference<List<Long>>(){});
			List<Long> excludeWarnList = excludeWarnIds == null? null : MsgPackUtil.deserialize(excludeWarnIds, new TypeReference<List<Long>>(){});
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			
			if(ignoreSize == null || !ignoreSize){
				if(dataType != null){
					if(dataType.equals("remind")){
						retMap.put("remindCount", this.userRemindService.getUnClosedUserRemindCount(uid));
					}else{
						retMap.put("wrnCount", this.warnInfoService.getUnClosedWarnCount(uid));
					}
				}else{
					retMap.put("wrnCount", this.warnInfoService.getUnClosedWarnCount(uid));
					retMap.put("remindCount", this.userRemindService.getUnClosedUserRemindCount(uid));
				}
			}
			
			if(dataType != null){
				if(dataType.equals("remind")){
					retMap.put("remindList", this.userRemindService.getUnClosedUserReminds(uid, excludeRemindList, length));
				}else{
					retMap.put("wrnList", this.warnInfoService.getUnClosedWarns(uid, excludeWarnList, length));
				}
			}else{
				retMap.put("remindList", this.userRemindService.getUnClosedUserReminds(uid, excludeRemindList, length));
				retMap.put("wrnList", this.warnInfoService.getUnClosedWarns(uid, excludeWarnList, length));
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
