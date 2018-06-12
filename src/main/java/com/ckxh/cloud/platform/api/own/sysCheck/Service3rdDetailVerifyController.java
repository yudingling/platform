package com.ckxh.cloud.platform.api.own.sysCheck;

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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceDetail;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysCheck/thirdparty/verifyServiceDetail")
public class Service3rdDetailVerifyController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam Long tpsId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null){
				throw new Exception("参数错误");
			}
			
			ThirdPartyServiceDetail detail = this.thirdPartyService.getServiceDetail_verify(tpsId);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(detail), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
