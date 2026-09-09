@echo off
title Mine Subsidence Monitoring Frontend
cd /d %~dp0frontend
echo =======================================================
echo Starting Mine Subsidence Frontend (React + Vite)
echo URL: http://localhost:5173
echo =======================================================
npm.cmd run dev
pause
