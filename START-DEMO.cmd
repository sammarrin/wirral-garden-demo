@echo off
cd /d "%~dp0"
set "WIRRAL_NODE=node"
where node >nul 2>nul
if errorlevel 1 set "WIRRAL_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not exist "node_modules\next\dist\bin\next" (
  echo Please follow the installation steps in README.md first.
  pause
  exit /b 1
)
echo Starting Wirral Garden Co.
echo Open http://127.0.0.1:3000/dashboard after the server says Ready.
echo Keep this window open. Press Ctrl+C to stop.
"%WIRRAL_NODE%" "node_modules\next\dist\bin\next" dev --hostname 127.0.0.1
pause
