package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_3RDSERVICE;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/serviceCaller")
public class ServiceCallerController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			MAIN_USER_3RDSERVICE u3rd = (MAIN_USER_3RDSERVICE) request.getAttribute(ConstString.RequestAttr_user_3rdService);
			MAIN_3RDSERVICE service = (MAIN_3RDSERVICE) request.getAttribute(ConstString.RequestAttr_3rdService);
			MAIN_3RDSERVICE_FEE fee = (MAIN_3RDSERVICE_FEE) request.getAttribute(ConstString.RequestAttr_3rdService_fee);
			
			//third party service should accept 'get' request
			String redirectUrl = this.thirdPartyService.get3rdRedirectUrl(u3rd, service, fee);
			
			return JsonUtil.createSuccessJson(true, "\""+ redirectUrl +"\"", null, null);
			
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
