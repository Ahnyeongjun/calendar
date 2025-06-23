@echo off
echo 🚀 Calendar Backend Database Setup
echo.

echo 📋 Checking MySQL connection...
mysql -u root -p -e "SELECT 'MySQL is running!' as status;"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ MySQL is not running or not installed
    echo.
    echo 💡 Please install MySQL first:
    echo 1. Download from: https://dev.mysql.com/downloads/installer/
    echo 2. Install MySQL Server 8.0
    echo 3. Set root password to 'password'
    echo 4. Start MySQL service
    echo.
    pause
    exit /b 1
)

echo ✅ MySQL is running!
echo.

echo 📁 Creating databases...
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS calendar_dev; CREATE DATABASE IF NOT EXISTS calendar_test; SHOW DATABASES;"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to create databases
    pause
    exit /b 1
)

echo ✅ Databases created successfully!
echo.

echo 🔄 Running migrations...
call npm run prisma:migrate
call npm run prisma:migrate:test

echo.
echo 🎉 Database setup completed!
echo.
echo 📊 You can now run:
echo   npm run dev          # Start development server
echo   npm run test         # Run tests
echo   npm run prisma:studio # View database
echo.
pause
