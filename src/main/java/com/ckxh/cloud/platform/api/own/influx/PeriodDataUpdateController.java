package com.ckxh.cloud.platform.api.own.influx;

import java.sql.Timestamp;
import java.util.ArrayList;
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
import com.ckxh.cloud.base.model.LatestDataChangedItem;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.influx.InfluxClient;
import com.ckxh.cloud.persistence.model.InfluxRecord;
import com.fasterxml.jackson.core.type.TypeReference;

/**
 * this controller is using for authorization of sub user. 
 */
@Scope("singleton")
@Controller
@RequestMapping("/own/seriesUpdate/periodData")
public class PeriodDataUpdateController {
	@Autowired
	private InfluxClient influxClient;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private AcMq acMq;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.PUT)
	public String update(@RequestParam String clientId, @RequestParam String metaCId, @RequestParam String uptMap,
			HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0 || metaCId == null || metaCId.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, false)){
				throw new Exception("设备未授权");
			}
			
			//no record for update is allowed
			if(uptMap == null || uptMap.length() == 0){
				return JsonUtil.createSuccessJson(true, null, null, null);
			}
			
			List<InfluxRecord> points = new ArrayList<InfluxRecord>();
			Map<String, Double> map = MsgPackUtil.deserialize(uptMap, new TypeReference<Map<String, Double>>(){});
			List<LatestDataChangedItem> changedList = new ArrayList<LatestDataChangedItem>();
			
			if(!map.isEmpty()){
				Timestamp crtTs = DateUtil.getCurrentTS();
				for(String tm: map.keySet()){
					long ts = DateUtil.parseDate(tm.replace('/', '-')).getTime();
					
					if(!this.influxClient.exist(clientId, metaCId, ts)){
						throw new Exception("更新错误, 不存在时间点为[" + tm + "]的数据");
					}
					
					int version = this.influxClient.getAvailVersion(clientId, metaCId, ts);
					
					points.add(new InfluxRecord(clientId, metaCId, new Timestamp(ts), crtTs, version, false,  map.get(tm).doubleValue()));
					changedList.add(new LatestDataChangedItem(clientId, metaCId));
				}
			}
			
			if(!points.isEmpty()){
				this.influxClient.saveInflexDB(points);
				
				//wait for a little while to ensure the data was flushed.
				Thread.sleep(InfluxClient.flushDuration * 2);
			}
			
			return JsonUtil.createSuccessJson(true, null, null, null);
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String clientId, @RequestParam String metaCId, @RequestParam String addMap,
			HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0 || metaCId == null || metaCId.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, false)){
				throw new Exception("设备未授权");
			}
			
			//no record for add is allowed
			if(addMap == null || addMap.length() == 0){
				return JsonUtil.createSuccessJson(true, null, null, null);
			}
			
			List<InfluxRecord> points = new ArrayList<InfluxRecord>();
			Map<String, Double> map = MsgPackUtil.deserialize(addMap, new TypeReference<Map<String, Double>>(){});
			List<LatestDataChangedItem> changedList = new ArrayList<LatestDataChangedItem>();
			
			if(!map.isEmpty()){
				Timestamp crtTs = DateUtil.getCurrentTS();
				for(String tm: map.keySet()){
					long ts = DateUtil.parseDate(tm.replace('/', '-')).getTime();
					
					//we shoud not check the record exist or not. cause we may delete it first and then add another record with the save collectTs.
					int version = this.influxClient.getAvailVersion(clientId, metaCId, ts);
					
					if(version == 0){
						//set version to 1 if added manually
						version = 1;
					}
					
					points.add(new InfluxRecord(clientId, metaCId, new Timestamp(ts), crtTs, version, false,  map.get(tm).doubleValue()));
					changedList.add(new LatestDataChangedItem(clientId, metaCId));
				}
			}
			
			if(!points.isEmpty()){
				this.influxClient.saveInflexDB(points);
				
				//wait for a little while to ensure the data was flushed.
				Thread.sleep(InfluxClient.flushDuration * 2);
			}
			
			return JsonUtil.createSuccessJson(true, null, null, null);
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.DELETE)
	public String delete(@RequestParam String clientId, @RequestParam String metaCId, @RequestParam String delMap,
			HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0 || metaCId == null || metaCId.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, false)){
				throw new Exception("设备未授权");
			}
			
			//no record for delete is allowed
			if(delMap == null || delMap.length() == 0){
				return JsonUtil.createSuccessJson(true, null, null, null);
			}
			
			List<InfluxRecord> points = new ArrayList<InfluxRecord>();
			Map<String, Double> map = MsgPackUtil.deserialize(delMap, new TypeReference<Map<String, Double>>(){});
			List<LatestDataChangedItem> changedList = new ArrayList<LatestDataChangedItem>();
			
			if(!map.isEmpty()){
				Timestamp crtTs = DateUtil.getCurrentTS();
				for(String tm: map.keySet()){
					long ts = DateUtil.parseDate(tm.replace('/', '-')).getTime();
					
					if(!this.influxClient.exist(clientId, metaCId, ts)){
						throw new Exception("删除错误, 不存在时间点为[" + tm + "]的数据");
					}
					
					int version = this.influxClient.getAvailVersion(clientId, metaCId, ts);
					
					//deleted
					points.add(new InfluxRecord(clientId, metaCId, new Timestamp(ts), crtTs, version, true, map.get(tm).doubleValue()));
					changedList.add(new LatestDataChangedItem(clientId, metaCId));
				}
			}
			
			if(!points.isEmpty()){
				this.influxClient.saveInflexDB(points);
				
				//wait for a little while to ensure the data was flushed.
				Thread.sleep(InfluxClient.flushDuration * 2);
			}
			
			return JsonUtil.createSuccessJson(true, null, null, null);
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
