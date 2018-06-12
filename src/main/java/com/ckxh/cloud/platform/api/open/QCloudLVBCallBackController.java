package com.ckxh.cloud.platform.api.open;

import net.sf.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.iot.stream.VideoCloud;
import com.ckxh.cloud.base.model.VideoStatisticType;
import com.ckxh.cloud.base.model.mqMsg.VideoStatisticMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.platform.api.websocket.QueueWebSocketHandler;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Scope("singleton")
@Controller
@RequestMapping("/open/qcloud/lvb")
public class QCloudLVBCallBackController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private StreamDataService streamDataService;
	@Autowired
	private AcMq acMq;

	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String callback(@RequestBody JSONObject jsonObj, HttpServletRequest request, HttpServletResponse response) {
		try {
			if(jsonObj == null){			
				throw new Exception("参数错误");
			}
			
			Long t = jsonObj.getLong("t");
			String sign = jsonObj.getString("sign");
			int event_type = jsonObj.getInt("event_type");
			String stream_id = jsonObj.getString("stream_id");
			
			if (t == null || sign == null || sign.length() == 0 || stream_id == null || stream_id.length() == 0) {			
				throw new Exception("参数错误");
			}
			
			if(!VideoCloud.isCallBackSignLegal(sign, t.toString())){
				throw new Exception("参数错误");
			}
			
			//0: stream close, 1: stream open, 200: screenshot
			if(event_type == 0 || event_type == 1 || event_type == 200){
				Object[] tmpRet = this.getClientFormStreamId(stream_id);
				IOT_CLIENT cli = (IOT_CLIENT) tmpRet[0];
				String metaCId = (String) tmpRet[1];
				
				//here we should not check the metadata whether exist or its type is a video or not, cause we may modify it after the video is opened/closed
				
				if(event_type == 0 || event_type == 1){
					//send a statistics message
					VideoStatisticType vt = event_type == 0 ? VideoStatisticType.Offline : VideoStatisticType.Online;
					VideoStatisticMsg msg = new VideoStatisticMsg(cli.getC_OWNER_UID(), cli.getC_ID(), null, vt, metaCId, null);
					
					this.acMq.sendQueue(msg, ConstString.AcQueue_videoStatistic);
					
					if(event_type == 0){
						this.streamDataService.removeVideoWatchUrl(cli.getC_ID(), metaCId);
					}else{
						this.streamDataService.addVideoWatchUrl(null, cli.getC_ID(), metaCId, stream_id);
					}
					
					//notice the webSocket to change the watching status
					QueueWebSocketHandler.sendMessageToUser(this.streamDataService.serialWebSocketCallBackId(cli.getC_ID(), metaCId), "");
					
				}else{
					String picUrl = request.getParameter("pic_url");
					if(picUrl != null && !picUrl.isEmpty()){
						this.streamDataService.addVideoScreenshot(stream_id, picUrl);
					}
				}
			}
			
			//send the right response to qcloud server
			return "{\"code\":0}";
			
		} catch (Exception e) {
			e.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, e.getMessage(), null);
		}
	}
	
	private Object[] getClientFormStreamId(String streamId) throws Exception{
		String[] cidAndMetaCId = VideoCloud.getClientIdAndMetaCIdFromStreamId(streamId);
		
		String clientId = cidAndMetaCId[0];
		String meataCId = cidAndMetaCId[1];
		
		IOT_CLIENT cli = this.clientInfoService.getClient(clientId);
		if(cli == null){
			throw new Exception("参数错误");
		}
		
		return new Object[]{cli, meataCId};
	}
}
