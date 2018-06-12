package com.ckxh.cloud.platform.model.wechat.event;

public class QRCodeEvent extends BaseEvent {

	private String EventKey;
	private String Ticket;

	public String getTicket() {
		return Ticket;
	}

	public void setTicket(String ticket) {
		Ticket = ticket;
	}

	public String getEventKey() {

		return EventKey;
	}

	public void setEventKey(String eventKey) {
		EventKey = eventKey;
	}

	public QRCodeEvent() {
		super();
	}

	public QRCodeEvent(String eventKey, String ticket) {		
		EventKey = eventKey;
		Ticket = ticket;
	}
}
