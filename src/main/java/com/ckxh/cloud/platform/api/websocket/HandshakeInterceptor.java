package com.ckxh.cloud.platform.api.websocket;

import java.util.Map;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.HttpSessionHandshakeInterceptor;

import com.ckxh.cloud.base.util.ConstString;

@Component
public class HandshakeInterceptor extends HttpSessionHandshakeInterceptor {

	@Override
	public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler handle,Map<String, Object> attr) throws Exception {
		
		ServletServerHttpRequest req = (ServletServerHttpRequest) request;
		String id = req.getServletRequest().getParameter(ConstString.WebSocketParam_id);
		if(id != null && id.length() > 0){
			attr.put(ConstString.WebSocketParam_id, id);
		}

		// this map will be a part of WebSocketSession
		return super.beforeHandshake(request, response, handle, attr);
	}

	@Override
	public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response, WebSocketHandler wsHandler,Exception ex) {
		// TODO Auto-generated method stub
		
		super.afterHandshake(request, response, wsHandler, ex);
	}
}
