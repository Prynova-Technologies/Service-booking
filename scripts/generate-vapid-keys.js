#!/usr/bin/env node

const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

// Generate VAPID keys
const vapidKeys = webpush.generateVAPIDKeys();

console.log('\nVAPID Keys generated successfully:\n');
console.log(`Public Key:\n${vapidKeys.publicKey}\n`);
console.log(`Private Key:\n${vapidKeys.privateKey}\n`);

// Path to .env file
const envPath = path.join(__dirname, '..', '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found. Please create one based on .env.example');
  process.exit(1);
}

// Read the current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Update or add VAPID keys
if (envContent.includes('VAPID_PUBLIC_KEY=')) {
  // Replace existing keys
  envContent = envContent.replace(
    /VAPID_PUBLIC_KEY=.*/,
    `VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`
  );
  envContent = envContent.replace(
    /VAPID_PRIVATE_KEY=.*/,
    `VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`
  );
} else {
  // Add new keys
  envContent += `\n# Web Push Notifications\nVAPID_PUBLIC_KEY=${vapidKeys.publicKey}\nVAPID_PRIVATE_KEY=${vapidKeys.privateKey}\n`;
  
  // Check if VAPID_SUBJECT exists, if not add a default one
  if (!envContent.includes('VAPID_SUBJECT=')) {
    envContent += `VAPID_SUBJECT=mailto:example@example.com\n`;
  }
}

// Write the updated content back to the .env file
fs.writeFileSync(envPath, envContent);

console.log('VAPID keys have been added to your .env file.');
console.log('Remember to update the VAPID_SUBJECT in your .env file with your actual email address.');