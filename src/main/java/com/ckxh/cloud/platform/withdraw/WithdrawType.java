package com.ckxh.cloud.platform.withdraw;

public enum WithdrawType {
	UnKnow(-1),
	WeChat(0),
	Alipay(1);
	
	private int value;
    
    private WithdrawType(int _value) {
        this.value = _value;
    }

    @Override
    public String toString() {
        return String.valueOf(this.value);
    }

	public int getValue() {
		return value;
	}
	
	public static WithdrawType valueOf(int val){
    	switch(val){
	    	case 0:
	    		return WithdrawType.WeChat;
	    	case 1:
	    		return WithdrawType.Alipay;
    		default:
    			return WithdrawType.UnKnow;
    	}
    }
}
