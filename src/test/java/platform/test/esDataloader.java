package platform.test;
/*
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import com.ckxh.cloud.base.annotation.AuthPathOnBind;
import com.ckxh.cloud.base.util.JsonUtil;
import com.ckxh.cloud.persistence.common.elasticsearch.EsSearch;
import com.ckxh.cloud.persistence.db.dao.ClientDao;
import com.ckxh.cloud.persistence.db.model.BaseRowMapper;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT;
import com.ckxh.cloud.persistence.db.model.IOT_CLIENT_TAG;
import com.ckxh.cloud.persistence.db.model.IOT_WARN;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDPUSH_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_3RDSERVICE;
import com.ckxh.cloud.persistence.db.model.MAIN_MAINTENANCE;
import com.ckxh.cloud.persistence.db.model.MAIN_USER;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_REMIND;
import com.ckxh.cloud.persistence.db.model.MAIN_USER_RNAUTH;

@Scope("singleton")
@Controller
@RequestMapping("/own/esload")
@AuthPathOnBind("get:/platformApi/own/user/normal/#")
public class EsLoaderController {
	@Autowired
	protected EsSearch esSearch;
	@Autowired
	private ClientDao clientDao;
	
	@SuppressWarnings("rawtypes")
	@ResponseBody
	@RequestMapping(method=RequestMethod.GET)
	public String get(HttpServletRequest request, HttpServletResponse response){
		try{
			List list = this.clientDao.loadAll(IOT_CLIENT_TAG.class, new BaseRowMapper<IOT_CLIENT_TAG>(IOT_CLIENT_TAG.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(IOT_CLIENT.class, new BaseRowMapper<IOT_CLIENT>(IOT_CLIENT.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(IOT_WARN.class, new BaseRowMapper<IOT_WARN>(IOT_WARN.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(MAIN_3RDPUSH_USER.class, new BaseRowMapper<MAIN_3RDPUSH_USER>(MAIN_3RDPUSH_USER.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(MAIN_3RDSERVICE.class, new BaseRowMapper<MAIN_3RDSERVICE>(MAIN_3RDSERVICE.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(MAIN_MAINTENANCE.class, new BaseRowMapper<MAIN_MAINTENANCE>(MAIN_MAINTENANCE.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(MAIN_USER_REMIND.class, new BaseRowMapper<MAIN_USER_REMIND>(MAIN_USER_REMIND.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(MAIN_USER_RNAUTH.class, new BaseRowMapper<MAIN_USER_RNAUTH>(MAIN_USER_RNAUTH.class));
			this.esSearch.putEsModels(list);
			
			list = this.clientDao.loadAll(MAIN_USER.class, new BaseRowMapper<MAIN_USER>(MAIN_USER.class));
			this.esSearch.putEsModels(list);
			
			return JsonUtil.createSuccessJson(true, null, "es data loaded", null);
			
		}catch(Exception ex){
			return JsonUtil.createSuccessJson(false, null, ex.getMessage(), null);
		}
	}
}*/