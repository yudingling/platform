package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
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

import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.base.util.Validator;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_AUTHDESC;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_API;
import com.ckxh.cloud.persistence.db.sys.service.ApiInfoService;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceExecType;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceInfo_mine;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceStatus;
import com.ckxh.cloud.platform.model.ServiceCreateInfo;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/create")
@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
public class CreateServiceController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private ApiInfoService apiInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam String objStr, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(objStr == null || objStr.length() == 0){
				throw new Exception("参数错误");
			}
			
			ServiceCreateInfo info = MsgPackUtil.deserialize(objStr, ServiceCreateInfo.class);
			if(info.getTPS_ID() == null && this.validateInfo(info, true)){
				Timestamp ts = DateUtil.getCurrentTS();
				String uid = AuthUtil.getIdFromSession(request.getSession());
				
				MAIN_3RDSERVICE s3rd = this.gen3rdService(uid, info, ts);
				MAIN_3RDSERVICE_FEE fee = this.gen3rdFee(s3rd.getTPS_ID(), info, ts);
				List<MAIN_3RDSERVICE_AUTHDESC> authDesc = this.genAuthDesc(s3rd.getTPS_ID(), info, ts);
				
				if(this.thirdPartyService.create3rdService(s3rd, fee, authDesc)){
					ThirdPartyServiceInfo_mine mine = this.thirdPartyService.getMineService(uid, s3rd.getTPS_ID());
					
					return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(mine), "创建成功", null);
				}
			}
			
			return JsonUtil.createSuccessJson(false, null, "创建服务失败", null);
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam String objStr, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(objStr == null || objStr.length() == 0){
				throw new Exception("参数错误");
			}
			
			ServiceCreateInfo info = MsgPackUtil.deserialize(objStr, ServiceCreateInfo.class);
			if(info.getTPS_ID() != null){
				MAIN_3RDSERVICE old = this.thirdPartyService.get3RdServiceByTpsId(info.getTPS_ID());
				String uid = AuthUtil.getIdFromSession(request.getSession());
				
				if(old != null && uid.equals(old.getU_ID()) && old.getTPS_STATUS() == ThirdPartyServiceStatus.UnderReview.getValue()
						&& this.validateInfo(info, false)){
					Timestamp ts = DateUtil.getCurrentTS();
					
					MAIN_3RDSERVICE s3rd = this.gen3rdService(old, info, ts);
					MAIN_3RDSERVICE_FEE fee = this.gen3rdFee(s3rd.getTPS_ID(), info, ts);
					List<MAIN_3RDSERVICE_AUTHDESC> authDesc = this.genAuthDesc(s3rd.getTPS_ID(), info, ts);
					
					boolean upted = this.thirdPartyService.update3rdService(
							s3rd, 
							ThirdPartyServiceStatus.UnderReview, 
							new String[]{"TPS_NM", "TPS_APIURL", "TPS_IMG", "TPS_BRIEF", "TPS_DESC", "TPS_HELPURL", "TPS_EXEC_TP", "TPS_TMSTR", "TPS_VISIBLE_UIDS"}, 
							new Object[]{s3rd.getTPS_NM(), s3rd.getTPS_APIURL(), s3rd.getTPS_IMG(), s3rd.getTPS_BRIEF(), s3rd.getTPS_DESC(), s3rd.getTPS_HELPURL(), s3rd.getTPS_EXEC_TP(), s3rd.getTPS_TMSTR(), s3rd.getTPS_VISIBLE_UIDS()});
					
					if(upted){
						this.thirdPartyService.update3rdServiceFee(fee, true);
						this.thirdPartyService.update3rdServiceAuthDesc(s3rd.getTPS_ID(), authDesc);
						
						ThirdPartyServiceInfo_mine mine = this.thirdPartyService.getMineService(uid, s3rd.getTPS_ID());
						
						return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(mine), "修改成功", null);
					}
				}
			}
			
			return JsonUtil.createSuccessJson(false, null, "修改服务失败", null);
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private MAIN_3RDSERVICE gen3rdService(MAIN_3RDSERVICE old, ServiceCreateInfo info, Timestamp ts) throws Exception{
		old.setTPS_NM(info.getTPS_NM());
		old.setTPS_APIURL(info.getTPS_APIURL());
		if(info.getImgModifiedOnEdit() != null && info.getImgModifiedOnEdit().booleanValue()){
			old.setTPS_IMG(info.getTPS_IMG());
		}
		old.setTPS_BRIEF(info.getTPS_BRIEF());
		old.setTPS_DESC(info.getTPS_DESC());
		old.setTPS_HELPURL(info.getTPS_HELPURL());
		old.setTPS_EXEC_TP(info.getTPS_EXEC_TP());
		old.setTPS_TMSTR(info.getTPS_TMS_STR());
		old.setTPS_VISIBLE_UIDS(this.getVisibleUids(info.getTPS_VISIBLE_UIDS()));
		old.setUPT_TS(ts);
		
		return old;
	}
	
	private MAIN_3RDSERVICE gen3rdService(String uid, ServiceCreateInfo info, Timestamp ts) throws Exception{
		return new MAIN_3RDSERVICE(
				SysTool.longUuid(), 
				uid, 
				null, 
				info.getTPS_NM(), 
				info.getTPS_APIURL(), 
				this.apiInfoService.get3rdApiId(), 
				ThirdPartyServiceStatus.UnderReview.getValue(),
				info.getTPS_IMG(), 
				info.getTPS_BRIEF(), 
				info.getTPS_DESC(), 
				info.getTPS_HELPURL(), 
				Common.uuid32(), 
				info.getTPS_EXEC_TP(), 
				info.getTPS_TMS_STR(), 
				null, //unreliable
				0, 
				0, 
				this.getVisibleUids(info.getTPS_VISIBLE_UIDS()),
				ts, 
				ts);
	}
	
	private String getVisibleUids(String visibleUids){
		if(visibleUids != null){
			visibleUids = visibleUids.trim();
			if(visibleUids.isEmpty()){
				visibleUids = null;
			}
		}
		
		return visibleUids;
	}
	
	private MAIN_3RDSERVICE_FEE gen3rdFee(Long tpsId, ServiceCreateInfo info, Timestamp ts){
		return new MAIN_3RDSERVICE_FEE(
				tpsId, 
				info.getFEE_TP(), 
				info.getFEE_COUNT_FREE(), 
				info.getFEE_COUNT_NUM(), 
				Common.toFixed(info.getFEE_COUNT_BASE(), 2), // 2 digits
				info.getFEE_TIME_FREE(), 
				info.getFEE_TIME_PERIOD(), 
				Common.toFixed(info.getFEE_TIME_BASE(), 2), 
				ts, 
				ts);
	}
	
	private List<MAIN_3RDSERVICE_AUTHDESC> genAuthDesc(Long tpsId, ServiceCreateInfo info, Timestamp ts) throws Exception{
		List<String> apis = new ArrayList<String>();
		
		Map<String, MAIN_API> authMap = this.apiInfoService.get3rdAuthApiMap();
		for(MAIN_API api : authMap.values()){
			apis.add(api.getAPI_ID());
		}
		
		List<MAIN_3RDSERVICE_AUTHDESC> retList = new ArrayList<MAIN_3RDSERVICE_AUTHDESC>();
		if(info.getAuthApis() != null && !info.getAuthApis().isEmpty()){
			List<Long> uuids = SysTool.longUuid(info.getAuthApis().size());
			int uuidIndex = 0;
			
			for(String apiId : info.getAuthApis()){
				if(!apis.contains(apiId)){
					throw new Exception("授权api不可用");
				}
				
				retList.add(new MAIN_3RDSERVICE_AUTHDESC(uuids.get(uuidIndex++), tpsId, apiId, ts, ts));
			}
		}
		
		return retList;
	}
	
	private boolean validateInfo(ServiceCreateInfo info, boolean isAdd) throws Exception{
		if(info.getTPS_NM() == null || info.getTPS_NM().length() == 0 || info.getTPS_NM().length() > 30){
			throw new Exception("服务名称错误");
		}
		if(isAdd || (info.getImgModifiedOnEdit() != null && info.getImgModifiedOnEdit().booleanValue() == true)){
			if(info.getTPS_IMG() == null){
				throw new Exception("服务图片错误");
			}
		}
		if(info.getTPS_APIURL() == null || info.getTPS_APIURL().length() == 0 || info.getTPS_NM().length() > 255 || !Validator.isUrl(info.getTPS_APIURL())){
			throw new Exception("服务地址错误");
		}
		if(info.getTPS_BRIEF() == null || info.getTPS_BRIEF().length() == 0 || info.getTPS_BRIEF().length() > 100){
			throw new Exception("服务简介错误");
		}
		if(info.getTPS_DESC() == null || info.getTPS_DESC().length() == 0 || info.getTPS_DESC().length() > 1000){
			throw new Exception("服务详述错误");
		}
		if(info.getTPS_HELPURL() == null || info.getTPS_HELPURL().length() == 0 || info.getTPS_HELPURL().length() > 255 || !Validator.isUrl(info.getTPS_HELPURL())){
			throw new Exception("服务帮助地址错误");
		}
		if(info.getTPS_VISIBLE_UIDS() != null && info.getTPS_VISIBLE_UIDS().length() > 1000){
			throw new Exception("服务可见的用户id错误");
		}
		
		ThirdPartyServiceExecType execTP = ThirdPartyServiceExecType.valueOf(info.getTPS_EXEC_TP());
		
		if(execTP == ThirdPartyServiceExecType.Timing){
			if(info.getTPS_TMS() == null || info.getTPS_TMS().isEmpty()){
				throw new Exception("执行时间错误");
			}
			
			//periodic service. only the first item is valid and the interval should greater than 1 minute.
			String t1 = info.getTPS_TMS().get(0);
			if(t1.startsWith("+")){
				long interval = Long.parseLong(t1.substring(1));
				if(interval < 60000){
					throw new Exception("执行时间错误");
				}
				
				info.setTPS_TMS_STR(t1);
				
			}else{
				this.checkFixedTime(info.getTPS_TMS());
				
				info.setTPS_TMS_STR(MsgPackUtil.serialize2Str(info.getTPS_TMS()));
			}
		}
		
		ThirdPartyServiceFeeType feeTP = ThirdPartyServiceFeeType.valueOf(info.getFEE_TP());
		
		if(feeTP == ThirdPartyServiceFeeType.ByCount){
			if(info.getFEE_COUNT_FREE() < 0){
				throw new Exception("试用次数错误");
			}
			
			if(info.getFEE_COUNT_NUM() != 2000 && info.getFEE_COUNT_NUM() != 5000 
					&& info.getFEE_COUNT_NUM() != 10000 && info.getFEE_COUNT_NUM() != 50000 && info.getFEE_COUNT_NUM() != 100000){
				throw new Exception("购买次数错误");
			}
			
			if(info.getFEE_COUNT_BASE() <= 0){
				throw new Exception("购买费用错误");
			}
			
		}else if(feeTP == ThirdPartyServiceFeeType.ByTime){
			if(info.getFEE_TIME_FREE() < 0){
				throw new Exception("试用天数错误");
			}
			
			if(info.getFEE_TIME_PERIOD() != 30 && info.getFEE_TIME_PERIOD() != 180 && info.getFEE_TIME_PERIOD() != 360){
				throw new Exception("购买时长错误");
			}
			
			if(info.getFEE_TIME_BASE() <= 0){
				throw new Exception("购买费用错误");
			}
		}
		
		return true;
	}
	
	private void checkFixedTime(List<String> tmList){
		for(String tm: tmList){
			switch(tm.length()){
				case 14:
					DateUtil.parseDate("2010-" + tm);
					break;
					
				case 11:
					DateUtil.parseDate("2010-01-" + tm);
					break;
					
				case 8:
					DateUtil.parseDate("2010-01-01 " + tm);
					break;
					
				case 5:
					DateUtil.parseDate("2010-01-01 08:" + tm);
					break;
					
				case 2:
					DateUtil.parseDate("2010-01-01 08:00:" + tm);
					break;
			}
		}
	}
}
