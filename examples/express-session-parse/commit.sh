#!/bin/sh

remotes=`git remote`
# echo ${remotes#origin}
remote1=${remotes:0:6}
remote2=${remotes:7}
current_branch=`git rev-parse --abbrev-ref HEAD`
whoami=`whoami`
date=`date "+星期%a %H:%M"`

if [ -z "$1" ];then
	git add .
	git ci -m"【${whoami}-from-${current_branch} ${date}】update files"
	git pull --rebase $remote1 $current_branch
	git push $remote1 $current_branch
else
	git add .
	git ci -m"【${whoami}-from-${current_branch} ${date}】$1"
	git pull --rebase $remote1 $current_branch
	git push $remote1 $current_branch
fi
