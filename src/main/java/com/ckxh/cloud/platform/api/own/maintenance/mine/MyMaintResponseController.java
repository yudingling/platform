package com.ckxh.cloud.platform.api.own.maintenance.mine;

import java.util.HashMap;
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
import com.ckxh.cloud.base.iot.stream.ImageCloud;
import com.ckxh.cloud.base.model.ImgUploadHttpInfo;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.model.MaintRecordResponse;

@Scope("singleton")
@Controller
@RequestMapping("/own/myMaint/response")
@AuthPathOnBind("get:/platformApi/own/myMaint/normal/#")
public class MyMaintResponseController {
	@Autowired
	private MaintenanceService maintenanceService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam int imgSize, HttpServletRequest request, HttpServletResponse response){
		try{
			if(imgSize <= 0){
				throw new Exception("参数错误");
			}
			
			List<Long> uuids = SysTool.longUuid(imgSize);
			
			//the upload authentication can be used for many times until expiration. we only create once.
			ImgUploadHttpInfo info = ImageCloud.getMaintResponseImageUploadUrl(uuids.get(0), 300);
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("auth", info);
			retMap.put("fileIds", uuids);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam Long maintId, @RequestParam String content, @RequestParam(required = false) String imgIds, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(maintId == null || content == null || content.length() <= 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.maintenanceService.isResponsableForMaintRecord(uid, maintId)){
				throw new Exception("参数错误");
			}
			
			if(imgIds != null && imgIds.length() == 0){
				imgIds = null;
			}
			
			MaintRecordResponse resp = this.maintenanceService.saveMaintenanceResponse(maintId, content, imgIds);
			if(resp != null){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(resp), "保存成功", null);
				
			}else{
				return JsonUtil.createSuccessJson(false, null, "保存失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
