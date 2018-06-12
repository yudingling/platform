package com.ckxh.cloud.platform.api.own.maintenance;

import java.util.List;

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
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_MAINTENANCE_AREA;
import com.ckxh.cloud.persistence.db.sys.service.DataGroupService;
import com.ckxh.cloud.persistence.db.sys.service.MaintenanceService;
import com.ckxh.cloud.persistence.model.ClientTreeNode;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/own/maint/normal/area")
@AuthPathOnBind("get:/platformApi/own/maint/normal/#")
public class AreaController {
	@Autowired
	private MaintenanceService maintenanceService;
	@Autowired
	private DataGroupService dataGroupService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.PUT)
	public String put(@RequestParam Long gpId, @RequestParam String maName, @RequestParam String maKey, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(gpId == null || maKey == null || maKey.length() == 0 || maName == null || maName.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_MAINTENANCE_AREA area = this.maintenanceService.getArea(uid, gpId);
			if(area == null){
				throw new Exception("参数错误");
			}
			
			if(!maKey.equals(area.getMA_KEY()) && this.maintenanceService.isAreaExist(uid, maKey)){
				throw new Exception("区域标识已经存在");
			}
			
			boolean ret = this.maintenanceService.updateArea(uid, gpId, maName, maKey);
			
			return JsonUtil.createSuccessJson(ret, null, ret ? "更新成功" : "更新失败", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.POST)
	public String post(@RequestParam(required = false) Long parentGpId, @RequestParam String maName, @RequestParam String maKey, 
			HttpServletRequest request, HttpServletResponse response){
		try{
			if(maKey == null || maKey.length() == 0 || maName == null || maName.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(this.maintenanceService.isAreaExist(uid, maKey)){
				throw new Exception("区域标识已经存在");
			}
			
			ClientTreeNode node = this.maintenanceService.createArea(uid, maName, maKey, parentGpId);
			if(node != null){
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(node), "创建区域成功", null);
			}else{
				return JsonUtil.createSuccessJson(false, null, "创建区域失败", null);
			}
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.DELETE)
	public String delete(@RequestParam String areas, HttpServletRequest request, HttpServletResponse response){
		try{
			if(areas == null || areas.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<Long> gpIdList =  MsgPackUtil.deserialize(areas, new TypeReference<List<Long>>(){});
			if(gpIdList.isEmpty()){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			this.maintenanceService.deleteAreas(gpIdList, uid);
			
			List<Long> idList = this.maintenanceService.getAreaGpIds(uid);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(idList), "删除成功", null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
