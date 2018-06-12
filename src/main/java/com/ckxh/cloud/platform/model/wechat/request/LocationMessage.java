package com.ckxh.cloud.platform.model.wechat.request;

public class LocationMessage extends BaseMessage {

	private String Location_x;
	private String Location_Y;
	private String Scale;
	private String Label;

	public String getLabel() {
		return Label;
	}

	public void setLabel(String label) {
		Label = label;
	}

	public String getScale() {

		return Scale;
	}

	public void setScale(String scale) {
		Scale = scale;
	}

	public String getLocation_Y() {

		return Location_Y;
	}

	public void setLocation_Y(String location_Y) {
		Location_Y = location_Y;
	}

	public String getLocation_x() {

		return Location_x;
	}

	public void setLocation_x(String location_x) {
		Location_x = location_x;
	}

	public LocationMessage() {
		super();
	}

	public LocationMessage(String location_x, String location_Y, String scale, String label) {
		Location_x = location_x;
		Location_Y = location_Y;
		Scale = scale;
		Label = label;
	}

}
