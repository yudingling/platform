package com.ckxh.cloud.platform.api.own.sysReport;

import java.sql.Timestamp;
import java.util.Calendar;
import java.util.Date;
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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.sys.service.SysReportService;
import com.ckxh.cloud.persistence.model.ThirdPartyServiceProfitRptItem;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysReport/s3rdProfitRpt")
public class S3rdProfitRptController {
	@Autowired
	private SysReportService sysReportService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam int topSize, @RequestParam int tmLen, HttpServletRequest request, HttpServletResponse response){
		try{
			if(topSize <= 0 || tmLen <= 0){
				throw new Exception("参数错误");
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			
			Map<String, Object> statusMap = new HashMap<String, Object>();
			statusMap.put("profitAmount", this.sysReportService.getThirdPartyServiceProfitAmount());
			retMap.put("status", statusMap);
			
			Date etm = DateUtil.StringToDateTime(DateUtil.convertDateToString(DateUtil.add(new Date(), Calendar.DAY_OF_MONTH, 1), "yyyy-MM-dd 00:00:00"));
			Date stm = DateUtil.add(etm, Calendar.DAY_OF_MONTH, -1 * tmLen);
			
			Timestamp etm_ts = new Timestamp(etm.getTime());
			Timestamp stm_ts = new Timestamp(stm.getTime());
			
			List<ThirdPartyServiceProfitRptItem> statistic = this.sysReportService.getThirdPartyServiceProfitStatistic(stm_ts, etm_ts, topSize);
			retMap.put("statistic", statistic);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
