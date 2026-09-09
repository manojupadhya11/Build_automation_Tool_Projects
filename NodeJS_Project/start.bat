@echo off
where node >nul 2>nul || (
  echo Node.js 22.5+ is required.
  exit /b 1
)
where npm >nul 2>nul || (
  echo npm is required.
  exit /b 1
)
if not exist node_modules (
  echo Installing dependencies...
  call npm install || exit /b 1
)
call npm start
