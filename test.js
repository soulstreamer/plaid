const https = require('https');

const data = JSON.stringify({ access_token: "access-sandbox-e506e829-d37f-4e53-ab77-3ed65a11b6c7" });

const options = {
  hostname: 'plaid-nine.vercel.app',
  port: 443,
  path: '/api/create_link_token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error(error);
});

req.write(data);
req.end();
