const express = require('express');
const cors = require('cors');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const app = express();
app.use(cors());
app.use(express.json());

// Set up the Plaid client
// Vercel will inject these from Environment Variables
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox, // Can be changed to development or production
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// 1. Endpoint to create a link_token for the Plaid Link flow
app.post('/api/create_link_token', async (req, res) => {
  try {
    const request = {
      user: {
        // This should be a unique ID for the user
        client_user_id: 'user-id-' + Math.random(),
      },
      client_name: 'NormalCredit',
      products: ['auth', 'transactions'],
      language: 'ro', // Romanian interface
      country_codes: ['RO', 'US', 'GB'],
    };
    
    // If you want to force update an existing access token you provided:
    // "access-sandbox-e506e829-d37f-4e53-ab77-3ed65a11b6c7"
    if (req.body.access_token) {
       request.access_token = req.body.access_token;
    }

    const response = await client.linkTokenCreate(request);
    res.json(response.data);
  } catch (error) {
    console.error('Error in create_link_token:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint to exchange public_token and get balance + transactions
app.post('/api/exchange_public_token_and_get_data', async (req, res) => {
  try {
    const publicToken = req.body.public_token;
    
    // Exchange the public token for an access token
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    });
    const accessToken = exchangeResponse.data.access_token;
    
    // Get account balances
    const authResponse = await client.authGet({
      access_token: accessToken,
    });
    
    // Get transactions (last 30 days as an example)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const transactionsResponse = await client.transactionsGet({
      access_token: accessToken,
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: now.toISOString().split('T')[0],
    });

    res.json({
      access_token: accessToken, // you can store this internally
      balance: authResponse.data.accounts,
      transactions: transactionsResponse.data.transactions,
    });
  } catch (error) {
    console.error('Error in exchange_public_token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server (for local testing)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Plaid Server is running on port ${PORT}`);
});

module.exports = app;
