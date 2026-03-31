#!/usr/bin/env node

/**
 * Automated test for IntentCompiler
 */

const { spawn } = require('child_process');
const { join } = require('path');

async function runTest() {
  console.log('🧪 Running automated test...\n');
  
  const child = spawn('node', ['multi-agent-generator.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  // Simulate user inputs
  const inputs = [
    'build a recipe app for cooking',  // Intent
    '',  // Database (use default PostgreSQL)
    '',  // Backend (use default Node.js)
    '',  // Frontend (use default React)
    '',  // Deployment (use default Docker)
    ''   // Scale (use default Medium)
  ];

  let inputIndex = 0;
  const sendNextInput = () => {
    if (inputIndex < inputs.length) {
      setTimeout(() => {
        child.stdin.write(inputs[inputIndex] + '\n');
        inputIndex++;
        sendNextInput();
      }, 500);
    } else {
      setTimeout(() => {
        child.stdin.end();
      }, 500);
    }
  };

  sendNextInput();

  child.on('close', (code) => {
    console.log(`\n✅ Test completed with code ${code}`);
  });
}

runTest().catch(console.error);
