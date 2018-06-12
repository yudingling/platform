#!/bin/bash
#
# ssl 证书输出的根目录。
sslOutputRoot="/ckxh/mqttssl"
if [ $# -eq 1 ]; then
 sslOutputRoot=$1
fi
if [ ! -d ${sslOutputRoot} ]; then
 mkdir -p ${sslOutputRoot}
fi
cd ${sslOutputRoot}

clientPwd=$(date +%s)$RANDOM

# 生成client私钥
openssl genrsa -passout pass:$clientPwd -out client.key 2048
# 生成client证书签署请求文件
openssl req -new -key client.key -subj /C=cn/ST=beijing/L=beijing/O=ckxh/OU=tec/CN=ckxhtd.com/emailAddress=yudingling@126.com -passin pass:$clientPwd -out client.csr
#签署服务器证书，生成client.crt文件
openssl ca -in client.csr -out client.crt -cert ca.crt -keyfile ca.key -passin pass:ckxh@123 -batch -days 10950
