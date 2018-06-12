package com.ckxh.cloud.platform.withdraw;

public class WDResult {
	private boolean success;
	private String error;
	
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	public String getError() {
		return error;
	}
	public void setError(String error) {
		this.error = error;
	}
	
	public WDResult(boolean success, String error) {
		super();
		this.success = success;
		this.error = error;
	}
}
