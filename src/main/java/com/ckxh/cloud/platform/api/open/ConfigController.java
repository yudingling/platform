package com.ckxh.cloud.platform.api.open;

import java.util.HashMap;
import java.util.Map;
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
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;

/**
 * get the sys config of below: uid、serverNM_file
 */
@Scope("singleton")
@Controller
@RequestMapping("/open/cfg")
public class ConfigController {
	@Autowired
	private CacheChanger cacheChanger;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response) {
		try {
			Map<String, String> values = new HashMap<String, String>();	

			values.put("serverNM_platform", this.cacheChanger.getLocalValue(ConstString.DicKey_platformAppServerNM, null));
			values.put("serverNM_file", this.cacheChanger.getLocalValue(ConstString.DicKey_fileAppServerNM, null));
			values.put("uId", AuthUtil.getIdFromSession(request.getSession()));

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(values), null, null);
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
