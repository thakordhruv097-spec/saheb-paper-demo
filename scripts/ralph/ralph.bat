@echo off
setlocal enabledelayedexpansion

set MAX_ITERATIONS=10
if not "%~1"=="" set MAX_ITERATIONS=%~1

set SCRIPT_DIR=%~dp0
set PRD_FILE=%SCRIPT_DIR%prd.json
set PROGRESS_FILE=%SCRIPT_DIR%progress.txt

echo ==========================================
echo  Starting Ralph Loop on Windows (Max: %MAX_ITERATIONS%)
echo ==========================================

if not exist "%PRD_FILE%" (
    echo Error: %PRD_FILE% not found.
    exit /b 1
)

set ITERATION=1
:loop
if %ITERATION% gtr %MAX_ITERATIONS% goto end

echo.
echo --- Ralph Iteration !ITERATION! / !MAX_ITERATIONS! ---

call npm run build
if %ERRORLEVEL% neq 0 (
    echo Build failed on iteration %ITERATION%
    exit /b %ERRORLEVEL%
)

set /a ITERATION+=1
goto loop

:end
echo.
echo ==========================================
echo  Ralph Loop Finished Successfully!
echo ==========================================
