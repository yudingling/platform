package com.ckxh.cloud.platform.model;

import java.io.Serializable;

public class MAIN_API_3RDAUTH_EXT implements Serializable {
	private static final long serialVersionUID = -7592905443880696493L;
	
	private String API_ID;
	private String API_NM;

	public String getAPI_ID() {
		return API_ID;
	}

	public void setAPI_ID(String aPI_ID) {
		API_ID = aPI_ID;
	}

	public String getAPI_NM() {
		return API_NM;
	}

	public void setAPI_NM(String aPI_NM) {
		API_NM = aPI_NM;
	}

	public MAIN_API_3RDAUTH_EXT(){
		super();
	}

	public MAIN_API_3RDAUTH_EXT(String aPI_ID, String aPI_NM) {
		super();
		API_ID = aPI_ID;
		API_NM = aPI_NM;
	}
}
