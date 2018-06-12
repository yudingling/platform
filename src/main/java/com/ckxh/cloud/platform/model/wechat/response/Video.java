package com.ckxh.cloud.platform.model.wechat.response;

public class Video {
	private String MediaId;
	private String ThumbMediaId;

	public String getThumbMediaId() {
		return ThumbMediaId;
	}

	public void setThumbMediaId(String thumbMediaId) {
		ThumbMediaId = thumbMediaId;
	}

	public String getMediaId() {

		return MediaId;
	}

	public void setMediaId(String mediaId) {
		MediaId = mediaId;
	}

	public Video() {
		super();
	}

	public Video(String mediaId, String thumbMediaId) {
		MediaId = mediaId;
		ThumbMediaId = thumbMediaId;
	}

}
