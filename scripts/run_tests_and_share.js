#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
let testsFailed = false;

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║    WICKED ALT MANAGER - TEST + SHARE PIPELINE          ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// Step 1: Run tests
console.log('📋 Running tests...\n');

const testCmd = spawn('npm', ['test'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true
});

testCmd.on('close', (code) => {
  testsFailed = (code !== 0);
  
  if (testsFailed) {
    console.log('\n❌ Tests failed (code: ' + code + ')\n');
  } else {
    console.log('\n✅ Tests passed!\n');
  }

  // Step 2: Generate share bundle (always, even if tests fail)
  console.log('📦 Generating share bundle...\n');

  const shareCmd = spawn('npm', ['run', 'share'], {
    cwd: ROOT,
    stdio: 'inherit',
    shell: true
  });

  shareCmd.on('close', (shareCode) => {
    if (shareCode === 0) {
      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║                    READY TO SHARE                      ║');
      console.log('╚════════════════════════════════════════════════════════╝\n');
      
      console.log('📋 PASTE/UPLOAD THESE 3 FILES TO CHATGPT:\n');
      console.log('1. share_bundle/PROJECT_SUMMARY.txt');
      console.log('2. share_bundle/COMMANDS_DUMP.txt');
      console.log('3. share_bundle/LAST_LOGS.txt\n');
      
      console.log('(All secrets are automatically redacted!)\n');
      
      if (testsFailed) {
        console.log('⚠️  Include error info with your share (tests failed).\n');
        process.exit(1);
      } else {
        console.log('✅ All checks passed. Ready to share!\n');
        process.exit(0);
      }
    } else {
      console.log('\n❌ Share bundle generation failed.\n');
      process.exit(1);
    }
  });
});
