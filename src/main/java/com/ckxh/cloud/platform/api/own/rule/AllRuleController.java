package com.ckxh.cloud.platform.api.own.rule;

import java.util.Map;

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
import com.ckxh.cloud.persistence.db.client.service.RuleInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_RULE;
import com.fasterxml.jackson.core.JsonProcessingException;

@Scope("singleton")
@Controller
@RequestMapping("/own/rule/normal/allRule")
public class AllRuleController {
	@Autowired
	private RuleInfoService ruleInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try {
			Map<String, IOT_RULE> map = ruleInfoService.getAllRules();
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(map), null, null);
		} catch (JsonProcessingException e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
