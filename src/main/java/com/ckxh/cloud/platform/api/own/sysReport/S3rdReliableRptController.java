package com.ckxh.cloud.platform.api.own.sysReport;

import java.sql.Timestamp;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
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
import com.ckxh.cloud.persistence.model.PayResultType;

@Scope("singleton")
@Controller
@RequestMapping("/own/sysReport/s3rdReliableRpt")
public class S3rdReliableRptController {
	@Autowired
	private SysReportService sysReportService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String selTp, @RequestParam int tmLen, HttpServletRequest request, HttpServletResponse response){
		try{
			if(selTp == null || selTp.length() == 0 || tmLen <= 0){
				throw new Exception("参数错误");
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			
			Map<String, Object> statusMap = new HashMap<String, Object>();
			statusMap.put("reliableAmount", this.sysReportService.getThirdPartyServiceReliableAmount(PayResultType.success));
			retMap.put("status", statusMap);
			
			Date stm, etm;
			if(selTp.equals("month")){
				etm = DateUtil.StringToDateTime(DateUtil.convertDateToString(DateUtil.add(new Date(), Calendar.MONTH, 1), "yyyy-MM-01 00:00:00"));
				stm = DateUtil.add(etm, Calendar.MONTH, -1 * tmLen);
			}else{
				etm = DateUtil.StringToDateTime(DateUtil.convertDateToString(DateUtil.add(new Date(), Calendar.DAY_OF_MONTH, 1), "yyyy-MM-dd 00:00:00"));
				stm = DateUtil.add(etm, Calendar.DAY_OF_MONTH, -1 * tmLen);
			}
			
			Timestamp etm_ts = new Timestamp(etm.getTime());
			Timestamp stm_ts = new Timestamp(stm.getTime());
			
			Map<String, Double> statistic = this.sysReportService.getThirdPartyServiceReliableStatistic(stm_ts, etm_ts, selTp);
			
			retMap.put("statistic", statistic);
			retMap.put("stm", stm_ts);
			retMap.put("etm", etm_ts);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
