// Test script to verify the complete PAZHAM PANAM BUY trading flow
const testBuyFlow = async () => {
  console.log('--- Starting PAZHAM PANAM BUY flow test ---');
  
  // 1. Demo Login
  console.log('\nStep 1: Logging in via demo-login...');
  const loginRes = await fetch('http://localhost:5000/api/auth/demo-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  const loginData = await loginRes.json();
  console.log('Login Status:', loginRes.status);
  console.log('User virtualBalance:', loginData.user?.virtualBalance);
  
  if (loginData.user?.virtualBalance !== 10000) {
    throw new Error(`Expected starting balance to be 10000, got: ${loginData.user?.virtualBalance}`);
  }
  const token = loginData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // 2. Fetch bananas to get live price for Nendran
  console.log('\nStep 2: Fetching live banana prices...');
  const bananasRes = await fetch('http://localhost:5000/api/bananas');
  const bananasData = await bananasRes.json();
  const nendran = bananasData.bananas?.find(b => b.symbol === 'NDR' || b.symbol === 'NEN' || b.name?.toLowerCase().includes('nendran'));
  console.log(`Found banana: ${nendran.name} (${nendran.symbol}), Live Price: ₹${nendran.currentPrice}/KG`);

  // 3. Test Invalid Quantities (0, negative, invalid)
  console.log('\nStep 3: Testing invalid quantities rejection (0, -1, NaN)...');
  const zeroQtyRes = await fetch('http://localhost:5000/api/trading/buy', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bananaSymbol: nendran.symbol, quantity: 0, type: 'buy' })
  });
  console.log('0 KG response status (expected 400):', zeroQtyRes.status);
  if (zeroQtyRes.status !== 400) throw new Error('0 quantity was not rejected!');

  const negQtyRes = await fetch('http://localhost:5000/api/trading/buy', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bananaSymbol: nendran.symbol, quantity: -5, type: 'buy' })
  });
  console.log('-5 KG response status (expected 400):', negQtyRes.status);
  if (negQtyRes.status !== 400) throw new Error('Negative quantity was not rejected!');

  // 4. Test Insufficient Balance
  console.log('\nStep 4: Testing insufficient balance rejection (1000 KG)...');
  const excessiveRes = await fetch('http://localhost:5000/api/trading/buy', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bananaSymbol: nendran.symbol, quantity: 1000, type: 'buy' })
  });
  const excessiveData = await excessiveRes.json();
  console.log('Excessive buy status (expected 400):', excessiveRes.status);
  console.log('Excessive buy message:', excessiveData.message);
  if (excessiveRes.status !== 400 || !excessiveData.message.includes('Paisa illa mone')) {
    throw new Error('Excessive buy was not rejected with insufficient funds Manglish message!');
  }

  // 5. Test Valid BUY of 1 KG Nendran
  console.log('\nStep 5: Testing valid BUY of 1 KG Nendran...');
  const buyRes = await fetch('http://localhost:5000/api/trading/buy', {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ bananaSymbol: nendran.symbol, quantity: 1, type: 'buy' })
  });
  const buyData = await buyRes.json();
  console.log('Buy Response Status:', buyRes.status);
  console.log('Buy Success Message:', buyData.message);
  console.log('Balance after buy:', buyData.balance);
  console.log('Transaction:', buyData.transaction);
  console.log('Holding:', buyData.holding);

  if (buyRes.status !== 200 || !buyData.success) {
    throw new Error(`Buy failed with: ${JSON.stringify(buyData)}`);
  }
  const expectedBal = Number((10000 - buyData.transaction.totalValue).toFixed(2));
  if (Math.abs(buyData.balance - expectedBal) > 0.05) {
    throw new Error(`Balance mismatch: expected ${expectedBal}, got ${buyData.balance}`);
  }

  // 6. Verify Portfolio Persistence
  console.log('\nStep 6: Verifying portfolio and holdings...');
  const portRes = await fetch('http://localhost:5000/api/trading/portfolio', {
    headers: authHeaders
  });
  const portData = await portRes.json();
  console.log('Portfolio Holdings Count:', portData.holdings?.length);
  console.log('Portfolio Stats:', portData.portfolio);
  
  const foundHolding = portData.holdings?.find(h => h.banana?.symbol === nendran.symbol || h.banana?.name === nendran.name);
  if (!foundHolding || foundHolding.quantity < 1) {
    throw new Error('Purchased banana not found in portfolio holdings!');
  }
  console.log(`Holding confirmed: ${foundHolding.banana.name}, Qty: ${foundHolding.quantity} KG, Avg Buy: ₹${foundHolding.averageBuyPrice}`);

  // 7. Verify Profile persistence across re-fetch
  console.log('\nStep 7: Verifying user profile persistence...');
  const profRes = await fetch('http://localhost:5000/api/auth/profile', {
    headers: authHeaders
  });
  const profData = await profRes.json();
  console.log('Refetched Profile Balance:', profData.user?.virtualBalance);
  if (Math.abs(profData.user?.virtualBalance - expectedBal) > 0.05) {
    throw new Error('Profile balance was not persisted!');
  }

  console.log('\n🎉 ALL BUY FLOW CHECKS PASSED SUCCESSFULLY! 🎉\n');
};

testBuyFlow().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
