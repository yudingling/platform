package com.ckxh.cloud.platform.api.websocket;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import com.ckxh.cloud.base.model.mqMsg.Msg;
import com.ckxh.cloud.base.model.mqMsg.WebSocketCallbackMsg;
import com.ckxh.cloud.base.mq.AcMq;
import com.ckxh.cloud.base.mq.AcTopicListenerContainer;
import com.ckxh.cloud.base.mq.IAcQueueReceived;
import com.ckxh.cloud.base.util.Common;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.LogUtil;

@Component
public class QueueWebSocketHandler extends TextWebSocketHandler implements IAcQueueReceived {
	@Autowired
	private AcTopicListenerContainer acTopicListenerContainer;
	@Autowired
	private AcMq acMq;
	
	private static AcMq acMq_s;
	//the webSocketMap only  maintain online request
	private static Map<String, WebSocketSession> webSocketMap = new ConcurrentHashMap<String, WebSocketSession>();
	
	@PostConstruct
	private void init() {
		acMq_s = this.acMq;
		this.acTopicListenerContainer.CreateInstance(Common.uuid32(), ConstString.AcTopic_webSocketCallback_asQueue, this);
	}
	
	@Override
	public void OnAqReceived(Msg msg) {
		WebSocketCallbackMsg cbMsg = (WebSocketCallbackMsg) msg;
		
		sendMessageToUserInner(cbMsg.getCallBackId(), cbMsg.getCallBackMsg());
	}
	
	public static void sendMessageToUser(String id, String message) {
		//web server may have multiple instances, we need to tell all the WebSocketHandlers to call back
		if(!sendMessageToUserInner(id, message)){
			acMq_s.sendTopic(new WebSocketCallbackMsg(id, message),  ConstString.AcTopic_webSocketCallback_asQueue);
		}
	}
	
	private static boolean sendMessageToUserInner(String id, String message) {
		WebSocketSession session = webSocketMap.get(id);
		if(session != null){
			if(session.isOpen()){
				try {
					session.sendMessage(new TextMessage(message));
				} catch (IOException e) {
					LogUtil.error(e);
				}
			}
			
			return true;
			
		}else{
			return false;
		}
	}

	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		Map<String, Object> attr = session.getAttributes();
		String id = (String) attr.get(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			webSocketMap.put(id, session);
		}
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	}
	
	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
		String id = (String)session.getAttributes().get(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			webSocketMap.remove(id);
			if(session.isOpen()) {
				session.close();
			}
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		String id = (String)session.getAttributes().get(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			webSocketMap.remove(id);
		}
	}
}
