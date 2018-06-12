package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.model.ClientInfo_Discovery;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/discovery")
public class DiscoveryController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam(required = false) Double xmin, @RequestParam(required = false) Double xmax, @RequestParam(required = false) Double ymin, 
			@RequestParam(required = false) Double ymax, @RequestParam int startIndex, @RequestParam int length, HttpServletRequest request, HttpServletResponse response){		
		try {
			if(startIndex < 0 || length <=0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			List<ClientInfo_Discovery> list = this.clientInfoService.getDiscoveryClients(uid, xmin, xmax, ymin, ymax, search, startIndex, length);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list), null, null);
		
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
