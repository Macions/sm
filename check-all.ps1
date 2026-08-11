# ============================================
# SKRYPT SPRAWDZAJÄ„CY WSZYSTKIE PLIKI - SZCZEGĂ“ĹOWO
# ============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPRAWDZANIE WSZYSTKICH PLIKOW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true
$missing = @()
$found = @()

# ============================================
# SPRAWDZENIE KATALOGOW
# ============================================
Write-Host "[1] SPRAWDZANIE KATALOGOW..." -ForegroundColor Yellow
Write-Host ""

$dirs = @(
    "src",
    "src/layouts",
    "src/pages",
    "src/pages/Login",
    "src/pages/Dashboard",
    "src/pages/Admin",
    "src/components",
    "src/api",
    "src/hooks",
    "src/utils",
    "src/types",
    "src/contexts",
    "backend",
    "backend/src",
    "backend/src/services",
    "backend/src/routes",
    "backend/prisma"
)

foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "  [OK] $dir" -ForegroundColor Green
        $found += $dir
    } else {
        Write-Host "  [X] $dir (BRAK)" -ForegroundColor Red
        $missing += $dir
        $allGood = $false
    }
}
Write-Host ""

# ============================================
# SPRAWDZENIE PLIKOW FRONTEND
# ============================================
Write-Host "[2] SPRAWDZANIE PLIKOW FRONTEND..." -ForegroundColor Yellow
Write-Host ""

$files = @(
    "package.json",
    "vite.config.ts",
    "tsconfig.json",
    "src/main.tsx",
    "src/App.tsx",
    "src/AppRoutes.tsx",
    "src/layouts/DashboardLayout.tsx",
    "src/pages/Login/Login.tsx",
    "src/pages/Dashboard/Dashboard.tsx",
    "src/pages/Admin/Admin.tsx",
    "src/components/RevenueChart.tsx",
    "src/api/api.ts",
    "src/api/axios.ts",
    "src/hooks/useAuth.ts",
    "src/utils/logger.ts",
    "src/utils/errorHandler.ts",
    "src/contexts/AuthContext.tsx",
    "src/types/auth.ts",
    "src/types/api.ts",
    ".env"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
        $found += $file
    } else {
        Write-Host "  [X] $file (BRAK)" -ForegroundColor Red
        $missing += $file
        $allGood = $false
    }
}
Write-Host ""

# ============================================
# SPRAWDZENIE PLIKOW BACKEND
# ============================================
Write-Host "[3] SPRAWDZANIE PLIKOW BACKEND..." -ForegroundColor Yellow
Write-Host ""

$backendFiles = @(
    "backend/package.json",
    "backend/src/server.ts",
    "backend/src/services/revenue.service.ts",
    "backend/src/routes/revenue.routes.ts",
    "backend/prisma/schema.prisma"
)

foreach ($file in $backendFiles) {
    if (Test-Path $file) {
        Write-Host "  [OK] $file" -ForegroundColor Green
        $found += $file
    } else {
        Write-Host "  [X] $file (BRAK)" -ForegroundColor Red
        $missing += $file
        $allGood = $false
    }
}
Write-Host ""

# ============================================
# SPRAWDZENIE ZALEZNOSCI
# ============================================
Write-Host "[4] SPRAWDZANIE ZALEZNOSCI..." -ForegroundColor Yellow
Write-Host ""

if (Test-Path "node_modules/recharts") {
    Write-Host "  [OK] recharts zainstalowane" -ForegroundColor Green
} else {
    Write-Host "  [X] recharts NIE ZAINSTALOWANE" -ForegroundColor Red
    Write-Host "      Uruchom: npm install recharts" -ForegroundColor Cyan
    $allGood = $false
}
Write-Host ""

# ============================================
# PODSUMOWANIE
# ============================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PODSUMOWANIE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($missing.Count -gt 0) {
    Write-Host "BRAKUJE ($($missing.Count)):" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "  [X] $_" -ForegroundColor Red }
    Write-Host ""
}

if ($allGood) {
    Write-Host "[OK] WSZYSTKO JEST OK!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Uruchom aplikacjÄ™:" -ForegroundColor Cyan
    Write-Host "  1. Backend: cd backend && npm run dev" -ForegroundColor White
    Write-Host "  2. Frontend: npm run dev" -ForegroundColor White
    Write-Host "  3. OtwĂłrz: http://localhost:5173/admin" -ForegroundColor White
} else {
    Write-Host "[WARN] WYKRYTO PROBLEMY - napraw powyĹĽsze i sprĂłbuj ponownie" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KONIEC SKRYPTU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
