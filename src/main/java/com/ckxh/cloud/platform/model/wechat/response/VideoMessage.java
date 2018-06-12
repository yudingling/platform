package com.ckxh.cloud.platform.model.wechat.response;

public class VideoMessage extends BaseMessage {

	private Video Video;

	public Video getVideo() {
		return Video;
	}

	public void setVideo(Video video) {
		Video = video;
	}

	public VideoMessage() {
		super();
	}

	public VideoMessage(com.ckxh.cloud.platform.model.wechat.response.Video video) {
		Video = video;
	}

}
