package com.ckxh.cloud.platform.api.own.warn;

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
import com.ckxh.cloud.persistence.db.client.service.WarnInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/warn/normal/unClosed/statistic")
public class WarnUnClosedStatisticController {
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<Map<String, Object>> mapConfirm = this.warnInfoService.getUnClosedWarnStatictisByConfirm(uid);
			long total = this.warnInfoService.getUnClosedWarnCount(uid);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("all", total);
			retMap.put("warnConfirm", mapConfirm);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
