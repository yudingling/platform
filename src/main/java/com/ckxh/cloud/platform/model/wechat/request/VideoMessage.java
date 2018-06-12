package com.ckxh.cloud.platform.model.wechat.request;

public class VideoMessage extends BaseMessage {

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

	public VideoMessage() {
		super();
	}

	public VideoMessage(String mediaId, String thumbMediaId) {
		MediaId = mediaId;
		ThumbMediaId = thumbMediaId;
	}
}
