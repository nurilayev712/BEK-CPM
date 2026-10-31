@echo off
chcp 65001 > nul
title CPM Market Platform
color 0E

echo ========================================================
echo        🚗 CPM MARKET PLATFORMASINI ISHGA TUSHIRISH
echo ========================================================
echo.

cd /d "%~dp0\backend"

echo [1/3] Ma'lumotlar bazasi va demo kontent tekshirilmoqda...
node src/config/seedDemo.js

echo.
echo [2/3] Server va Telegram bot ishga tushirilmoqda...
echo.
echo Web Admin Panel: http://localhost:5000
echo Login: admin
echo Parol: admin123
echo.
echo Serverni to'xtatish uchun: Ctrl + C
echo ========================================================
echo.

start http://localhost:5000
node --use-system-ca src/server.js
pause
