@echo off
setlocal

rem Run from the repository root even when this file is started by double-clicking.
pushd "%~dp0.."
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\scripts\start-windows.ps1"
set "start_exit_code=%ERRORLEVEL%"
popd

if not "%start_exit_code%"=="0" (
  echo.
  echo The local host could not be started. Review the message above and press any key to close this window.
  pause >nul
)

exit /b %start_exit_code%
