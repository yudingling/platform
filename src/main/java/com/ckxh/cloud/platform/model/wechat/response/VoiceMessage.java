package com.ckxh.cloud.platform.model.wechat.response;

public class VoiceMessage extends BaseMessage {
	private Voice Voice;

	public Voice getVoice() {
		return Voice;
	}

	public void setVoice(Voice voice) {
		Voice = voice;
	}

	public VoiceMessage() {
		super();
	}

	public VoiceMessage(com.ckxh.cloud.platform.model.wechat.response.Voice voice) {
		Voice = voice;
	}

}
