package com.ckxh.cloud.platform.api.open;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.iot.stream.VideoCloud;
import com.ckxh.cloud.base.model.VideoStatisticType;
import com.ckxh.cloud.base.model.mqMsg.VideoStatisticMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.platform.api.websocket.QueueWebSocketHandler;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@Scope("singleton")
@Controller
@RequestMapping("/open/aliyun/lvb")
public class AliCloudLVBCallBackController {
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private StreamDataService streamDataService;
	@Autowired
	private AcMq acMq;

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET)
	public void callback(@RequestParam Long time, @RequestParam String action, @RequestParam String appname, @RequestParam String id, @RequestParam(required = false) String usrargs,
			HttpServletRequest request, HttpServletResponse response) {
		//ignore. ip address rang too large, without practical concern.
		//callback of aliyun lvb doesn't have any authentication, simply check the ip address. (140.205.*.* is aliyun, hangzhou)
		/*String ip = Common.getRealIpAddress(request);
		if(ip == null || !ip.startsWith("140.205")){
			return;
		}*/
		
		boolean legal = false;
		try {
			if(time == null || action == null || action.length() == 0 || appname == null || appname.length() == 0 || id == null || id.length() == 0){			
				throw new Exception("参数错误");
			}
			
			legal = VideoCloud.isCallBackSignLegal(null, time.toString());
			if(!legal){
				throw new Exception("参数错误");
			}
			
			//publish: stream open, publish_done: stream close
			if(action.equals("publish") || action.equals("publish_done")){
				Object[] tmpRet = this.getClientFormStreamId(id);
				IOT_CLIENT cli = (IOT_CLIENT) tmpRet[0];
				String metaCId = (String) tmpRet[1];
				
				//here we should not check the metadata whether exist or its type is a video or not, cause we may modify it after the video is opened/closed
				
				//send a statistics message
				String domain = this.getDomain(usrargs);
				VideoStatisticType vt = action.equals("publish_done") ? VideoStatisticType.Offline : VideoStatisticType.Online;
				VideoStatisticMsg msg = new VideoStatisticMsg(cli.getC_OWNER_UID(), cli.getC_ID(), domain, vt, metaCId, null);
				
				this.acMq.sendQueue(msg, ConstString.AcQueue_videoStatistic);
				
				if(action.equals("publish_done")){
					this.streamDataService.removeVideoWatchUrl(cli.getC_ID(), metaCId);
				}else{
					this.streamDataService.addVideoWatchUrl(domain, cli.getC_ID(), metaCId, id);
					
					//we have set the screenshot option to true, so the live stream always get a screenshot.
					/*String picUrl = ImageCloud.getScreenshotUrl(id);
					if(picUrl != null){
						this.streamDataService.addVideoScreenshot(id, picUrl);
					}*/
				}
				
				//notice the webSocket to change the watching status
				QueueWebSocketHandler.sendMessageToUser(this.streamDataService.serialWebSocketCallBackId(cli.getC_ID(), metaCId), "");
			}
			
		} catch (Exception e) {
			e.printStackTrace();
		}
		
		response.setStatus(HttpServletResponse.SC_OK);
	}
	
	private String getDomain(String usrargs){
		if(usrargs == null || usrargs.length() == 0){
			return null;
		}
		
		String[] tmpArr = usrargs.split("\\?|&");
		for(String tmp : tmpArr){
			String[] paramArr = tmp.split("=");
			if(paramArr.length == 2 && paramArr[0].equals("vhost")){
				return paramArr[1];
			}
		}
		
		return null;
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
