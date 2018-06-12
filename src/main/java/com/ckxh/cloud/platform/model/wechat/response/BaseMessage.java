package com.ckxh.cloud.platform.model.wechat.response;

public class BaseMessage {
	private String ToUserName;
	private String FromUserName;
	private long CreateTime;
	private String MsgType;

	public String getMsgType() {
		return MsgType;
	}

	public void setMsgType(String msgType) {
		MsgType = msgType;
	}

	public long getCreateTime() {

		return CreateTime;
	}

	public void setCreateTime(long createTime) {
		CreateTime = createTime;
	}

	public String getFromUserName() {

		return FromUserName;
	}

	public void setFromUserName(String fromUserName) {
		FromUserName = fromUserName;
	}

	public String getToUserName() {

		return ToUserName;
	}

	public void setToUserName(String toUserName) {
		ToUserName = toUserName;
	}

	public BaseMessage() {
		super();
	}

	public BaseMessage(String toUserName, String fromUserName, long createTime, String msgType) {
		ToUserName = toUserName;
		FromUserName = fromUserName;
		CreateTime = createTime;
		MsgType = msgType;
	}

}
