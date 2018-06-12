package com.ckxh.cloud.platform.api.open;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.redis.JedisHelper;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_3RDSERVICE;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;

@Scope("singleton")
@Controller
@RequestMapping("/open/3rd/request/validate")
public class ThirdPatyRequestValidateController {
	
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public void check(@RequestParam String tokenId, @RequestParam String serviceKey, @RequestParam(required=false) String callId, 
			HttpServletRequest request, HttpServletResponse response){
		
		Object[] validRet = this.thirdPartyService.valid3rdRequest(tokenId, serviceKey);
		if(validRet == null){
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			return;
		}
		
		MAIN_USER_3RDSERVICE u3rd = (MAIN_USER_3RDSERVICE) validRet[0];
		MAIN_3RDSERVICE service = (MAIN_3RDSERVICE) validRet[1];
		Object[] rets = this.thirdPartyService.thirdPartyApiCallCheck(service, u3rd, false);
		if(!((boolean) rets[0])){
			response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
			return;
		}
		
		//if fee by count, the callId is required and should not be expired
		MAIN_3RDSERVICE_FEE fee = (MAIN_3RDSERVICE_FEE) rets[1];
		if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByCount.getValue()){
			if(callId == null || callId.length() == 0){
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				return;
			}
			
			String tmp = JedisHelper.get(ConstString.RedisPrefix_3rdServiceCallId + callId);
			if(tmp == null){
				response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
				return;
			}
			
			JedisHelper.delete(ConstString.RedisPrefix_3rdServiceCallId + callId);
		}
		
		response.setStatus(HttpServletResponse.SC_OK);
	}
}
