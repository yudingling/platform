package com.ckxh.cloud.platform.api.own.user;

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
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.ResourceStatusGetter;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyPushService;
import com.ckxh.cloud.persistence.model.RechargeType;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/resourceStatus/sms")
public class ResourceStatus_SmsController {
	@Autowired
	private ThirdPartyPushService thirdPartyPushService;
	@Autowired
	private ResourceStatusGetter resourceStatusGetter;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			
			retMap.put("status", this.resourceStatusGetter.getStatus(RechargeType.sms, uid));
			
			//sending statistic in 30 days
			Date etm = DateUtil.StringToDateTime(DateUtil.convertDateToString(DateUtil.add(new Date(), Calendar.DAY_OF_MONTH, 1), DateUtil.Date_YMD) + " 00:00:00");
			Date stm = DateUtil.add(etm, Calendar.DAY_OF_MONTH, -30);
			Timestamp etm_ts = new Timestamp(etm.getTime());
			Timestamp stm_ts = new Timestamp(stm.getTime());
			
			Map<String, Long> statistic = this.thirdPartyPushService.getDailyStatisticOfMsg(uid, stm_ts, etm_ts);
			
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
