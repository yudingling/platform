package com.ckxh.cloud.platform.model;

import java.io.Serializable;

public class BalancePayInfo implements Serializable {
	private static final long serialVersionUID = -8104712669703021898L;
	
	private Long id;
	private double balance;
	private double payAmount;
	
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public double getBalance() {
		return balance;
	}
	public void setBalance(double balance) {
		this.balance = balance;
	}
	public double getPayAmount() {
		return payAmount;
	}
	public void setPayAmount(double payAmount) {
		this.payAmount = payAmount;
	}
	
	public BalancePayInfo(){
		super();
	}
	
	public BalancePayInfo(Long id, double balance, double payAmount) {
		super();
		this.id = id;
		this.balance = balance;
		this.payAmount = payAmount;
	}
}
