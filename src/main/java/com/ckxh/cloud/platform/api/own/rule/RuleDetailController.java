package com.ckxh.cloud.platform.api.own.rule;

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
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.RuleInfoService;

@Scope("singleton")
@Controller
@RequestMapping("/own/rule/normal/ruleDetail")
public class RuleDetailController {
	@Autowired
	private RuleInfoService ruleInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String clientId, @RequestParam Long ruleUnionID, @RequestParam String ruleID, HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			if( !this.clientInfoService.clientAuthority(clientId, uid, false) ){
				throw new Exception("该client不属于当前用户");
			}

			Object obj = null;
			switch (ruleID) {
			case ConstString.Rule0_formula:
				obj = ruleInfoService.getCalcFormula(clientId, ruleUnionID);
				break;

			case ConstString.Rule0_linearinterpolation:
				obj = ruleInfoService.getCalcLinearData(clientId, ruleUnionID);
				break;

			case ConstString.Rule1_thresholdwarn:
				obj = ruleInfoService.getAnaThresholdWarn(clientId, ruleUnionID);
				break;

			case ConstString.Rule2_timeddataana:
				obj = ruleInfoService.getTimeDataAna(ruleUnionID);
				break;
				
			default:
				break;
			}
			
			if(obj == null){
				throw new Exception("数据获取失败");
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(obj), null, null);
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
