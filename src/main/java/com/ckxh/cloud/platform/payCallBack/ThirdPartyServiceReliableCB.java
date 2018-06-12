package com.ckxh.cloud.platform.payCallBack;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.ckxh.cloud.base.daemon.ProtectDaemon;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.platform.api.websocket.QueueWebSocketHandler;

@Component
public class ThirdPartyServiceReliableCB extends ProtectDaemon{
	@Autowired
	private ThirdPartyService thirdPartyService;
	
	@Override
	protected boolean done(Object data) {
		try{
			Object[] params = (Object[]) data;
			
			Long id = Long.parseLong((String) params[0]);
			boolean success = (boolean) params[1];
			String errMsg = (String) params[2];
			
			if(id != null){
				Long tpsId = this.thirdPartyService.updateOn3rdReliableRechargeCallBack(id, success);
				
				if(tpsId != null){
					QueueWebSocketHandler.sendMessageToUser(id + "", JsonUtil.createSuccessJson(success, tpsId + "", null, null));
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
}
