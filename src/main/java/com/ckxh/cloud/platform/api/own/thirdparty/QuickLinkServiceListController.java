package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
import java.util.List;
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
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceInfo_quickLink;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/quickLink")
public class QuickLinkServiceListController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<ThirdPartyServiceInfo_quickLink> list = this.thirdPartyService.getQuickLinkServiceList(uid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(list), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
