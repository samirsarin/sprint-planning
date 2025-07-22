#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🃏 Samir\'s Sprint Planning - Setup Verification\n');

// Check required files
const requiredFiles = [
  'package.json',
  'server/index.js',
  'client/package.json',
  'client/src/App.js',
  'client/src/components/GameRoom.js',
  'client/src/components/Home.js',
  'client/src/components/VotingCards.js',
  'client/src/components/ParticipantGrid.js',
  'client/src/components/TopicSection.js'
];

console.log('✅ Checking project structure...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} - MISSING`);
    allFilesExist = false;
  }
});

// Check Node.js version
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

console.log('\n✅ Checking Node.js version...');
if (majorVersion >= 16) {
  console.log(`   ✓ Node.js ${nodeVersion} (compatible)`);
} else {
  console.log(`   ✗ Node.js ${nodeVersion} (requires 16.0.0 or higher)`);
  allFilesExist = false;
}

// Check package.json scripts
console.log('\n✅ Checking npm scripts...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = ['dev', 'start', 'server:dev', 'client:dev'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`   ✓ npm run ${script}`);
    } else {
      console.log(`   ✗ npm run ${script} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('   ✗ Could not read package.json');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));

if (allFilesExist) {
  console.log('🎉 Setup verification PASSED!');
  console.log('\nNext steps:');
  console.log('1. Install dependencies: npm install && cd client && npm install && cd ..');
  console.log('2. Start development: npm run dev');
  console.log('3. Open http://localhost:3000 in your browser');
} else {
  console.log('❌ Setup verification FAILED!');
  console.log('\nSome files are missing. Please check the project structure.');
}

console.log('\n📚 For detailed setup instructions, see SETUP.md');
console.log('📖 For full documentation, see README.md'); 