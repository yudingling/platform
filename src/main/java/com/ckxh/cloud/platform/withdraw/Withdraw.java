package com.ckxh.cloud.platform.withdraw;

import java.util.HashMap;
import java.util.Map;
import com.ckxh.cloud.base.filter.BaseFilter;
import com.ckxh.cloud.persistence.db.model.MAIN_WITHDRAW_ACCOUNT;

public abstract class Withdraw extends BaseFilter implements IWithdraw {

	private WithdrawType wdTp;

	private static Map<WithdrawType, IWithdraw> pool = new HashMap<WithdrawType, IWithdraw>();
	
	@Override
	public final void markThis() {
		pool.put(this.wdTp, this);
	}
	
	public Withdraw(WithdrawType wdTp) {
		super();
		this.wdTp = wdTp;
	}
	
	/**
	 * check if the account is legal or not. call it before doWithdraw
	 * @param account
	 * @return
	 */
	public static WDResult accountLegal(WithdrawType wdTp, MAIN_WITHDRAW_ACCOUNT account){
		IWithdraw obj = pool.get(wdTp);
		
		if(obj != null){
			return obj.accountLegal(account);
		}else{
			return null;
		}
	}
	
	/**
	 * get withdraw amount. call it before doWithdraw
	 * @return return -1 if not available
	 */
	public static double getAvailAmount(WithdrawType wdTp, double amount){
		IWithdraw obj = pool.get(wdTp);
		
		if(obj != null){
			return obj.getAvailAmount(amount);
		}else{
			return -1;
		}
	}
	
	/**
	 * withdraw
	 * @param wdTp
	 * @param account
	 * @param amountOfFen withdraw amount with unit fen
	 * @param wdId
	 * @return return null if any error occurred.
	 */
	public static WDResult doWithdraw(WithdrawType wdTp, MAIN_WITHDRAW_ACCOUNT account, double amount, Long wdId){
		IWithdraw obj = pool.get(wdTp);
		if(obj != null){
			try{
				return obj.doWithdraw(account, amount, wdId);
				
			}catch(Exception ex){
				return new WDResult(false, ex.getMessage());
			}
			
		}else{
			return null;
		}
	}
}
