# Smart Fridge Backend API

Complete REST API backend for a Smart Fridge application built with Node.js, Express.js, MongoDB, and Mongoose.

## Features

- ✅ User authentication (Register/Login with JWT)
- ✅ Food item CRUD operations
- ✅ Automatic expiry date calculation based on shelf-life data
- ✅ Food status tracking (Fresh, Expiring Soon, Expired)
- ✅ Dashboard statistics
- ✅ MongoDB Atlas integration
- ✅ Password hashing with bcryptjs
- ✅ Role-based access control
- ✅ Comprehensive error handling
- ✅ CORS support

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcryptjs
- **Middleware:** CORS, dotenv

## Prerequisites

- Node.js v14+
- npm or yarn
- MongoDB Atlas account
- Postman (for API testing)

## Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env` file** (copy from `.env.example`)
   ```bash
   cp .env.example .env
   ```

4. **Update `.env` with your credentials**
   ```
   PORT=5000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:3000
   NODE_ENV=development
   ```

5. **Start the server**
   ```bash
   node index.js
   # or for development with auto-reload
   npm install -g nodemon
   nodemon index.js
   ```

## API Documentation

### Base URL
```
http://localhost:5000/api
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "63f7b8c1a2b3c4d5e6f7g8h9",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### 2. Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "63f7b8c1a2b3c4d5e6f7g8h9",
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

---

### 3. Get Current User
**GET** `/auth/me`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "63f7b8c1a2b3c4d5e6f7g8h9",
    "username": "john_doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Food Items Endpoints

### 1. Add Food Item
**POST** `/foods/add`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "itemName": "Milk",
  "category": "dairy",
  "quantity": 1,
  "purchaseDate": "2024-01-15",
  "storageType": "fridge",
  "notes": "Whole milk, 1 liter"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Food item added successfully",
  "data": {
    "_id": "63f7b8c1a2b3c4d5e6f7g8h9",
    "userId": "63f7b8c0a2b3c4d5e6f7g8h8",
    "itemName": "Milk",
    "category": "dairy",
    "quantity": 1,
    "purchaseDate": "2024-01-15T00:00:00Z",
    "expiryDate": "2024-01-22T00:00:00Z",
    "storageType": "fridge",
    "status": "fresh",
    "daysLeft": 7,
    "notes": "Whole milk, 1 liter",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 2. Get All Food Items
**GET** `/foods`

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `status` (optional): `fresh`, `expiring_soon`, `expired`
- `category` (optional): `dairy`, `fruits`, `vegetables`, `grains`, `meat`, `other`

**Example:** `GET /foods?status=fresh&category=dairy`

**Response (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "63f7b8c1a2b3c4d5e6f7g8h9",
      "itemName": "Milk",
      "category": "dairy",
      "quantity": 1,
      "purchaseDate": "2024-01-15T00:00:00Z",
      "expiryDate": "2024-01-22T00:00:00Z",
      "storageType": "fridge",
      "status": "fresh",
      "daysLeft": 7,
      "notes": "Whole milk, 1 liter"
    }
  ]
}
```

---

### 3. Get Specific Food Item
**GET** `/foods/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "63f7b8c1a2b3c4d5e6f7g8h9",
    "itemName": "Milk",
    "category": "dairy",
    "quantity": 1,
    "purchaseDate": "2024-01-15T00:00:00Z",
    "expiryDate": "2024-01-22T00:00:00Z",
    "storageType": "fridge",
    "status": "fresh",
    "daysLeft": 7,
    "notes": "Whole milk, 1 liter"
  }
}
```

---

### 4. Update Food Item
**PUT** `/foods/:id`

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "quantity": 2,
  "storageType": "freezer"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Food item updated successfully",
  "data": {
    "_id": "63f7b8c1a2b3c4d5e6f7g8h9",
    "itemName": "Milk",
    "category": "dairy",
    "quantity": 2,
    "storageType": "freezer",
    "status": "fresh",
    "daysLeft": 7
  }
}
```

---

### 5. Delete Food Item
**DELETE** `/foods/:id`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Food item deleted successfully"
}
```

---

### 6. Get Expiring Foods (1-3 days)
**GET** `/foods/expiring/soon`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "message": "2 items expiring soon",
  "data": [
    {
      "_id": "63f7b8c1a2b3c4d5e6f7g8h9",
      "itemName": "Banana",
      "category": "fruits",
      "status": "expiring_soon",
      "daysLeft": 2,
      "expiryDate": "2024-01-17T00:00:00Z"
    }
  ]
}
```

---

### 7. Get Expired Foods
**GET** `/foods/expired/list`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "count": 1,
  "message": "1 items expired",
  "data": [
    {
      "_id": "63f7b8c1a2b3c4d5e6f7g8h9",
      "itemName": "Yogurt",
      "category": "dairy",
      "status": "expired",
      "daysLeft": -2,
      "expiryDate": "2024-01-13T00:00:00Z"
    }
  ]
}
```

