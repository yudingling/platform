package com.ckxh.cloud.platform.model.wechat.event;


public class MenuEvent extends BaseEvent {
    private String EventKey;

    public String getEventKey() {
        return EventKey;
    }

    public void setEventKey(String eventKey) {
        EventKey = eventKey;
    }

	public MenuEvent() {
		super();
	}

	public MenuEvent(String eventKey) {
		EventKey = eventKey;
	}
}
