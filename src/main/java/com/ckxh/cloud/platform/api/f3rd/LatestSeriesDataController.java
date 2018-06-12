package com.ckxh.cloud.platform.api.f3rd;

import java.util.ArrayList;
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
import com.ckxh.cloud.base.iot.stream.ImageCloud;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.f3rd.service.ClientInfo3rdService;
import com.ckxh.cloud.persistence.db.model.IOT_IMAGEFILE;
import com.ckxh.cloud.persistence.db.model.IOT_METADATA;
import com.ckxh.cloud.persistence.influx.InfluxClient;
import com.ckxh.cloud.persistence.model.ClientMetaDataMap;
import com.ckxh.cloud.persistence.model.InfluxRecord;
import com.ckxh.cloud.persistence.model.VideoWatchUrl;
import com.ckxh.cloud.platform.model.f3rd.ImageDataItem;
import com.ckxh.cloud.platform.model.f3rd.PeriodDataItem;
import com.ckxh.cloud.platform.model.f3rd.TimeSeriesSearchParam;
import com.ckxh.cloud.platform.model.f3rd.TimeSeriesSearchRet;
import com.ckxh.cloud.platform.model.f3rd.VideoDataItem;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/3rd/latestSeriesData")
public class LatestSeriesDataController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private ClientInfo3rdService clientInfo3rdService;
	@Autowired
	private InfluxClient influxClient;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String clientsParam, HttpServletRequest request, HttpServletResponse response) {
		return this.act(clientsParam, request, response);
	}
	
	/**
	 * for long parameter (url length is limited)
	 */
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String clientsParam, HttpServletRequest request, HttpServletResponse response) {
		return this.act(clientsParam, request, response);
	}
	
	private String act(String clientsParam, HttpServletRequest request, HttpServletResponse response){
		try {
			String uid = (String) request.getAttribute(ConstString.RequestAttr_uid);
			if (uid == null) {
				throw new Exception("用户未授权");
			}
			
			if(clientsParam == null || clientsParam.length() == 0){
				throw new Exception("参数错误");
			}
			
			List<TimeSeriesSearchParam> param = MsgPackUtil.deserialize(clientsParam, new TypeReference<List<TimeSeriesSearchParam>>(){});
			if(param.isEmpty()){
				throw new Exception("参数错误");
			}
			
			List<String> clientIds = new ArrayList<String>();
			for(TimeSeriesSearchParam item : param){
				clientIds.add(item.getClientId());
			}
			
			if(!this.clientInfo3rdService.clientAuthority(clientIds, uid)){
				throw new Exception("设备未授权访问");
			}
			
			List<TimeSeriesSearchRet> retList = new ArrayList<TimeSeriesSearchRet>();
			for(TimeSeriesSearchParam item : param){
				retList.add(this.searchOne(item));
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private TimeSeriesSearchRet searchOne(TimeSeriesSearchParam param) throws Exception{
		Map<String, Object> retMap = new HashMap<String, Object>();
		
		if(!param.getMetaCIds().isEmpty()){
			ClientMetaDataMap metaMap = this.clientInfoService.getClientMetadataMap(param.getClientId());
			for(String metaCId : param.getMetaCIds()){
				IOT_METADATA mt = metaMap.getMetaCIdMap().get(metaCId);
				if(mt != null){
					Object objRet = null;
					if(this.streamDataService.isMetaImageType(mt.getSYSMETA_ID())){
						objRet = this.getImageData(param.getClientId(), mt.getMETA_ID(), mt.getMETA_CID());
						
					}else if(this.streamDataService.isMetaVideoType(mt.getSYSMETA_ID())){
						objRet = this.getVideoData(param.getClientId(), metaCId);
						
					}else{
						objRet = this.getPeriodData(param.getClientId(), metaCId);
					}
					
					if(objRet != null){
						retMap.put(metaCId, objRet);
					}
				}
			}
		}
		
		return new TimeSeriesSearchRet(param.getClientId(), retMap);
	}
	
	private PeriodDataItem getPeriodData(String clientId, String metaCId) throws Exception{
		InfluxRecord rec = this.influxClient.getLatestDataFromRedis(clientId, metaCId);
		if(rec != null){
			return new PeriodDataItem(rec.getCollectTs().getTime(), rec.getVal());
		}else{
			return null;
		}
	}
	
	private ImageDataItem getImageData(String clientId, Long metaId, String metaCId) throws Exception{
		IOT_IMAGEFILE file = this.streamDataService.getLatestImageFile(clientId, metaId, metaCId);
		if(file != null){
			return new ImageDataItem(file.getIF_COLTS(), ImageCloud.getIotImageDownLoadUrl(file.getIF_ID(), file.getIF_URL()));
			
		}else{
			return null;
		}
	}
	
	private VideoDataItem getVideoData(String clientId, String metaCId){
		VideoDataItem ret = new VideoDataItem();
		
		VideoWatchUrl url = this.streamDataService.getVideoWathUrl(clientId, metaCId);
		if(url != null){
			ret.setUrl(url.getUrl());
			ret.setMobileUrl(url.getMobileUrl());
			ret.setTm(url.getCrtTs());
		}
		
		String screenshot = this.streamDataService.getVideoScreenshot(clientId, metaCId);
		if(screenshot != null){
			ret.setScreenshot(screenshot);
		}
		
		return ret;
	}
}
