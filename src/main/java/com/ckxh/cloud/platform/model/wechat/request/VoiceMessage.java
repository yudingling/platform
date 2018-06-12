package com.ckxh.cloud.platform.model.wechat.request;

public class VoiceMessage extends BaseMessage {

	private String MediaId;
	private String Format;
	private String Recognition;

	public String getRecognition() {
		return Recognition;
	}

	public void setRecognition(String recognition) {
		Recognition = recognition;
	}

	public String getFormat() {

		return Format;
	}

	public void setFormat(String format) {
		Format = format;
	}

	public String getMediaId() {

		return MediaId;
	}

	public void setMediaId(String mediaId) {
		MediaId = mediaId;
	}

	public VoiceMessage() {
		super();
	}

	public VoiceMessage(String mediaId, String format, String recognition) {
		MediaId = mediaId;
		Format = format;
		Recognition = recognition;
	}

}
