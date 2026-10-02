@echo off
rem Double-click to run Quiz Night on this laptop. It opens in its own window;
rem keep this black window open while you use it and close it to stop.
title Quiz Night
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Quiz Night needs Node.js. Install it from https://nodejs.org and run this again.
  pause
  exit /b 1
)

node scripts\serve.mjs
if errorlevel 1 pause
