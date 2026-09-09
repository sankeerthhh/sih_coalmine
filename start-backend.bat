@echo off
title Mine Subsidence Monitoring Backend
cd /d %~dp0backend
echo =======================================================
echo Starting Mine Subsidence Backend API (FastAPI + SQLite)
echo Organization: Ministry of Coal, Government of India
echo =======================================================
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
