package com.ckxh.cloud.platform.model;

import java.io.Serializable;
import java.util.List;

public class ServiceCreateInfo implements Serializable {
	private static final long serialVersionUID = 9064244945841504457L;
	
	private Long TPS_ID;
	private String TPS_NM;
	private String TPS_APIURL;
	private Long TPS_IMG;
	private String TPS_BRIEF;
	private String TPS_DESC;
	private String TPS_HELPURL;
	private int TPS_EXEC_TP;
	private List<String> TPS_TMS;
	private String TPS_TMS_STR;
	private String TPS_VISIBLE_UIDS;
	private List<String> authApis;
	
	private int FEE_TP;
	private long FEE_COUNT_FREE;
	private int FEE_COUNT_NUM;
	private double FEE_COUNT_BASE;
	private int FEE_TIME_FREE;
	private int FEE_TIME_PERIOD;
	private double FEE_TIME_BASE;
	
	private Boolean imgModifiedOnEdit = false;
	
	public Long getTPS_ID() {
		return TPS_ID;
	}

	public void setTPS_ID(Long tPS_ID) {
		TPS_ID = tPS_ID;
	}

	public String getTPS_NM() {
		return TPS_NM;
	}

	public void setTPS_NM(String tPS_NM) {
		TPS_NM = tPS_NM;
	}

	public String getTPS_APIURL() {
		return TPS_APIURL;
	}

	public void setTPS_APIURL(String tPS_APIURL) {
		TPS_APIURL = tPS_APIURL;
	}

	public Long getTPS_IMG() {
		return TPS_IMG;
	}

	public void setTPS_IMG(Long tPS_IMG) {
		TPS_IMG = tPS_IMG;
	}

	public String getTPS_BRIEF() {
		return TPS_BRIEF;
	}

	public void setTPS_BRIEF(String tPS_BRIEF) {
		TPS_BRIEF = tPS_BRIEF;
	}

	public String getTPS_DESC() {
		return TPS_DESC;
	}

	public void setTPS_DESC(String tPS_DESC) {
		TPS_DESC = tPS_DESC;
	}

	public String getTPS_HELPURL() {
		return TPS_HELPURL;
	}

	public void setTPS_HELPURL(String tPS_HELPURL) {
		TPS_HELPURL = tPS_HELPURL;
	}

	public int getTPS_EXEC_TP() {
		return TPS_EXEC_TP;
	}

	public void setTPS_EXEC_TP(int tPS_EXEC_TP) {
		TPS_EXEC_TP = tPS_EXEC_TP;
	}

	public List<String> getTPS_TMS() {
		return TPS_TMS;
	}

	public void setTPS_TMS(List<String> tPS_TMS) {
		TPS_TMS = tPS_TMS;
	}

	public List<String> getAuthApis() {
		return authApis;
	}

	public void setAuthApis(List<String> authApis) {
		this.authApis = authApis;
	}

	public int getFEE_TP() {
		return FEE_TP;
	}

	public void setFEE_TP(int fEE_TP) {
		FEE_TP = fEE_TP;
	}

	public long getFEE_COUNT_FREE() {
		return FEE_COUNT_FREE;
	}

	public void setFEE_COUNT_FREE(long fEE_COUNT_FREE) {
		FEE_COUNT_FREE = fEE_COUNT_FREE;
	}

	public int getFEE_COUNT_NUM() {
		return FEE_COUNT_NUM;
	}

	public void setFEE_COUNT_NUM(int fEE_COUNT_NUM) {
		FEE_COUNT_NUM = fEE_COUNT_NUM;
	}

	public double getFEE_COUNT_BASE() {
		return FEE_COUNT_BASE;
	}

	public void setFEE_COUNT_BASE(double fEE_COUNT_BASE) {
		FEE_COUNT_BASE = fEE_COUNT_BASE;
	}

	public int getFEE_TIME_FREE() {
		return FEE_TIME_FREE;
	}

	public void setFEE_TIME_FREE(int fEE_TIME_FREE) {
		FEE_TIME_FREE = fEE_TIME_FREE;
	}

	public int getFEE_TIME_PERIOD() {
		return FEE_TIME_PERIOD;
	}

	public void setFEE_TIME_PERIOD(int fEE_TIME_PERIOD) {
		FEE_TIME_PERIOD = fEE_TIME_PERIOD;
	}

	public double getFEE_TIME_BASE() {
		return FEE_TIME_BASE;
	}

	public void setFEE_TIME_BASE(double fEE_TIME_BASE) {
		FEE_TIME_BASE = fEE_TIME_BASE;
	}

	public String getTPS_TMS_STR() {
		return TPS_TMS_STR;
	}

	public void setTPS_TMS_STR(String tPS_TMS_STR) {
		TPS_TMS_STR = tPS_TMS_STR;
	}

	public Boolean getImgModifiedOnEdit() {
		return imgModifiedOnEdit;
	}

	public void setImgModifiedOnEdit(Boolean imgModifiedOnEdit) {
		this.imgModifiedOnEdit = imgModifiedOnEdit;
	}
	
	public String getTPS_VISIBLE_UIDS() {
		return TPS_VISIBLE_UIDS;
	}

	public void setTPS_VISIBLE_UIDS(String tPS_VISIBLE_UIDS) {
		TPS_VISIBLE_UIDS = tPS_VISIBLE_UIDS;
	}

	public ServiceCreateInfo(){
		super();
	}

	public ServiceCreateInfo(Long tPS_ID, String tPS_NM, String tPS_APIURL,
			Long tPS_IMG, String tPS_BRIEF, String tPS_DESC,
			String tPS_HELPURL, int tPS_EXEC_TP, List<String> tPS_TMS,
			String tPS_TMS_STR, String tPS_VISIBLE_UIDS, List<String> authApis,
			int fEE_TP, long fEE_COUNT_FREE, int fEE_COUNT_NUM,
			double fEE_COUNT_BASE, int fEE_TIME_FREE, int fEE_TIME_PERIOD,
			double fEE_TIME_BASE, Boolean imgModifiedOnEdit) {
		super();
		TPS_ID = tPS_ID;
		TPS_NM = tPS_NM;
		TPS_APIURL = tPS_APIURL;
		TPS_IMG = tPS_IMG;
		TPS_BRIEF = tPS_BRIEF;
		TPS_DESC = tPS_DESC;
		TPS_HELPURL = tPS_HELPURL;
		TPS_EXEC_TP = tPS_EXEC_TP;
		TPS_TMS = tPS_TMS;
		TPS_TMS_STR = tPS_TMS_STR;
		TPS_VISIBLE_UIDS = tPS_VISIBLE_UIDS;
		this.authApis = authApis;
		FEE_TP = fEE_TP;
		FEE_COUNT_FREE = fEE_COUNT_FREE;
		FEE_COUNT_NUM = fEE_COUNT_NUM;
		FEE_COUNT_BASE = fEE_COUNT_BASE;
		FEE_TIME_FREE = fEE_TIME_FREE;
		FEE_TIME_PERIOD = fEE_TIME_PERIOD;
		FEE_TIME_BASE = fEE_TIME_BASE;
		this.imgModifiedOnEdit = imgModifiedOnEdit;
	}
}
