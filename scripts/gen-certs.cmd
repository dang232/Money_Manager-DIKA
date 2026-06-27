@echo off
REM ponytail: Windows shim — delegates to bash (git-bash).
setlocal
set SCRIPT_DIR=%~dp0
"C:\Program Files\Git\bin\bash.exe" "%SCRIPT_DIR%gen-certs.sh"
endlocal