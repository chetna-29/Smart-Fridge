require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('DB connected');

    // Find any user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found');
      return;
    }

    console.log('Found user:', user.email);
    
    // Sign token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'smartfridge_dev_secret_change_this');
    console.log('Signed token:', token);

    // Make request
    const payload = {
      itemName: 'Test Milk',
      category: 'Dairy',
      quantity: '1 carton',
      purchaseDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 5*24*60*60*1000).toISOString().split('T')[0],
      storageType: 'Fridge',
      status: 'Unopened',
      notes: 'Some notes here',
      finishByDate: null,
      consumptionGoalDays: null
    };

    console.log('Sending payload:', payload);

    const response = await fetch('http://localhost:5000/api/food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await mongoose.connection.close();
  }
};

run();
