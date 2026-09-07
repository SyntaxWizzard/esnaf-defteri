@echo off
setlocal
cd /d "%~dp0"

echo === Esnaf Defteri baslatiliyor ===
echo.

if not exist node_modules (
    echo Paketler kuruluyor, ilk seferde birkac dakika surebilir...
    call npm install
    if errorlevel 1 goto hata
)

echo Veritabani semasi kontrol ediliyor...
call npx prisma migrate deploy
if errorlevel 1 goto hata

if not exist .demo-seeded (
    echo Demo veri olusturuluyor ^(sadece ilk calistirmada^)...
    call npm run seed
    if errorlevel 1 goto hata
    echo. > .demo-seeded
)

echo.
echo Uygulama baslatiliyor: http://localhost:3000
echo Kapatmak icin bu pencereyi kapatin ya da CTRL+C basin.
echo.

start "" "http://localhost:3000"
call npm run dev

goto son

:hata
echo.
echo Bir hata olustu. Yukaridaki mesaja bakin.
pause
exit /b 1

:son
pause
