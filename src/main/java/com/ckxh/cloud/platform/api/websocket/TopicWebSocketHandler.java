package com.ckxh.cloud.platform.api.websocket;

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
public class TopicWebSocketHandler extends TextWebSocketHandler implements IAcQueueReceived {
	@Autowired
	private AcTopicListenerContainer acTopicListenerContainer;
	@Autowired
	private AcMq acMq;
	
	private static AcMq acMq_s;
	//the webSocketMap only maintain online request
	private static Map<String, ConcurrentHashMap<String, WebSocketSession>> webSocketMap = new ConcurrentHashMap<String, ConcurrentHashMap<String, WebSocketSession>>();
	
	@PostConstruct
	private void init() {
		acMq_s = this.acMq;
		this.acTopicListenerContainer.CreateInstance(Common.uuid32(), ConstString.AcTopic_webSocketCallback_asTopic, this);
	}
	
	@Override
	public void OnAqReceived(Msg msg) {
		WebSocketCallbackMsg cbMsg = (WebSocketCallbackMsg) msg;
		
		sendMessageToUserInner(cbMsg.getCallBackId(), cbMsg.getCallBackMsg());
	}
	
	public static void sendMessageToUser(String id, String message) {
		acMq_s.sendTopic(new WebSocketCallbackMsg(id, message),  ConstString.AcTopic_webSocketCallback_asTopic);
	}
	
	private static void sendMessageToUserInner(String id, String message) {
		ConcurrentHashMap<String, WebSocketSession> map = webSocketMap.get(id);
		
		if(map != null && !map.isEmpty()){
			TextMessage msg = new TextMessage(message);
			
			map.values().parallelStream().forEach(session ->{
				try{
					if(session.isOpen()){
						session.sendMessage(msg);
					}
					
				}catch(Exception ex){
					LogUtil.error(ex);
				}
			});
		}
	}
	
	public void afterConnectionEstablished(WebSocketSession session) throws Exception {
		String id = (String) session.getAttributes().get(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			ConcurrentHashMap<String, WebSocketSession> map = webSocketMap.get(id);
			
			if(map == null){
				map = new ConcurrentHashMap<String, WebSocketSession>();
				
				ConcurrentHashMap<String, WebSocketSession> tmp = webSocketMap.putIfAbsent(id, map);
				if(tmp != null){
					map = tmp;
				}
			}
			
			map.put(session.getId(), session);
		}
	}

	@Override
	protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
	}
	
	@Override
	public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
		String id = (String)session.getAttributes().get(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			ConcurrentHashMap<String, WebSocketSession> map = webSocketMap.get(id);
			if(map != null){
				map.remove(session.getId());
			}
		}
		
		if(session.isOpen()) {
			session.close();
		}
	}

	@Override
	public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
		String id = (String)session.getAttributes().get(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			ConcurrentHashMap<String, WebSocketSession> map = webSocketMap.get(id);
			if(map != null){
				map.remove(session.getId());
			}
		}
	}
}
