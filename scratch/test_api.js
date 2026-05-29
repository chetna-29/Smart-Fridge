const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  const randomSuffix = Math.floor(Math.random() * 10000);
  const testUser = {
    name: 'Test User',
    email: `testuser_${randomSuffix}@example.com`,
    password: 'password123',
  };

  console.log('--- STARTING BACKEND REST API TESTS ---');

  try {
    // 1. Register
    console.log('\n1. Testing POST /api/auth/register...');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    console.log('Register Response Status:', regRes.status);
    console.log('Register Response Data:', JSON.stringify(regData, null, 2));

    if (!regData.success) throw new Error('Registration failed');
    const token = regData.data.token;

    // 2. Login
    console.log('\n2. Testing POST /api/auth/login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const loginData = await loginRes.json();
    console.log('Login Response Status:', loginRes.status);
    console.log('Login Response Data:', JSON.stringify(loginData, null, 2));

    if (!loginData.success) throw new Error('Login failed');

    // 3. Get Profile
    console.log('\n3. Testing GET /api/auth/profile...');
    const profileRes = await fetch(`${BASE_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const profileData = await profileRes.json();
    console.log('Profile Response Status:', profileRes.status);
    console.log('Profile Response Data:', JSON.stringify(profileData, null, 2));

    if (!profileData.success) throw new Error('Profile fetch failed');

    // 4. Suggest Expiry
    console.log('\n4. Testing GET /api/food/suggest-expiry...');
    const suggestRes = await fetch(`${BASE_URL}/food/suggest-expiry?itemName=milk&category=Dairy`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const suggestData = await suggestRes.json();
    console.log('Suggest Expiry Response Status:', suggestRes.status);
    console.log('Suggest Expiry Response Data:', JSON.stringify(suggestData, null, 2));

    // 5. Add Food Item
    console.log('\n5. Testing POST /api/food...');
    const foodItem = {
      itemName: 'Milk Carton',
      category: 'Dairy',
      quantity: '1 liter',
      storageType: 'Fridge',
      status: 'Unopened',
    };
    const addRes = await fetch(`${BASE_URL}/food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(foodItem),
    });
    const addData = await addRes.json();
    console.log('Add Food Response Status:', addRes.status);
    console.log('Add Food Response Data:', JSON.stringify(addData, null, 2));

    if (!addData.success) throw new Error('Add food item failed');
    const foodId = addData.data._id;

    // 6. Get Food Items
    console.log('\n6. Testing GET /api/food...');
    const getRes = await fetch(`${BASE_URL}/food`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const getData = await getRes.json();
    console.log('Get Food Items Status:', getRes.status);
    console.log('Count:', getData.count);
    console.log('First Item Expiry Date:', getData.data[0].expiryDate);

    // 7. Update Food Item
    console.log('\n7. Testing PUT /api/food/:id...');
    const updateRes = await fetch(`${BASE_URL}/food/${foodId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Opened' }),
    });
    const updateData = await updateRes.json();
    console.log('Update Food Response Status:', updateRes.status);
    console.log('Updated Status:', updateData.data.status);

    // 8. Delete Food Item
    console.log('\n8. Testing DELETE /api/food/:id...');
    const deleteRes = await fetch(`${BASE_URL}/food/${foodId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const deleteData = await deleteRes.json();
    console.log('Delete Food Response Status:', deleteRes.status);
    console.log('Delete Response Data:', JSON.stringify(deleteData, null, 2));

    console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(error.message);
  }
}

runTests();
