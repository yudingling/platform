package com.ckxh.cloud.platform.api.own.warn;

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

@Scope("singleton")
@Controller
@RequestMapping("/own/warn/normal/warnInfo")
public class WarnInfoController {
	@Autowired
	private WarnInfoService warnInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) Integer confirmed, @RequestParam(required = false) Integer closed, @RequestParam(required = false) String search, 
			@RequestParam int start, @RequestParam int length, HttpServletRequest request, HttpServletResponse response){
		try{
			if(start < 0 || length <= 0){
				throw new Exception("参数错误");
			}
			
			if(confirmed == null){
				confirmed = -1;
			}
			if(closed == null){
				closed = -1;
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] retData = this.warnInfoService.getWarns(uid, confirmed, closed, search, start, length);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retData), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
