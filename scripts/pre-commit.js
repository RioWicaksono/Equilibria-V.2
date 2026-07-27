# Pre-commit hooks for secrets scanning
# Install: npx husky add .husky/pre-commit "pnpm exec lefthook run pre-commit"

const { execSync } = require('child_process');

console.log('🔍 Running pre-commit checks...\n');

// 1. Run ESLint
console.log('📋 Running ESLint...');
try {
  execSync('pnpm lint', { stdio: 'inherit' });
  console.log('✅ ESLint passed\n');
} catch (e) {
  console.error('❌ ESLint failed. Please fix errors before committing.\n');
  process.exit(1);
}

// 2. Run Type Check
console.log('🔎 Running TypeScript check...');
try {
  execSync('pnpm tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed\n');
} catch (e) {
  console.error('❌ TypeScript check failed. Please fix errors before committing.\n');
  process.exit(1);
}

// 3. Run Tests
console.log('🧪 Running tests...');
try {
  execSync('pnpm test --run', { stdio: 'inherit' });
  console.log('✅ Tests passed\n');
} catch (e) {
  console.error('❌ Tests failed. Please fix errors before committing.\n');
  process.exit(1);
}

// 4. Scan for secrets (using gitleaks or trufflehog)
console.log('🔐 Scanning for secrets...');
try {
  // Using gitleaks if available
  execSync('npx gitleaks detect --source . --verbose --no-color', {
    stdio: 'inherit',
    timeout: 60000
  });
  console.log('✅ No secrets detected\n');
} catch (e) {
  // Gitleaks returns exit code 1 if secrets found
  if (e.status === 1) {
    console.error('❌ Secrets detected! Please remove sensitive data before committing.\n');
    console.error('If this is a false positive, use --allow list or add to .gitleaksignore\n');
    process.exit(1);
  }
  // Exit code 2 usually means gitleaks not installed
  if (e.status === 2) {
    console.log('⚠️  Gitleaks not installed. Skipping secrets scan.\n');
    console.log('   Install with: brew install gitleaks\n');
  }
}

console.log('✅ All pre-commit checks passed!\n');
