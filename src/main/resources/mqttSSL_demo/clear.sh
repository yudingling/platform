#!/bin/sh
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

rm -rf ./demoCA/newcerts
mkdir ./demoCA/newcerts
> ./demoCA/index.txt
> ./demoCA/index.txt.old
