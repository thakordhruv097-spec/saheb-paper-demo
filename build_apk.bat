@echo off
echo ===================================================
echo   Saheb Paper Pvt. Ltd. - APK Builder
echo ===================================================
echo.
echo Syncing web assets...
call npx cap sync
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Capacitor sync failed. Make sure 'npm run build' has run successfully.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Compiling Android project...
cd android
call gradlew.bat assembleDebug
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTICE] Local command line compilation failed.
    echo This is usually because the Android SDK path is not configured in your environment.
    echo.
    echo [RECOMMENDED SOLUTION]:
    echo 1. Open Android Studio.
    echo 2. Click "Open" and select the folder:
    echo    "d:\Code\saheb-paper-demo\android"
    echo 3. Android Studio will automatically resolve, download, and configure all Android SDK
    echo    components and dependencies for you.
    echo 4. Go to: Build -> Build Bundle(s) / APK(s) -> Build APK(s) to generate the APK file!
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo [SUCCESS] APK compiled successfully!
echo ===================================================
echo Location: d:\Code\saheb-paper-demo\android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
