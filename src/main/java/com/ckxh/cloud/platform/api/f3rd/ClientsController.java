package com.ckxh.cloud.platform.api.f3rd;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.f3rd.service.ClientInfo3rdService;
import com.ckxh.cloud.persistence.model.f3rd.ClientAndGroup;

@Scope("singleton")
@Controller
@RequestMapping("/3rd/clients")
public class ClientsController {
	@Autowired
	private ClientInfo3rdService clientInfo3rdService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam(required = false) String search, @RequestParam boolean filterByOwner, HttpServletRequest request, HttpServletResponse response) {
		try {
			String uid = (String) request.getAttribute(ConstString.RequestAttr_uid);
			if (uid == null) {
				throw new Exception("用户未授权");
			}
		
			ClientAndGroup cg = this.clientInfo3rdService.getClientAndGroup(uid, search, filterByOwner);

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(cg), null, null);
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
