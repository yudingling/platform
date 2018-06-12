package com.ckxh.cloud.platform.api.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer{

	/**
	 * There is dedicated WebSocket java-config support for mapping the WebSockethandler to a specific URL.
	 * todo. mapping urls  may extend in further
	 */
	@Override
	public void registerWebSocketHandlers(WebSocketHandlerRegistry registry){
		registry.addHandler(this.createQueueHandler(), "/platformWs/queue/camera/websocket.ws", "/platformWs/queue/3rdService/websocket.ws", "/platformWs/queue/3rdServiceReliable/websocket.ws", "/platformWs/queue/resource/websocket.ws")
			.addInterceptors(new HandshakeInterceptor());
		//enable client support SockJS
		registry.addHandler(this.createQueueHandler(), "/platformWs/queue/camera/sockjs.ws", "/platformWs/queue/3rdService/sockjs.ws", "/platformWs/queue/3rdServiceReliable/sockjs.ws", "/platformWs/queue/resource/sockjs.ws")
			.addInterceptors(new HandshakeInterceptor()).withSockJS();
		
		registry.addHandler(this.createTopicHandler(), "/platformWs/topic/maint/websocket.ws")
			.addInterceptors(new HandshakeInterceptor());
		registry.addHandler(this.createTopicHandler(), "/platformWs/topic/maint/sockjs.ws")
			.addInterceptors(new HandshakeInterceptor()).withSockJS();
	}
	
	@Bean
	public TextWebSocketHandler createQueueHandler(){
		return new QueueWebSocketHandler();
	}
	
	@Bean
	public TextWebSocketHandler createTopicHandler(){
		return new TopicWebSocketHandler();
	}
}
