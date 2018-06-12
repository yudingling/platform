package com.ckxh.cloud.platform.api.own.thirdparty;

import java.io.IOException;
import java.sql.Timestamp;

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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_FEE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceDetail;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceFeeType;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceInfo_mine;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceStatus;

@Scope("singleton")
@Controller
@RequestMapping("/own/thirdparty/normal/detail")
public class ServiceDetailController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private UserInfoService userInfoService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam Long tpsId, HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			
			ThirdPartyServiceDetail detail = this.thirdPartyService.getServiceDetail(tpsId, uid, user.getU_PID());
			if(detail != null){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(detail), null, null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "参数错误", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	@AuthPathOnBind("get:/platformApi/own/thirdparty/normal/#")
	public String put(@RequestParam Long tpsId, String brief, String desc, @RequestParam(required = false) String visibleUids,
			@RequestParam(required = false) Long countFree, @RequestParam(required = false) Double countBase, 
			@RequestParam(required = false) Integer timeFree, @RequestParam(required = false) Double timeBase,
			HttpServletRequest request, HttpServletResponse response) throws IOException{
		try {
			if(tpsId == null 
					|| brief == null || brief.length() == 0 || brief.length() > 100 
					|| desc == null || desc.length() == 0 || desc.length() > 1000
					|| (visibleUids != null && visibleUids.length() > 1000)){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_3RDSERVICE s3rd = this.thirdPartyService.get3RdServiceByTpsId(tpsId);
			//update the service belongs to the current user
			if(s3rd == null || !uid.equals(s3rd.getU_ID())){
				throw new Exception("参数错误");
			}
			
			MAIN_3RDSERVICE_FEE fee = this.thirdPartyService.get3RdServiceFee(tpsId);
			if(fee == null){
				throw new Exception("参数错误");
			}
			
			Timestamp uptTs = DateUtil.getCurrentTS();
			
			if(fee.getFEE_TP() != ThirdPartyServiceFeeType.Free.getValue()){
				if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByCount.getValue()){
					if(countFree == null || countFree.longValue() < 0 || countBase == null || countBase.doubleValue() <= 0){
						throw new Exception("参数错误");
					}
					
					fee.setFEE_COUNT_FREE(countFree.longValue());
					fee.setFEE_COUNT_BASE(countBase.doubleValue());
					fee.setUPT_TS(uptTs);
					
				}else if(fee.getFEE_TP() == ThirdPartyServiceFeeType.ByTime.getValue()){
					if(timeFree == null || timeFree.intValue() < 0 || timeBase == null || timeBase.doubleValue() <= 0){
						throw new Exception("参数错误");
					}
					
					fee.setFEE_TIME_FREE(timeFree.intValue());
					fee.setFEE_TIME_BASE(timeBase.doubleValue());
					fee.setUPT_TS(uptTs);
				}
			}
			
			if(visibleUids != null){
				visibleUids = visibleUids.trim();
				if(visibleUids.isEmpty()){
					visibleUids = null;
				}
			}
			
			s3rd.setTPS_BRIEF(brief);
			s3rd.setTPS_DESC(desc);
			s3rd.setUPT_TS(uptTs);
			s3rd.setTPS_VISIBLE_UIDS(visibleUids);
			
			this.thirdPartyService.update3rdService(
					s3rd, 
					ThirdPartyServiceStatus.Ok, 
					new String[]{"TPS_BRIEF", "TPS_DESC", "TPS_VISIBLE_UIDS"}, 
					new Object[]{s3rd.getTPS_BRIEF(), s3rd.getTPS_DESC(), s3rd.getTPS_VISIBLE_UIDS()});
			if(fee.getFEE_TP() != ThirdPartyServiceFeeType.Free.getValue()){
				this.thirdPartyService.update3rdServiceFee(fee, false);
			}
			
			ThirdPartyServiceInfo_mine mine = this.thirdPartyService.getMineService(uid, tpsId);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(mine), "更新成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
