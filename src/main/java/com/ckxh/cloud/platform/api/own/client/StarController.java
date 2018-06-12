package com.ckxh.cloud.platform.api.own.client;

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
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/star")
@AuthPathOnBind("get:/platformApi/own/client/normal/#")
public class StarController {
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String add(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, true)){
				throw new Exception("设备未授权访问");
			}
			
			if(this.clientInfoService.addStar(uid, clientId)){
				return JsonUtil.createSuccessJson(true, null, "添加成功", null);
			}else{
				throw new Exception("添加失败");
			}
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(this.clientInfoService.deleteStar(uid, clientId)){
				return JsonUtil.createSuccessJson(true, null, "删除成功", null);
			}else{
				throw new Exception("删除失败");
			}
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
