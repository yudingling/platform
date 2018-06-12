package com.ckxh.cloud.platform.api.own.user.mobile;

import java.util.ArrayList;
import java.util.LinkedHashMap;
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
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.influx.InfluxClient;
import com.ckxh.cloud.platform.model.UserOpenInfo;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/mobile/userOpenInfo")
public class UserOpenInfo_MobileController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private InfluxClient influxClient;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(@RequestParam String uid, HttpServletRequest request, HttpServletResponse response){
		try{
			if(uid == null || uid.isEmpty()){
				throw new Exception("参数错误");
			}
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			if(user == null){
				throw new Exception("参数错误");
			}
			
			//1. userInfo
			UserOpenInfo openInfo = new UserOpenInfo();
			openInfo.setU_ID(user.getU_ID());
			openInfo.setU_NM(user.getU_NM());
			openInfo.setU_ICON(user.getU_ICON());
			openInfo.setCRT_TS(user.getCRT_TS());
			
			//2. public clients
			Map<String, String> publicCliMap = new LinkedHashMap<String, String>();
			
			List<IOT_CLIENT> publicList = new ArrayList<IOT_CLIENT>();
			List<IOT_CLIENT> allClis = this.clientInfoService.getMyClients(user.getU_ID(), null, false);
			for(IOT_CLIENT cli : allClis){
				if(cli.getC_PUBLIC() != 0){
					publicCliMap.put(cli.getC_ID(), cli.getC_NM());
					publicList.add(cli);
				}
			}
			openInfo.setPublicClients(publicCliMap);
			
			//3. latest data time
			Map<String, Long> tms = this.influxClient.getLatestTMFromRedis(publicList);
			Map<String, Long> tms2 = this.streamDataService.getLatestImageFileTs(publicList);
			
			if(tms2 != null && !tms2.isEmpty()){
				for(String key : tms2.keySet()){
					Long tmp = tms.get(key);
					Long tmp2 = tms2.get(key);
					if(tmp == null || tmp < tmp2){
						tms.put(key, tmp2);
					}
				}
			}
			openInfo.setLatestTs(tms);
			
			//4.star ids
			List<String> starIds = this.clientInfoService.getStarClients(uid, null);
			openInfo.setStars(starIds);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(openInfo), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
