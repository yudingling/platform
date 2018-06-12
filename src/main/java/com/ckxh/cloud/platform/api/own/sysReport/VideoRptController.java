package com.ckxh.cloud.platform.api.own.sysReport;

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
import com.ckxh.cloud.persistence.model.PayResultType;
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.persistence.model.VideoRptItem;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysReport/videoRpt")
public class VideoRptController {
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
			
			Map<String, Object> statusMap = new HashMap<String, Object>();
			statusMap.put("videoCount", this.sysReportService.getVideoCount());
			double[] rechargeArr = this.sysReportService.getUserRechargeStatistic(RechargeType.video, PayResultType.success);
			statusMap.put("purchaseCount", rechargeArr[0]);
			statusMap.put("purchaseFee", rechargeArr[1]);
			retMap.put("status", statusMap);
			
			List<VideoRptItem> statistic = this.sysReportService.getVideoStatistic(topSize);
			retMap.put("statistic", statistic);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
