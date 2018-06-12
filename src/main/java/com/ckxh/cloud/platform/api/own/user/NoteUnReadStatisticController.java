package com.ckxh.cloud.platform.api.own.user;

import java.util.ArrayList;
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
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.user.service.UserRemindService;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/notification/unRead/statistic")
public class NoteUnReadStatisticController {
	@Autowired
	private UserRemindService userRemindService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<Integer> allTypes = this.userRemindService.getRemindTypes(uid);
			List<Map<String, Object>> mapType = this.userRemindService.getUnReadStatictisByType(uid);
			List<Map<String, Object>> mapLevel = this.userRemindService.getUnReadStatictisByLevel(uid);
			long total = this.userRemindService.getUnClosedUserRemindCount(uid);
			
			List<Integer> countedTypes = new ArrayList<Integer>();
			for(Map<String, Object> item : mapType){
				countedTypes.add((Integer)item.get("rm_TP"));
			}
			
			for(Integer tp : allTypes){
				if(!countedTypes.contains(tp)){
					Map<String, Object> tmp = new HashMap<String, Object>();
					tmp.put("rm_TP", tp);
					tmp.put("count", 0);
					
					mapType.add(tmp);
				}
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("all", total);
			retMap.put("noteType", mapType);
			retMap.put("noteLevel", mapLevel);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
