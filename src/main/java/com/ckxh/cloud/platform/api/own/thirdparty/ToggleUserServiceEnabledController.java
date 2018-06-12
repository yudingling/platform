package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;

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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_3RDSERVICE;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/toggleUspEnabled")
@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
public class ToggleUserServiceEnabledController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String post(@RequestParam Long uspId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(uspId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER_3RDSERVICE u3rd = this.thirdPartyService.getUserOf3RdService_fromDB(uid, uspId);
			if(u3rd == null){
				throw new Exception("参数错误");
			}
			
			if(u3rd.getUSP_ENABLED() == 0){
				MAIN_3RDSERVICE service = this.thirdPartyService.get3RdServiceByTpsId(u3rd.getTPS_ID());
				
				Object[] rets = this.thirdPartyService.thirdPartyApiCallCheck(service, u3rd, false);
				if(!((boolean) rets[0])){
					throw new Exception("该服务已欠费，请先购买再启动");
				}
			}
			
			u3rd.setUPT_TS(DateUtil.getCurrentTS());
			u3rd.setUSP_ENABLED(u3rd.getUSP_ENABLED() == 0 ? 1 : 0);
			
			if(this.thirdPartyService.updateUser3rdServiceEnabled(u3rd)){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(u3rd), null, null);
				
			}else{
				return JsonUtil.createSuccessJson(false, null, "操作失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
