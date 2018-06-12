package com.ckxh.cloud.platform.payCallBack;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.ckxh.cloud.base.daemon.ProtectDaemon;
import com.ckxh.cloud.base.iot.stream.VideoCloud;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.ResourceStatusGetter;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_RECHARGE;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.Metadata_with_CNM;
import com.ckxh.cloud.persistence.model.RechargeType;
import com.ckxh.cloud.persistence.model.ResourceStatus;
import com.ckxh.cloud.platform.api.websocket.QueueWebSocketHandler;

@Component
public class ResourceCB extends ProtectDaemon{
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ResourceStatusGetter resourceStatusGetter;
	
	@Override
	protected boolean done(Object data) {
		try{
			Object[] params = (Object[]) data;
			
			Long id = Long.parseLong((String) params[0]);
			boolean success = (boolean) params[1];
			String errMsg = (String) params[2];
			
			if(id != null){
				MAIN_USER_RECHARGE rec = this.userInfoService.updateOnResourceRechargeCallBack(id, success);
				
				String info = null;
				if(rec != null){
					try {
						RechargeType resTP = RechargeType.valueOf(rec.getRC_TYPE());
						ResourceStatus status = this.resourceStatusGetter.getStatus(resTP, rec.getU_ID());
						
						//clear resource out of fee notice status
						if(status != null){
							this.resetNoticeStatus(rec.getU_ID(), resTP, status);
						}
						
						info = MsgPackUtil.serialize2Str(status);
					} catch (Exception e) {
						e.printStackTrace();
					}
				}
				
				if(info != null){
					QueueWebSocketHandler.sendMessageToUser(id + "", JsonUtil.createSuccessJson(success, info, null, null));
				}else{
					QueueWebSocketHandler.sendMessageToUser(id + "", JsonUtil.createSuccessJson(success, null, errMsg, null));
				}
			}
			
			return true;
			
		}catch(Exception ex){
			LogUtil.error(ex);
			return false;
		}
	}
	
	@SuppressWarnings("unchecked")
	private void resetNoticeStatus(String uid, RechargeType resTP, ResourceStatus status){
		switch(resTP){
			case sms:
				//total < 0 means unlimited
				if(status.getTotal() >= 0 && status.getCurrent() < status.getTotal()){
					this.userInfoService.setOutOfMsgFeeNoticeStatus(uid, false);
					this.userInfoService.setSmsLimitedNoticeStatus(uid, status.getCurrent(), false);
				}
				
				break;
			case image:
				if(status.getTotal() >= 0 && status.getCurrent() < status.getTotal()){
					this.userInfoService.setImageFileLimitedNoticeStatus(uid, false);
				}
				
				break;
				
			case video:
				if(status.getTotal() > 0 && status.getCurrent() <= status.getTotal()){
					this.userInfoService.setVideoLimitedNoticeStatus(uid, false);
					
					List<Metadata_with_CNM> videoList = (List<Metadata_with_CNM>) status.getSizeObject();
					if(videoList != null && !videoList.isEmpty()){
						for(Metadata_with_CNM meta : videoList){
							VideoCloud.openStreamSoftly(VideoCloud.getStreamId(meta.getC_ID(), meta.getMETA_CID()));
						}
					}
				}
				
				break;
				
			default:
				break;
		}
	}
}
