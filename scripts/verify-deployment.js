#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Checks that all required files and configurations are ready for Vercel deployment
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const checks = [
  {
    name: 'Package.json exists',
    check: () => existsSync('package.json'),
    fix: 'Create package.json with proper scripts'
  },
  {
    name: 'Next.js configuration exists',
    check: () => existsSync('next.config.js'),
    fix: 'Create next.config.js for optimization'
  },
  {
    name: 'Vercel configuration exists',
    check: () => existsSync('vercel.json'),
    fix: 'Create vercel.json for deployment settings'
  },
  {
    name: 'Build scripts configured',
    check: () => {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
      return pkg.scripts && pkg.scripts.build && pkg.scripts.start;
    },
    fix: 'Add build and start scripts to package.json'
  },
  {
    name: 'App directory exists',
    check: () => existsSync('app'),
    fix: 'Ensure app directory contains Next.js pages'
  },
  {
    name: 'Public assets exist',
    check: () => existsSync('public') && existsSync('public/favicon.svg'),
    fix: 'Ensure public folder contains favicon and assets'
  },
  {
    name: 'TypeScript configuration',
    check: () => existsSync('tsconfig.json'),
    fix: 'Create tsconfig.json for TypeScript support'
  },
  {
    name: 'Tailwind CSS configuration',
    check: () => existsSync('tailwind.config.ts'),
    fix: 'Create tailwind.config.ts for styling'
  }
];

console.log('🚀 SVD Image Compression - Deployment Verification\n');

let allPassed = true;

checks.forEach((check, index) => {
  const passed = check.check();
  const status = passed ? '✅' : '❌';
  console.log(`${index + 1}. ${status} ${check.name}`);
  
  if (!passed) {
    console.log(`   Fix: ${check.fix}`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(50));

if (allPassed) {
  console.log('🎉 All checks passed! Ready for Vercel deployment.');
  console.log('\nNext steps:');
  console.log('1. Push to GitHub repository');
  console.log('2. Connect repository to Vercel');
  console.log('3. Deploy with: npm run deploy');
} else {
  console.log('⚠️  Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n📚 MATH 3120 Final Project - University of Pennsylvania');
