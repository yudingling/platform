package com.ckxh.cloud.platform.api.own.client;

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
import org.springframework.web.bind.annotation.ResponseBody;

import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.influx.InfluxClient;

@Scope("singleton")
@Controller
@RequestMapping("/own/client/normal/starList")
public class StarClientsController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private InfluxClient influxClient;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try {
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			List<IOT_CLIENT> list = this.clientInfoService.getStarClients(uid);
			Map<String, Long> tms = this.influxClient.getLatestTMFromRedis(list);
			Map<String, Long> tms2 = this.streamDataService.getLatestImageFileTs(list);
			
			if(tms2 != null && !tms2.isEmpty()){
				for(String key : tms2.keySet()){
					Long tmp = tms.get(key);
					Long tmp2 = tms2.get(key);
					if(tmp == null || tmp < tmp2){
						tms.put(key, tmp2);
					}
				}
			}
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			retMap.put("clients", list);
			retMap.put("latestTM", tms);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
		
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(),null);
		}
	}
}
