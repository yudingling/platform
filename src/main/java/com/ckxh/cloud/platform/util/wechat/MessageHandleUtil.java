package com.ckxh.cloud.platform.util.wechat;

import java.util.Date;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.platform.model.wechat.response.*;

public class MessageHandleUtil {

	@SuppressWarnings("unused")
	public static String processRequest(HttpServletRequest request) {

		String respXml = null;
		String respContent = "unknown message type";
		try {
			Map<String, String> requestMap = MessageUtil.parseXml(request);
			String fromUserName = requestMap.get("FromUserName");
			String toUserName = requestMap.get("ToUserName");
			String msgType = requestMap.get("MsgType");

			if(msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_TEXT)) {

			}else if (msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_IMAGE)) {

			}else if (msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_VOICE)) {

			}else if (msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_VIDEO)) {

			}else if (msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_LOCATION)) {

			}else if (msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_LINK)) {

			}else if (msgType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_EVENT)) {
				String eventType = requestMap.get("Event");

				if (eventType.equals(WeChatConstString.WeChat_EVENT_TYPE_SUBSCRIBE)) {
					TextMessage textMessage = new TextMessage();
					textMessage.setFromUserName(toUserName);
					textMessage.setToUserName(fromUserName);
					textMessage.setMsgType(WeChatConstString.WeChat_RESP_MESSAGE_TYPE_TEXT);
					textMessage.setCreateTime(new Date().getTime());
					respContent = "welcome";
					textMessage.setContent(respContent);
					respXml = MessageUtil.messageToXml(textMessage);
				}else if (eventType.equals(WeChatConstString.WeChat_EVENT_TYPE_UNSUBSCRIBE)) {

				}else if (eventType.equals(WeChatConstString.WeChat_EVENT_TYPE_SCAN)) {

				}else if (eventType.equals(WeChatConstString.WeChat_REQ_MESSAGE_TYPE_LOCATION)) {

				}else if (eventType.equals(WeChatConstString.WeChat_EVENT_TYPE_CLICK)) {

					String eventKey = requestMap.get("EventKey");
				}
			}
		} catch (Exception e) {
			LogUtil.error(e);
		}
		return respXml;
	}
}
