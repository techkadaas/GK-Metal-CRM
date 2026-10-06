const API_BASE = 'https://gk-metal-backend.onrender.com/api';

async function testLiveBackend() {
  console.log('--- Testing Live Deployed Backend ---');

  // 1. Check Health
  const healthRes = await fetch(`${API_BASE}/health`);
  const health = await healthRes.json();
  console.log('✓ Health Endpoint:', health);

  // 2. Create Test Customer
  const custPayload = {
    companyName: 'Production Verification Lab Pvt Ltd',
    contactPerson: 'Live Tester',
    email: 'live_test@gkmetal.com',
    phone: '9988776655',
    billingAddress: {
      street: '456 Industrial Estate',
      city: 'Trichy',
      state: 'Tamil Nadu',
      stateCode: '33',
      pincode: '620002'
    }
  };

  console.log('Creating customer on live backend...');
  const custRes = await fetch(`${API_BASE}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(custPayload)
  });

  const custData = await custRes.json();
  console.log('✓ Create Customer Response:', custRes.status, custData.success ? 'SUCCESS' : 'FAILED', custData.data?.customerId || custData.message);

  if (!custData.success) {
    console.error('Customer creation failed:', custData);
    process.exit(1);
  }

  const createdCustId = custData.data._id || custData.data.customerId;

  // 3. Create Test Invoice
  const invPayload = {
    customer: createdCustId,
    buyerSnapshot: {
      companyName: 'Production Verification Lab Pvt Ltd',
      contactPerson: 'Live Tester',
      email: 'live_test@gkmetal.com',
      phone: '9988776655',
      billingAddress: {
        street: '456 Industrial Estate',
        city: 'Trichy',
        state: 'Tamil Nadu',
        stateCode: '33',
        pincode: '620002'
      }
    },
    items: [
      {
        slNo: 1,
        description: 'Hardness Testing Service (Live Test)',
        hsnSac: '998346',
        quantity: 2,
        rate: 1500,
        taxableAmount: 3000
      }
    ],
    subtotal: 3000,
    taxableTotal: 3000,
    grandTotal: 3540,
    amountInWords: 'INR Three Thousand Five Hundred and Forty Rupees Only',
    notes: 'Test invoice generated during verification.'
  };

  console.log('Creating invoice on live backend...');
  const invRes = await fetch(`${API_BASE}/invoices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(invPayload)
  });

  const invData = await invRes.json();
  console.log('✓ Create Invoice Response:', invRes.status, invData.success ? 'SUCCESS' : 'FAILED', invData.data?.invoiceNumber || invData.message);

  if (!invData.success) {
    console.error('Invoice creation failed:', invData);
    process.exit(1);
  }

  // 4. Fetch Customers and Invoices to verify persistence
  const getCustsRes = await fetch(`${API_BASE}/customers`);
  const getCustsData = await getCustsRes.json();
  console.log(`✓ Fetched ${getCustsData.count || getCustsData.data?.length} customers from live database.`);

  const getInvsRes = await fetch(`${API_BASE}/invoices`);
  const getInvsData = await getInvsRes.json();
  console.log(`✓ Fetched ${getInvsData.count || getInvsData.data?.length} invoices from live database.`);

  console.log('--- ALL LIVE BACKEND TESTS PASSED SUCCESSFULLY! ---');
}

testLiveBackend().catch(err => {
  console.error('Live backend test error:', err);
  process.exit(1);
});
