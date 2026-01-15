#!/bin/bash
docker build -t kube-vue:v1.0 .
docker save -o kube-vue.tar.gz kube-vue:v1.0
scp kube-vue.tar.gz node1:/mnt