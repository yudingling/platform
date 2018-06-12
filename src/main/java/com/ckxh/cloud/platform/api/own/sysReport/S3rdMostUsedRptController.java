package com.ckxh.cloud.platform.api.own.sysReport;

import java.text.SimpleDateFormat;
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

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.sys.service.SysReportService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceRateRptItem;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysReport/s3rdMostUsedRpt")
public class S3rdMostUsedRptController {
	@Autowired
	private SysReportService sysReportService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam int topSize, HttpServletRequest request, HttpServletResponse response){
		try{
			if(topSize <= 0){
				throw new Exception("参数错误");
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			
			List<ThirdPartyServiceRateRptItem> statistic = this.sysReportService.getThirdPartyServiceMostUsedStatistic(topSize);
			retMap.put("statistic", statistic);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap, new SimpleDateFormat("yyyy/MM/dd")), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
