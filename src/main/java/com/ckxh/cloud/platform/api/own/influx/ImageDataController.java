package com.ckxh.cloud.platform.api.own.influx;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
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
import com.ckxh.cloud.base.util.DateUtil;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_IMAGEFILE;
import com.ckxh.cloud.platform.model.IotImageInfo;

@Scope("singleton")
@Controller
@RequestMapping("/own/series/imageData")
public class ImageDataController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public String get(@RequestParam String clientId, @RequestParam Long metaId, @RequestParam String stm, @RequestParam String etm, 
			HttpServletRequest request, HttpServletResponse response){
		try {
			if(clientId == null || clientId.length() == 0 || metaId == null){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			if(!this.clientInfoService.clientAuthority(clientId, uid, true)){
				throw new Exception("设备未授权访问");
			}
			
			//if etm is null, default etm is current time
			Timestamp etmTs = (etm == null || etm.length() == 0)? DateUtil.getCurrentTS() : Timestamp.valueOf(etm);
			//if stm is null, default period is 1 day
			Timestamp stmVal = (stm == null || stm.length() == 0)? new Timestamp(DateUtil.add(etmTs, Calendar.DAY_OF_MONTH, -1).getTime()) : Timestamp.valueOf(stm);
			
			List<IOT_IMAGEFILE> images = this.streamDataService.getImageFileList(clientId, metaId, stmVal, etmTs);
			List<IotImageInfo> retList = new ArrayList<IotImageInfo>();
			
			for(IOT_IMAGEFILE item : images){
				retList.add(new IotImageInfo(item.getIF_ID(), item.getIF_COLTS(), item.getCRT_TS(), ImageCloud.getIotImageDownLoadUrl(item.getIF_ID(), item.getIF_URL())));
			}
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retList), null, null);
			
		}catch(Exception e){
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
}
