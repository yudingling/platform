package com.ckxh.cloud.platform.model.wechat.event;

public class LocationEvent extends BaseEvent {

	private String Latitude;
	private String Longitude;
	private String Precision;

	public String getPrecision() {
		return Precision;
	}

	public void setPrecision(String precision) {
		Precision = precision;
	}

	public String getLongitude() {

		return Longitude;
	}

	public void setLongitude(String longitude) {
		Longitude = longitude;
	}

	public String getLatitude() {

		return Latitude;
	}

	public void setLatitude(String latitude) {
		Latitude = latitude;
	}

	public LocationEvent() {
		super();
	}

	public LocationEvent(String latitude, String longitude, String precision) {
		Latitude = latitude;
		Longitude = longitude;
		Precision = precision;
	}

}
