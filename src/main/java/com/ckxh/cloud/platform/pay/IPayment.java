package com.ckxh.cloud.platform.pay;

public interface IPayment {
	/**
	 * get QR code for payment
	 * @param payId business id
	 * @param amount pay amount with unit fen
	 * @param subject pay subject
	 * @param callBackApiUrl
	 * @return
	 * @throws Exception
	 */
	public String getQrCode(Long payId, int amount , String subject, String callBackApiUrl) throws Exception;
}
