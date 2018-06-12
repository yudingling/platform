package com.ckxh.cloud.platform.api.own.user;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.daemon.IWriteBack;
import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.LogUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_RECHARGE;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE_RELIABLE_RECHARGE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_RECHARGE;
import com.ckxh.cloud.persistence.db.sys.service.ThirdPartyService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.PayResultType;
import com.ckxh.cloud.platform.payCallBack.ResourceCB;
import com.ckxh.cloud.platform.payCallBack.ThirdPartyServiceCB;
import com.ckxh.cloud.platform.payCallBack.ThirdPartyServiceReliableCB;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/balanceDebit")
@AuthPathOnBind("get:/platformApi/own/user/normal/#")
public class BalanceDebitController {
	@Autowired
	private ThirdPartyService thirdPartyService;
	@Autowired
	private UserInfoService userInfoService;
	
	@Autowired
	private ThirdPartyServiceCB thirdPartyServiceCB;
	@Autowired
	private ThirdPartyServiceReliableCB thirdPartyServiceReliableCB;
	@Autowired
	private ResourceCB resourceCB;
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.POST)
	public String post(@RequestParam String lgTp, @RequestParam Long id, @RequestParam String pwd, HttpServletRequest request, HttpServletResponse response) throws IOException {
		try {
			if(lgTp == null || lgTp.length() == 0 || id == null || pwd == null || pwd.length() == 0){
				throw new Exception("参数错误");
			}
			
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			MAIN_USER user = this.userInfoService.getUserInfo(uid);
			if(!Encrypt.SHA1(pwd).equals(user.getU_PWD())){
				throw new Exception("密码错误");
			}
			
			Object[] payinfo = this.getPayInfo(lgTp, id, uid);
			if(payinfo == null){
				throw new Exception("参数错误");
			}
			
			double payAmount = (double) payinfo[0];
			IWriteBack wb = (IWriteBack) payinfo[1];
			
			MAIN_USER dbUser = this.userInfoService.getUserInfo_fromDB(uid);
			if(dbUser.getU_PROFIT() < payAmount){
				throw new Exception("余额不足");
			}
			
			if(this.userInfoService.updateUserProfitOnDebit(uid, payAmount, id, lgTp)){
				this.safeWriteBack(wb, id, true, null);
				Map<String, Object> retMap = new HashMap<String, Object>();
				retMap.put("amount", payAmount);
				
				return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), "支付成功", null);
				
			}else{
				throw new Exception("余额不足");
			}

		} catch (Exception ex) {
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
	
	private void safeWriteBack(IWriteBack wb, Long id, boolean success, String errMsg){
		try{
			wb.writeBack(SysTool.longUuidInLocal(), new Object[]{id, success, errMsg});
		}catch(Exception ex){
			LogUtil.error(ex);
		}
	}
	
	private Object[] getPayInfo(String lgTp, Long id, String uid){
		if(lgTp.equals("3rdService")){
			MAIN_3RDSERVICE_RECHARGE msrc = this.thirdPartyService.get3rdRecharge(uid, id, PayResultType.wait);
			if(msrc != null){
				return new Object[]{msrc.getMSRC_FEE(), this.thirdPartyServiceCB};
			}
			
		}else if(lgTp.equals("3rdServiceReliable")){
			MAIN_3RDSERVICE_RELIABLE_RECHARGE mrrc = this.thirdPartyService.get3rdReliableRecharge(uid, id, PayResultType.wait);
			if(mrrc != null){
				return new Object[]{mrrc.getMRRC_FEE(), this.thirdPartyServiceReliableCB};
			}
			
		}else if(lgTp.equals("resource")){
			MAIN_USER_RECHARGE rc = this.userInfoService.getUserRecharge(uid, id, PayResultType.wait);
			if(rc != null){
				return new Object[]{rc.getRC_FEE(), this.resourceCB};
			}
		}
		
		return null;
	}
}
