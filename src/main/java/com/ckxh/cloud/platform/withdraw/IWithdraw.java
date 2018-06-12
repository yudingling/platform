package com.ckxh.cloud.platform.withdraw;

import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW_ACCOUNT;

public interface IWithdraw {
	/**
	 * check if the account is legal or not. call it before doWithdraw
	 * @param account
	 * @return
	 */
	public WDResult accountLegal(MAIN_WITHDRAW_ACCOUNT account);
	
	/**
	 * get withdraw amount. call it before doWithdraw
	 * @return return -1 if not available
	 */
	public double getAvailAmount(double amount);
	
	/**
	 * withdraw
	 * @param account
	 * @param amount
	 * @param wdId
	 * @return
	 * @throws Exception
	 */
	public WDResult doWithdraw(MAIN_WITHDRAW_ACCOUNT account, double amount, Long wdId) throws Exception;
}
