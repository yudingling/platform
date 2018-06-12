package com.ckxh.cloud.platform.model;

import java.io.Serializable;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;

public class UserOpenInfo implements Serializable {
	private static final long serialVersionUID = -1925103416128012011L;
	
	private String U_ID;
	private String U_NM;
	private Long U_ICON;
	private Timestamp CRT_TS;
	/**
	 * key: c_id, value: c_nm
	 */
	private Map<String, String> publicClients;
	/**
	 * key: c_id, value: latest date time
	 */
	private Map<String, Long> latestTs;
	
	private List<String> stars;
	
	public String getU_ID() {
		return U_ID;
	}

	public void setU_ID(String u_ID) {
		U_ID = u_ID;
	}

	public String getU_NM() {
		return U_NM;
	}

	public void setU_NM(String u_NM) {
		U_NM = u_NM;
	}

	public Long getU_ICON() {
		return U_ICON;
	}

	public void setU_ICON(Long u_ICON) {
		U_ICON = u_ICON;
	}

	public Timestamp getCRT_TS() {
		return CRT_TS;
	}

	public void setCRT_TS(Timestamp cRT_TS) {
		CRT_TS = cRT_TS;
	}

	public Map<String, String> getPublicClients() {
		return publicClients;
	}

	public void setPublicClients(Map<String, String> publicClients) {
		this.publicClients = publicClients;
	}

	public Map<String, Long> getLatestTs() {
		return latestTs;
	}

	public void setLatestTs(Map<String, Long> latestTs) {
		this.latestTs = latestTs;
	}

	public List<String> getStars() {
		return stars;
	}

	public void setStars(List<String> stars) {
		this.stars = stars;
	}

	public UserOpenInfo(){
		super();
	}

	public UserOpenInfo(String u_ID, String u_NM, Long u_ICON,
			Timestamp cRT_TS, Map<String, String> publicClients,
			Map<String, Long> latestTs, List<String> stars) {
		super();
		U_ID = u_ID;
		U_NM = u_NM;
		U_ICON = u_ICON;
		CRT_TS = cRT_TS;
		this.publicClients = publicClients;
		this.latestTs = latestTs;
		this.stars = stars;
	}
}
