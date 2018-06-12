package com.ckxh.cloud.platform.model.wechat.menu;


public class ClickButton extends Button{
    private String type;
    private String key;

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

	public ClickButton() {
		super();
	}

	public ClickButton(String type, String key) {
		this.type = type;
		this.key = key;
	}
}
