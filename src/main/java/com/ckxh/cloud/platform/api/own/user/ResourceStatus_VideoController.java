package com.ckxh.cloud.platform.api.own.user;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.base.util.MsgPackUtil;
import com.ckxh.cloud.persistence.common.auth.AuthUtil;
import com.ckxh.cloud.persistence.db.client.service.ClientInfoService;
import com.ckxh.cloud.persistence.db.client.service.StreamDataService;
import com.ckxh.cloud.persistence.db.user.service.UserInfoService;
import com.ckxh.cloud.persistence.model.Metadata_with_CNM;
import com.ckxh.cloud.persistence.model.ResourceStatus;

@Scope("singleton")
@Controller
@RequestMapping("/own/user/normal/resourceStatus/video")
public class ResourceStatus_VideoController {
	@Autowired
	private UserInfoService userInfoService;
	@Autowired
	private ClientInfoService clientInfoService;
	@Autowired
	private StreamDataService streamDataService;
	
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			String uid = AuthUtil.getIdFromSession(request.getSession());
			
			Map<String, Object> retMap = new HashMap<String, Object>();
			
			//here we do not use @ResourceStatusGetter to get the status of video. case we need to get the video metadata list from the iterator.  
			
			int limit = this.userInfoService.getVideoResourceLimit(uid);
			
			List<Metadata_with_CNM> videoList = new ArrayList<Metadata_with_CNM>();
			List<Metadata_with_CNM> metaList = this.clientInfoService.getMetadataOfOwner(uid);
			for(Metadata_with_CNM tmp : metaList){
				if(this.streamDataService.isMetaVideoType(tmp.getSYSMETA_ID())){
					videoList.add(tmp);
				}
			}
			
			retMap.put("status", new ResourceStatus(videoList.size(), limit));
			retMap.put("videoList", videoList);
			
			return JsonUtil.createSuccessJson(true, MsgPackUtil.serialize2Str(retMap), null, null);
			
		}catch(Exception ex){
			ex.printStackTrace();
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}
