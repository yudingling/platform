package com.ckxh.cloud.platform.api.own.rule;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.model.TTActionType;
import com.ckxh.cloud.base.model.TimeTaskType;
import com.ckxh.cloud.base.model.mqMsg.TTMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.TTHelp;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.RuleInfoService;
import com.ckxh.cloud.persistence.db.model.IOT_FORMULA;
import com.ckxh.cloud.persistence.db.model.IOT_LINEARDATA;
import com.ckxh.cloud.persistence.db.model.IOT_RULE_ANA;
import com.ckxh.cloud.persistence.db.model.IOT_RULE_CALC;
import com.ckxh.cloud.persistence.db.model.IOT_RULE_THRESHOLD;
import com.ckxh.cloud.persistence.db.model.IOT_TIMEDDATAANA_TT;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/rule/ruleInfo")
public class RuleInfoController {
	@Autowired
	private RuleInfoService ruleInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	private ScriptEngine engine;
	
	public RuleInfoController(){
		ScriptEngineManager mgr = new ScriptEngineManager();
	    this.engine = mgr.getEngineByName("JavaScript");
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String clientId, @RequestParam Long metaId, HttpServletRequest request, HttpServletResponse response) {
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			if (!this.clientInfoService.clientAuthority(clientId, uid, false)){
				throw new Exception("该client不属于当前用户");
			}

			Map<String, Object> map = ruleInfoService.getRuleInfo(clientId,	metaId);

			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(map), null, null);
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, "获取信息失败", null);
		}
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.PUT)
	public String put(@RequestParam String info, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (info == null || info.length() == 0) {
				throw new Exception("参数错误");
			}

			Object obj = MsgPackUtil.deserialize(info, Object.class);
			if (obj instanceof Map) {
				@SuppressWarnings("rawtypes")
				Map map = (Map) obj;
				
				String uid = AuthUtil.getIdFromSession(request.getSession());
				String clientId = Common.getMapString(map, "c_ID", false);
				if (!this.clientInfoService.clientOwner(clientId, uid)){
					throw new Exception("该client不属于当前用户");
				}
				
				String retDesc = null;
				IOT_RULE_CALC calc = null;
				IOT_RULE_ANA ana = null;
				String ruleID = Common.getMapString(map, "rule_ID", false);

				if (ruleID != null) {
					switch (ruleID) {
						case ConstString.Rule0_formula:
							calc = this.getRuleCalc(map, false);
							retDesc = ruleInfoService.updateFormula(this.getformula(map, calc), calc);
							break;
	
						case ConstString.Rule0_linearinterpolation:
							calc = this.getRuleCalc(map, false);
							List<IOT_LINEARDATA> linears = this.getLinearData(map, calc);
							if(linears != null){
								retDesc = ruleInfoService.updateLinear(linears, calc);
							}
							break;
	
						case ConstString.Rule1_thresholdwarn:
							ana = this.getRuleAna(map, false);
							retDesc = ruleInfoService.updateThresholdwarn(this.getThreshold(map, ana), ana);
							break;
	
						case ConstString.Rule2_timeddataana:
							ana = this.getRuleAna(map, false);
							IOT_TIMEDDATAANA_TT tt = this.getTimeDataAna(map, ana);
							String[] tmpStrs = ruleInfoService.updateTimeddataAna(tt, ana);
							if(tmpStrs != null && tmpStrs.length == 2){
								retDesc = tmpStrs[0];
								//send topic msg to update time task
								TTMsg msg = new TTMsg(TTActionType.update, tt.getTT_ID(), uid, TimeTaskType.fixedTime, 0, tmpStrs[1]);
								this.acMq.sendTopic(msg, ConstString.AcTopic_ttDispatch_update);
							}
							break;
	
						default:
							break;
					}
				}

				if (retDesc == null) {
					throw new Exception("更新失败");
				}else{
					Map<String, String> retMap = new HashMap<String, String>();
					if(calc != null){
						retMap.put("ucr_ID", calc.getUCR_ID() + "");
					}
					if(ana != null){
						retMap.put("uar_ID", ana.getUAR_ID() + "");
					}
					retMap.put("info", retDesc);
					
					return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
				}
				
			}else{
				throw new Exception("参数错误");
			}
			
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String info, HttpServletRequest request, HttpServletResponse response) {
		try {
			if (info == null || info.length() == 0) {
				throw new Exception("参数错误");
			}
			
			Object obj = MsgPackUtil.deserialize(info, Object.class);
			if (obj instanceof Map) {
				@SuppressWarnings("rawtypes")
				Map map = (Map) obj;
				
				String uid = AuthUtil.getIdFromSession(request.getSession());
				String clientId = Common.getMapString(map, "c_ID", false);
				if (!this.clientInfoService.clientOwner(clientId, uid)){
					throw new Exception("该client不属于当前用户");
				}
				
				String retDesc = null;
				IOT_RULE_CALC calc = null;
				IOT_RULE_ANA ana = null;
				String ruleID = Common.getMapString(map, "rule_ID", false);

				if (ruleID != null) {
					switch (ruleID) {
						case ConstString.Rule0_formula:
							calc = this.getRuleCalc(map, true);
							retDesc = ruleInfoService.saveFormula(this.getformula(map, calc), calc);
							break;
	
						case ConstString.Rule0_linearinterpolation:
							calc = this.getRuleCalc(map, true);
							List<IOT_LINEARDATA> linears = this.getLinearData(map, calc);
							if(linears != null){
								retDesc = ruleInfoService.saveLinear(linears, calc);
							}
							break;
	
						case ConstString.Rule1_thresholdwarn:
							ana = this.getRuleAna(map, true);
							retDesc = ruleInfoService.saveThresholdwarn(this.getThreshold(map, ana), ana);
							break;
	
						case ConstString.Rule2_timeddataana:
							ana = this.getRuleAna(map, true);
							retDesc = ruleInfoService.saveTimeddataAna(uid, this.getTimeDataAna(map, ana), ana);
							break;
	
						default:
							break;
					}
				}

				if (retDesc == null) {
					throw new Exception("添加失败");
				}else{
					Map<String, String> retMap = new HashMap<String, String>();
					if(calc != null){
						retMap.put("ucr_ID", calc.getUCR_ID() + "");
					}
					if(ana != null){
						retMap.put("uar_ID", ana.getUAR_ID() + "");
					}
					retMap.put("info", retDesc);
					
					return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
				}
				
			}else{
				throw new Exception("参数错误");
			}
			
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.DELETE)
	public String delete(@RequestParam String clientId, @RequestParam String calcRuleIds, @RequestParam String rtaRuleIds, @RequestParam String haRuleIds,
			HttpServletRequest request, HttpServletResponse response) {
		try {
			if(clientId == null || clientId.length() == 0){
				throw new Exception("clientId不能为空");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			if (!this.clientInfoService.clientOwner(clientId, uid)){
				throw new Exception("该client不属于当前用户");
			}
			
			//should not implement like 'merge calc, rt, ha into one map and then delete all'. the id may be duplicated
			this.deleteRule(calcRuleIds, clientId, uid);
			this.deleteRule(rtaRuleIds, clientId, uid);
			this.deleteRule(haRuleIds, clientId, uid);
			
			return JsonUtil.createSuccessJson(true, null, null, null);
		} catch (Exception e) {
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	private void deleteRule(String ids, String clientId, String uid) throws Exception{
		Map<Long, String> map = MsgPackUtil.deserialize(ids, new TypeReference<Map<Long, String>>(){});
		List<Long> delTTIds = this.ruleInfoService.deleteRule(map, clientId);
		
		//send topic msg to notice timedtask was deleted
		for(Long ttId: delTTIds){
			this.acMq.sendTopic(new TTMsg(TTActionType.delete, ttId, uid), ConstString.AcTopic_ttDispatch_delete);
		}
	}
	
	private IOT_RULE_CALC getRuleCalc(@SuppressWarnings("rawtypes") Map map, Boolean isSave) throws Exception {
		Long ucrId = isSave ? SysTool.longUuid() : Common.getMapLong(map, "ucr_ID");
		String cid = Common.getMapString(map, "c_ID", false);
		String ruleId = Common.getMapString(map, "rule_ID", false);
		Long metaId = Common.getMapLong(map, "meta_ID");
		Long metaRefId = Common.getMapLong(map, "meta_ID_REF");
		
		if(ucrId == null || cid == null || ruleId == null || metaId == null || metaRefId == null){
			throw new Exception("参数错误");
		}
		
		Timestamp ts = DateUtil.getCurrentTS();
		
		return new IOT_RULE_CALC(ucrId, cid, ruleId, metaId, metaRefId, ts, ts);
	}
	
	private IOT_RULE_ANA getRuleAna(@SuppressWarnings("rawtypes") Map map, Boolean isSave) throws Exception {
		Long uarId = isSave ? SysTool.longUuid() : Common.getMapLong(map, "uar_ID");
		String cid = Common.getMapString(map, "c_ID", false);
		String ruleId = Common.getMapString(map, "rule_ID", false);
		Long metaId = Common.getMapLong(map, "meta_ID");
		
		if(uarId == null || cid == null || ruleId == null || metaId == null){
			throw new Exception("参数错误");
		}
		
		Timestamp ts = DateUtil.getCurrentTS();
		
		return new IOT_RULE_ANA(uarId, cid, ruleId, metaId, Common.getMapInt(map, "uar_ORDER", 0), ts, ts);
	}

	private IOT_RULE_THRESHOLD getThreshold(@SuppressWarnings("rawtypes") Map map, IOT_RULE_ANA ana) throws Exception {
		Timestamp ts = DateUtil.getCurrentTS();
		
		IOT_RULE_THRESHOLD obj = new IOT_RULE_THRESHOLD(
				ana.getUAR_ID(),
				Common.getMapString(map, "thw_ST", false),
				Common.getMapString(map, "thw_LT", false),
				Common.getMapString(map, "thw_OUTRANGE", false),
				ts, 
				ts);
		
		if(obj.getTHW_LT() == null && obj.getTHW_ST() == null && obj.getTHW_OUTRANGE() == null){
			throw new Exception("至少有一种触发条件");
		}
		
		try{
			@SuppressWarnings("unused")
			double tmp = 0;
			if(obj.getTHW_LT() != null){
				tmp = Double.parseDouble(obj.getTHW_LT());
			}else if(obj.getTHW_ST() != null){
				tmp = Double.parseDouble(obj.getTHW_ST());
			}else if(obj.getTHW_OUTRANGE() != null){
				String[] vals= obj.getTHW_OUTRANGE().split("~");
				if(vals.length == 2){
					tmp = Double.parseDouble(vals[0]);
					tmp = Double.parseDouble(vals[1]);
				}else{
					throw new Exception("条件输入错误");
				}
			}
		}catch(Exception ex){
			throw new Exception("条件输入错误");
		}
		
		return obj;
	}

	private IOT_FORMULA getformula(@SuppressWarnings("rawtypes") Map map, IOT_RULE_CALC calc) throws Exception {
		Timestamp ts = DateUtil.getCurrentTS();
		
		IOT_FORMULA obj = new IOT_FORMULA(
				calc.getUCR_ID(), 
				Common.getMapString(map, "if_FORMULA", false),
				ts, 
				ts);
		
		try{
			String formulaStr = obj.getIF_FORMULA().replaceAll("(?i)\\{x\\}", 1 + "");
			this.engine.eval(formulaStr);
			
		}catch(Exception e){
			throw new Exception("公式输入错误");
		}
		
		return obj;
	}

	private IOT_TIMEDDATAANA_TT getTimeDataAna(@SuppressWarnings("rawtypes") Map map, IOT_RULE_ANA ana) throws Exception {
		Timestamp ts = DateUtil.getCurrentTS();
		
		IOT_TIMEDDATAANA_TT obj = new IOT_TIMEDDATAANA_TT(
				ana.getUAR_ID(),
				Common.getMapLong(map, "tt_ID"),
				Common.getMapString(map, "td_CHKTM", false),
				Common.getMapInt(map, "td_DELAY_S", 300),   //default delay 300s
				ts, 
				ts);
		
		if(obj.getTD_DELAY_S() < 120){
			throw new Exception("延迟时间不能小于 120 秒"); 
		}
		
		if(!TTHelp.isChkTMLegal(obj.getTD_CHKTM())){
			throw new Exception("时间输入错误");
		}
		
		return obj;
	}

	private List<IOT_LINEARDATA> getLinearData(@SuppressWarnings("rawtypes") Map map, IOT_RULE_CALC calc) throws Exception {
		try {
			List<IOT_LINEARDATA> retList = new ArrayList<IOT_LINEARDATA>();
			Timestamp ts = DateUtil.getCurrentTS();
			
			String liRows = Common.getMapString(map, "li_ROWS", false);
			if(liRows != null && liRows.length() > 0){
				List<Map<String, String>> listRows = MsgPackUtil.deserialize(liRows, new TypeReference<List<Map<String, String>>>() {});
				
				if(listRows != null && !listRows.isEmpty()){
					List<Long> uuids = SysTool.longUuid(listRows.size());
					
					int uuidIndex = 0;
					for (Map<String, String> item: listRows) {
						retList.add(new IOT_LINEARDATA(
								uuids.get(uuidIndex++),
								calc.getUCR_ID(),
								Common.getMapDouble(item, "li_KEY", 0),
								Common.getMapDouble(item, "li_VAL", 0),
								ts, 
								ts));
					}
				}
			}
			return retList;
			
		} catch (Exception e) {
			throw new Exception("输入错误");
		}
	}
}
