package platform.test;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.msgpack.jackson.dataformat.MessagePackFactory;
import com.ckxh.cloud.base.util.ConstString;
import com.ckxh.cloud.base.util.Encrypt;
import com.ckxh.cloud.base.util.HttpClientUtil;
import com.ckxh.cloud.persistence.common.SysTool;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import junit.framework.TestCase;

public class testbs extends TestCase {
	
	public void genuuid(){
		for(int i=0;i<10;i++){
			System.out.println(SysTool.longUuid());
		}
		
	}
	
	public void cusum(){
		double[] vals = new double[]{0,0,-40,0,0,0,15,17,6,3,1,0.5,0,0,0,0,3.5,8.5,22,23.5,30,40,12,3,0,0,0,0,1.2,1.8,5,0,0};
		double avg = 0;
		for(int i=0;i<vals.length;i++){
			avg += vals[i];
		}
		avg /= vals.length;
		
		System.out.println(avg);
		
		double[] ci = new double[vals.length], cis = new double[vals.length];
		ci[0] = 0; cis[0]= 0;
		for(int i=1; i<ci.length; i++){
			double tmp = Math.pow(vals[i] - avg, 2);
			cis[i] = tmp;
			if(i==1){
				ci[i]= tmp;
			}else{
				ci[i] = tmp + ci[i-1];
			}
		}
		
		for(int i=0;i<ci.length;i++){
			System.out.print(Math.round(ci[i])+ " ");
		}
		
		System.out.println("");
		
		for(int i=0;i<cis.length;i++){
			System.out.print(Math.round(cis[i])+ " ");
		}
		
		System.out.println("");
		
		for(int i=0;i<ci.length;i++){
			System.out.print(Math.atan(Math.round(cis[i])) * 180 /Math.PI + " ");
		}
		
		System.out.println("");
	}
	
	
	public <T> T deserializeList(byte[] value, TypeReference<T> classType) throws JsonParseException, JsonMappingException, IOException{
		ObjectMapper objectMapper = new ObjectMapper(new MessagePackFactory());
		return objectMapper.readValue(value, classType);
	}
	
	public <T> T deserializeList(byte[] value) throws JsonParseException, JsonMappingException, IOException{
		ObjectMapper objectMapper = new ObjectMapper(new MessagePackFactory());
		return objectMapper.readValue(value, new TypeReference<T>(){});
	}
	
	public void getLPCoefficientsButterworth2Pole(int samplerate, double cutoff, double[] ax, double[] by)
	{
	    double sqrt2 = Math.sqrt(2);

	    double QcRaw  = (2 * Math.PI * cutoff) / samplerate; // Find cutoff frequency in [0..PI]
	    double QcWarp = Math.tan(QcRaw); // Warp cutoff frequency

	    double gain = 1 / (1+sqrt2/QcWarp + 2/(QcWarp*QcWarp));
	    by[2] = (1 - sqrt2/QcWarp + 2/(QcWarp*QcWarp)) * gain;
	    by[1] = (2 - 2 * 2/(QcWarp*QcWarp)) * gain;
	    by[0] = 1;
	    ax[0] = 1 * gain;
	    ax[1] = 2 * gain;
	    ax[2] = 1 * gain;
	}
	
	public void doxxs() {

		Matcher ss = Pattern.compile("(\\w{2,}\\.\\w{2,3}\\.\\w{2,3}|\\w{2,}\\.\\w{2,3})$", Pattern.CASE_INSENSITIVE).matcher("child.sub.example.com");
		while(ss.find()) {
		    System.out.println("Match \"" + ss.group() + "\" at positions " +
		    		ss.start() + "-" + (ss.end() - 1));
		    }
	}
	
	public void doxxssfe() {
		Map<String, String> retFileIds = new HashMap<String, String>();
		
		Map<String, String> paramMap = new HashMap<String, String>();
		paramMap.put(ConstString.AuthParam_uid, "sys_fileLoader");
		paramMap.put(ConstString.AuthParam_pwd, "sys_fileLoader_ckxh@123");
		
		HttpClientUtil.postFile(String.format("http://localhost:8180/file/fileApi/firmware?%s=%s&%s=%s", ConstString.AuthParam_uid, "sys_fileLoader", ConstString.AuthParam_pwd,"sys_fileLoader_ckxh@123"), 
				null, "file", "C:/Users/zuodan/Desktop/软件.txt", retFileIds);
		
		for(String key: retFileIds.keySet()){
			System.out.println(key + " : " + retFileIds.get(key));
		}
	}
	
	
	public void doxx() throws Exception{
		
		System.out.println(Encrypt.SHA1("sys_mqAdmin_ckxh@123"));
		System.out.println(Encrypt.SHA1("sys_mqWrapper_ckxh@123"));
		System.out.println(Encrypt.SHA1("sys_fileLoader_ckxh@123"));
		System.out.println(Encrypt.SHA1("sys_3rdPush_ckxh@123"));
		System.out.println(Encrypt.SHA1("admin"));
	}
}
