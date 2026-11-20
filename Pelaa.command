#!/bin/zsh
cd -- "${0:A:h}" || exit 1
exec /usr/bin/open -a 'Google Chrome' index.html
