package com.ckxh.cloud.platform.api.f3rd;

import java.sql.Timestamp;
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
import com.ckxh.cloud.persistence.model.VideoWatchUrl;
import com.ckxh.cloud.platform.model.f3rd.ImageDataItem;
import com.ckxh.cloud.platform.model.f3rd.PeriodDataItem;
import com.ckxh.cloud.platform.model.f3rd.TimeSeriesSearchParam;
import com.ckxh.cloud.platform.model.f3rd.TimeSeriesSearchRet;
import com.ckxh.cloud.platform.model.f3rd.VideoDataItem;
import com.fasterxml.jackson.core.type.TypeReference;

@Scope("singleton")
@Controller
@RequestMapping("/3rd/timeSeriesData")
public class TimeSeriesDataController {
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
	public String get(@RequestParam String clientsParam, @RequestParam String stm, @RequestParam String etm,
			HttpServletRequest request, HttpServletResponse response) {
		return this.act(clientsParam, stm, etm, request, response);
	}
	
	/**
	 * for long parameter (url length is limited)
	 */
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String clientsParam, @RequestParam String stm, @RequestParam String etm,
			HttpServletRequest request, HttpServletResponse response) {
		return this.act(clientsParam, stm, etm, request, response);
	}
	
	private String act(String clientsParam, String stm, String etm, HttpServletRequest request, HttpServletResponse response){
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
				retList.add(this.searchOne(item, stm, etm));
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private TimeSeriesSearchRet searchOne(TimeSeriesSearchParam param, String stm, String etm) throws Exception{
		Map<String, Object> retMap = new HashMap<String, Object>();
		
		if(!param.getMetaCIds().isEmpty()){
			ClientMetaDataMap metaMap = this.clientInfoService.getClientMetadataMap(param.getClientId());
			for(String metaCId : param.getMetaCIds()){
				IOT_METADATA mt = metaMap.getMetaCIdMap().get(metaCId);
				if(mt != null){
					Object objRet = null;
					if(this.streamDataService.isMetaImageType(mt.getSYSMETA_ID())){
						objRet = this.getImageData(param.getClientId(), mt.getMETA_ID(), stm, etm);
						
					}else if(this.streamDataService.isMetaVideoType(mt.getSYSMETA_ID())){
						objRet = this.getVideoData(param.getClientId(), metaCId);
						
					}else{
						objRet = this.getPeriodData(param.getClientId(), metaCId, stm, etm);
					}
					
					if(objRet != null){
						retMap.put(metaCId, objRet);
					}
				}
			}
		}
		
		return new TimeSeriesSearchRet(param.getClientId(), retMap);
	}
	
	private List<PeriodDataItem> getPeriodData(String clientId, String metaCId, String stm, String etm) throws Exception{
		if(stm == null || stm.length() == 0 || etm == null || etm.length() == 0){
			throw new Exception("参数错误");
		}
		
		long stmVal = Timestamp.valueOf(stm).getTime();
		long etmVal = Timestamp.valueOf(etm).getTime();
		
		List<List<Object>> ret = this.influxClient.query(clientId, metaCId, stmVal, etmVal);
		
		Object preKey = null;
		List<Object> chkRow = null;
		List<PeriodDataItem> handledList = new ArrayList<PeriodDataItem>();
		
		for(List<Object> row : ret){
			//fields of row: [time(utc time in string)、crtTs、version、deleted、val、collectTs]
            if(preKey == null || !preKey.equals(row.get(5))){
                preKey = row.get(5);
                if(chkRow != null){
                	this.dealRecord(chkRow, handledList);
                    chkRow = null;
                }
            }
            
            //retain the max versioned record to chkObj
            if(chkRow == null || InfluxClient.getIntValue(chkRow.get(2)) < InfluxClient.getIntValue(row.get(2))){
            	chkRow = row;
            }
		}
		
		if(chkRow != null){
            this.dealRecord(chkRow, handledList);
        }
		
		return handledList;
	}
	
	private void dealRecord(List<Object> row, List<PeriodDataItem> handledList){
		//deleted
        if(InfluxClient.getIntValue(row.get(3)) > 0){
            return;
        }
        
        handledList.add(new PeriodDataItem(InfluxClient.getlongValue(row.get(5)), row.get(4)));
	}
	
	private List<ImageDataItem> getImageData(String clientId, Long metaId, String stm, String etm) throws Exception{
		if(stm == null || stm.length() == 0 || etm == null || etm.length() == 0){
			throw new Exception("参数错误");
		}
		
		Timestamp stmVal = Timestamp.valueOf(stm);
		Timestamp etmVal = Timestamp.valueOf(etm);
		
		List<IOT_IMAGEFILE> images = this.streamDataService.getImageFileList(clientId, metaId, stmVal, etmVal);
		List<ImageDataItem> retList = new ArrayList<ImageDataItem>();
		
		for(IOT_IMAGEFILE item : images){
			retList.add(new ImageDataItem(item.getIF_COLTS(), ImageCloud.getIotImageDownLoadUrl(item.getIF_ID(), item.getIF_URL())));
		}
		
		return retList;
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
