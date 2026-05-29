# Smart Fridge AI - Server

API server built with Node.js, Express, and MongoDB. Features:
- JWT authentication
- Food item CRUD
- Expiry prediction using shelf-life dataset

Setup

1. Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.
2. Install dependencies: `npm install` inside `server/`.
3. Run: `npm run dev` (requires `nodemon`) or `npm start`.
