package com.ckxh.cloud.platform.api.own.client.mobile;

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
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/mobile/clientInfo")
public class ClientInfo_MobileController {

	@Autowired
	private ClientInfoService clientInfoService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String clientId, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (clientId == null || clientId.length() == 0) {
				throw new Exception("clientId不能为空");
			}

			String uid = AuthUtil.getIdFromSession(request.getSession());

			if (!this.clientInfoService.clientAuthority(clientId, uid, true)){
				throw new Exception("设备未授权访问");
			}
			
			Map<String, Object> map = clientInfoService.getMobileClientInfo(clientId);

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(map), null, null);
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
