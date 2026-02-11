#!/usr/bin/env pwsh
# Pre-Deployment Verification Script
# Run this before deploying to catch common issues

Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║       NOVA - Pre-Deployment Verification Script          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

$errors = 0
$warnings = 0

# Check if Git is initialized
Write-Host "Checking Git status..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "✓ Git repository initialized" -ForegroundColor Green
    
    # Check for uncommitted changes
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠ You have uncommitted changes:" -ForegroundColor Yellow
        git status --short
        $warnings++
    } else {
        Write-Host "✓ No uncommitted changes" -ForegroundColor Green
    }
    
    # Check if remote is set
    $remote = git remote -v
    if ($remote) {
        Write-Host "✓ Git remote configured" -ForegroundColor Green
    } else {
        Write-Host "✗ No Git remote - add GitHub repository!" -ForegroundColor Red
        Write-Host "  Run: git remote add origin https://github.com/yourusername/repo.git" -ForegroundColor Gray
        $errors++
    }
} else {
    Write-Host "✗ Not a Git repository - run 'git init'" -ForegroundColor Red
    $errors++
}

# Check .gitignore
Write-Host "`nChecking .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore" -Raw
    if ($gitignore -match "\.env") {
        Write-Host "✓ .env files in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "⚠ .env files NOT in .gitignore - sensitive data risk!" -ForegroundColor Yellow
        $warnings++
    }
    if ($gitignore -match "node_modules") {
        Write-Host "✓ node_modules in .gitignore" -ForegroundColor Green
    } else {
        Write-Host "✗ node_modules NOT in .gitignore" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "⚠ No .gitignore file found" -ForegroundColor Yellow
    $warnings++
}

# Check for sensitive files in Git
Write-Host "`nChecking for sensitive files..." -ForegroundColor Yellow
$trackedFiles = git ls-files 2>$null
if ($trackedFiles -match "\.env$" -and $trackedFiles -notmatch "\.env\.example$") {
    Write-Host "✗ DANGER: .env files are tracked by Git!" -ForegroundColor Red
    Write-Host "  Run: git rm --cached backend/.env frontend/.env" -ForegroundColor Gray
    $errors++
} else {
    Write-Host "✓ No .env files tracked" -ForegroundColor Green
}

# Check backend structure
Write-Host "`nChecking backend..." -ForegroundColor Yellow
if (Test-Path "backend/package.json") {
    Write-Host "✓ Backend package.json exists" -ForegroundColor Green
    
    # Check for required dependencies
    $packageJson = Get-Content "backend/package.json" -Raw | ConvertFrom-Json
    $requiredDeps = @("express", "mongoose", "@google/generative-ai", "pdf-lib")
    foreach ($dep in $requiredDeps) {
        if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
            Write-Host "  ✓ $dep installed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $dep missing" -ForegroundColor Red
            $errors++
        }
    }
} else {
    Write-Host "✗ Backend package.json not found" -ForegroundColor Red
    $errors++
}

if (Test-Path "backend/server.js") {
    Write-Host "✓ Backend server.js exists" -ForegroundColor Green
} else {
    Write-Host "✗ Backend server.js not found" -ForegroundColor Red
    $errors++
}

# Check frontend structure
Write-Host "`nChecking frontend..." -ForegroundColor Yellow
if (Test-Path "frontend/package.json") {
    Write-Host "✓ Frontend package.json exists" -ForegroundColor Green
    
    # Check for required dependencies
    $packageJson = Get-Content "frontend/package.json" -Raw | ConvertFrom-Json
    $requiredDeps = @("react", "react-dom", "react-router-dom", "axios")
    foreach ($dep in $requiredDeps) {
        if ($packageJson.dependencies.PSObject.Properties.Name -contains $dep) {
            Write-Host "  ✓ $dep installed" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $dep missing" -ForegroundColor Red
            $errors++
        }
    }
} else {
    Write-Host "✗ Frontend package.json not found" -ForegroundColor Red
    $errors++
}

if (Test-Path "frontend/vite.config.js") {
    Write-Host "✓ Vite config exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Vite config not found" -ForegroundColor Yellow
    $warnings++
}

# Check deployment config files
Write-Host "`nChecking deployment configs..." -ForegroundColor Yellow
if (Test-Path "render.yaml") {
    Write-Host "✓ render.yaml exists (Render one-click deploy ready)" -ForegroundColor Green
} else {
    Write-Host "⚠ render.yaml not found (optional)" -ForegroundColor Gray
}

if (Test-Path "vercel.json") {
    Write-Host "✓ vercel.json exists (Vercel config ready)" -ForegroundColor Green
} else {
    Write-Host "⚠ vercel.json not found (optional)" -ForegroundColor Gray
}

# Check environment examples
Write-Host "`nChecking environment templates..." -ForegroundColor Yellow
if (Test-Path "backend/.env.example") {
    Write-Host "✓ Backend .env.example exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Backend .env.example missing" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path "frontend/.env.example") {
    Write-Host "✓ Frontend .env.example exists" -ForegroundColor Green
} else {
    Write-Host "⚠ Frontend .env.example missing" -ForegroundColor Yellow
    $warnings++
}

# Check documentation
Write-Host "`nChecking documentation..." -ForegroundColor Yellow
if (Test-Path "DEPLOYMENT.md") {
    Write-Host "✓ DEPLOYMENT.md exists" -ForegroundColor Green
} else {
    Write-Host "⚠ DEPLOYMENT.md not found" -ForegroundColor Yellow
    $warnings++
}

if (Test-Path "README.md") {
    Write-Host "✓ README.md exists" -ForegroundColor Green
} else {
    Write-Host "⚠ README.md not found" -ForegroundColor Yellow
    $warnings++
}

# Summary
Write-Host "`n╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    VERIFICATION SUMMARY                   ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

if ($errors -eq 0 -and $warnings -eq 0) {
    Write-Host "✅ ALL CHECKS PASSED - Ready to deploy!" -ForegroundColor Green
    Write-Host "`nNext Steps:" -ForegroundColor Cyan
    Write-Host "1. Commit and push your code: git push origin main" -ForegroundColor White
    Write-Host "2. Follow DEPLOYMENT.md for hosting setup" -ForegroundColor White
    Write-Host "3. Get MongoDB Atlas connection string" -ForegroundColor White
    Write-Host "4. Get Gemini API key from https://aistudio.google.com/app/apikey" -ForegroundColor White
    exit 0
} elseif ($errors -eq 0) {
    Write-Host "⚠ $warnings warning(s) found - deployment possible but review warnings" -ForegroundColor Yellow
    Write-Host "Review the warnings above before deploying" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ $errors error(s) and $warnings warning(s) found" -ForegroundColor Red
    Write-Host "Fix the errors above before deploying" -ForegroundColor White
    exit 1
}
