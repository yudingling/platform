package com.ckxh.cloud.platform.api.own.sysCheck;

import java.io.IOException;
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
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceStatus;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysCheck/thirdparty/serviceListVerify")
public class Service3rdListVerifyController {
	@Autowired
	private ThirdPartyService thirdPartyService;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam int tps_status, @RequestParam(required = false) String search,
			@RequestParam int start, @RequestParam int length, HttpServletRequest request, HttpServletResponse response)
			throws IOException {
		try {
			if (start < 0 || length <= 0) {
				throw new Exception("参数错误");
			}

			Object[] ret = this.thirdPartyService.getThirdPartyServiceList_verify(search, start, length, ThirdPartyServiceStatus.valueOf(tps_status));
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(ret, new SimpleDateFormat("yyyy/MM/dd")), null, null);

		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
