package com.ckxh.cloud.platform.model;

import java.io.Serializable;

public class PrePayInfo implements Serializable {
	private static final long serialVersionUID = 908429530111883882L;
	
	private Long id;
	private String qrCode;
	
	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getQrCode() {
		return qrCode;
	}

	public void setQrCode(String qrCode) {
		this.qrCode = qrCode;
	}

	public PrePayInfo(){
		super();
	}
	
	public PrePayInfo(Long id, String qrCode) {
		super();
		this.id = id;
		this.qrCode = qrCode;
	}
}
