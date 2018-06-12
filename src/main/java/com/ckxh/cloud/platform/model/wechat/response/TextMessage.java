package com.ckxh.cloud.platform.model.wechat.response;

public class TextMessage extends BaseMessage {
	private String Content;

	public String getContent() {
		return Content;
	}

	public void setContent(String content) {
		Content = content;
	}

	public TextMessage() {
		super();
	}

	public TextMessage(String content) {
		Content = content;
	}

}
