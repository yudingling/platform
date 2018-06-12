package com.ckxh.cloud.platform.model.wechat.request;

public class ImageMessage extends BaseMessage{
    private String PicUrl;

    public String getPicUrl() {
        return PicUrl;
    }

    public void setPicUrl(String picUrl) {
        PicUrl = picUrl;
    }

	public ImageMessage() {
		super();
	}

	public ImageMessage(String picUrl) {
		PicUrl = picUrl;
	}
}
