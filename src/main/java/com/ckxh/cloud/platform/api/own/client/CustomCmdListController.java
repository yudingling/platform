package com.ckxh.cloud.platform.api.own.client;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
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
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/customCmdList")
public class CustomCmdListController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam String stm, @RequestParam String etm, 
			@RequestParam int start, @RequestParam int length, HttpServletRequest request, HttpServletResponse response){
		try {
			if(stm == null || stm.length() == 0 || etm == null || etm.length() == 0 || start < 0 || length < 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Object[] list = this.clientInfoService.getCustomCmds(uid, Timestamp.valueOf(stm), Timestamp.valueOf(etm), search, start, length);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list, new SimpleDateFormat("yyyy/MM/dd HH:mm")), null, null);
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
