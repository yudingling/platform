package com.ckxh.cloud.platform.payCallBack;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.ckxh.cloud.base.daemon.ProtectDaemon;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.CacheChanger;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.platform.api.websocket.QueueWebSocketHandler;
import com.fasterxml.jackson.core.JsonProcessingException;

@Component
public class ThirdPartyServiceCB extends ProtectDaemon {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private CacheChanger cacheChanger;
	
	@Override
	protected boolean done(Object data) {
		try{
			Object[] params = (Object[]) data;
			
			Long id = Long.parseLong((String) params[0]);
			boolean success = (boolean) params[1];
			String errMsg = (String) params[2];
			
			if(id != null){
				double mspfRatio = Double.parseDouble(this.cacheChanger.getLocalValue(ConstString.DicKey_3rdRechargeRatioOnSuccess, "0"));
				
				Object feeSta = this.thirdPartyService.updateOn3rdRechargeCallBack(id, success, mspfRatio);
				
				String info = null;
				if(feeSta != null){
					try {
						info = MsgPackUtil.serialize2Str(feeSta);
					} catch (JsonProcessingException e) {
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
}
