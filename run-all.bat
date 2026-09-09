@echo off
title Mine Subsidence Monitoring Platform - Launch All
echo =======================================================
echo Ministry of Coal - Mine Subsidence Monitoring Platform
echo Starting Backend API and Frontend Dashboard
echo =======================================================
start "Mine Subsidence Backend" cmd /c "start-backend.bat"
timeout /t 3 /nobreak > nul
start "Mine Subsidence Frontend" cmd /c "start-frontend.bat"
echo Services launched!
echo Access the application at: http://localhost:5173
echo API documentation at:       http://localhost:8000/docs