---

### 8. Get Dashboard Statistics
**GET** `/foods/dashboard/stats`

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalItems": 10,
    "fresh": 7,
    "expiringsSoon": 2,
    "expired": 1,
    "byCategory": {
      "dairy": 3,
      "fruits": 4,
      "vegetables": 2,
      "grains": 1
    }
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Please provide all required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "No token, authorization denied"
}
```

### 403 Forbidden
```json
{
  "error": "Not authorized to access this item"
}
```

### 404 Not Found
```json
{
  "error": "Food item not found"
}
```

### 500 Server Error
```json
{
  "error": "Server error"
}
```

---

## Food Categories

- `dairy` - Milk, yogurt, cheese, butter
- `fruits` - Apples, bananas, oranges, etc.
- `vegetables` - Carrots, broccoli, spinach, etc.
- `grains` - Bread, rice, pasta, cereal
- `meat` - Chicken, beef, pork, fish
- `other` - Juice, eggs, nuts, honey

---

## Storage Types

- `fridge` - Refrigerator
- `freezer` - Freezer
- `pantry` - Pantry
- `counter` - Counter

---

## Food Status

- **Fresh** - More than 3 days left
- **Expiring Soon** - 1-3 days left
- **Expired** - 0 or fewer days

---

## Shelf Life Data

Default shelf life in days for common foods:

| Item | Days |
|------|------|
| Milk | 7 |
| Yogurt | 14 |
| Cheese | 30 |
| Apple | 14 |
| Banana | 5 |
| Bread | 4 |
| Chicken | 2 |
| Fish | 1 |
| Eggs | 28 |

See `data/shelfLife.json` for complete list.

---

## Testing with Postman

### Import Collection

1. Create a new Postman collection
2. Add the following requests:

#### Register
```
POST http://localhost:5000/api/auth/register
Body (JSON):
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123",
  "confirmPassword": "Test123"
}
```

#### Login
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "test@example.com",
  "password": "Test123"
}
```

#### Add Food
```
POST http://localhost:5000/api/foods/add
Headers:
Authorization: Bearer {token_from_login}

Body (JSON):
{
  "itemName": "Milk",
  "category": "dairy",
  "quantity": 1,
  "purchaseDate": "2024-01-15",
  "storageType": "fridge"
}
```

#### Get All Foods
```
GET http://localhost:5000/api/foods
Headers:
Authorization: Bearer {token}
```

#### Get Expiring Foods
```
GET http://localhost:5000/api/foods/expiring/soon
Headers:
Authorization: Bearer {token}
```

#### Get Dashboard Stats
```
GET http://localhost:5000/api/foods/dashboard/stats
Headers:
Authorization: Bearer {token}
```

---

## Project Structure

```
backend/
├── models/
│   ├── User.js          # User model with password hashing
│   └── FoodItem.js      # Food item model with expiry calculation
├── controllers/
│   ├── authController.js     # Auth logic (register, login, me)
│   └── foodController.js     # Food CRUD logic
├── routes/
│   ├── auth.js          # Auth routes
│   └── food.js          # Food routes
├── middleware/
│   └── auth.js          # JWT verification middleware
├── utils/
│   └── expiry.js        # Expiry calculation utilities
├── data/
│   └── shelfLife.json   # Shelf life dataset
├── index.js             # Main server file
├── package.json         # Dependencies
├── .env                 # Environment variables
└── README.md            # This file
```

---

## Environment Variables

Create a `.env` file in the backend folder:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## Future Enhancements

- [ ] AI-powered food recognition
- [ ] Image upload for food items
- [ ] Recipe suggestions based on available foods
- [ ] Expiry notifications via email/SMS
- [ ] Share fridge with family members
- [ ] Barcode scanning
- [ ] Meal planning integration
- [ ] Shopping list generation
- [ ] Budget tracking
- [ ] Integration with smart fridge devices

---

## Troubleshooting

### MongoDB Connection Error
- Verify `MONGO_URI` in `.env`
- Check MongoDB Atlas network access (allow your IP)
- Ensure database user credentials are correct

### JWT Token Errors
- Ensure `Authorization` header is in format: `Bearer {token}`
- Check if token has expired (tokens expire in 7 days)
- Verify `JWT_SECRET` matches in `.env`

### CORS Errors
- Check `FRONTEND_URL` in `.env` matches your client URL
- Verify CORS middleware is enabled in index.js

---

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

## License

MIT License - Feel free to use this project for personal or commercial purposes.

---

**Built with ❤️ for Smart Fridge Application**
