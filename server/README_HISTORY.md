# Food Inventory History and Analytics API

All endpoints require `Authorization: Bearer <token>`.

## History Endpoints

```http
GET /api/history
GET /api/history/:id
GET /api/history/recent?limit=10
GET /api/history/stats
GET /api/history/monthly
GET /api/history/top-items?limit=5
GET /api/history/export?format=csv
GET /api/history/export?format=excel
GET /api/history/export?format=pdf
```

Filters for `GET /api/history` and exports:

```http
GET /api/history?search=milk&category=Dairy&storageType=Fridge&actionType=added&startDate=2026-05-01&endDate=2026-05-31
```

## Inventory Mutations That Create History

```http
POST /api/food
Content-Type: application/json

{
  "itemName": "Milk",
  "category": "Dairy",
  "quantity": "2 liters",
  "purchaseDate": "2026-05-29",
  "expiryDate": "2026-06-04",
  "storageType": "Fridge",
  "status": "Unopened"
}
```

Creates a `History` record with `actionType: "added"`.

```http
PATCH /api/food/:id/consume
```

Creates a `History` record with `actionType: "consumed"` and removes the active inventory item.

```http
DELETE /api/food/:id
DELETE /api/food/:id?actionType=expired
```

Creates a `History` record with `actionType: "deleted"` or `"expired"` and removes the active inventory item.

## Sample Responses

```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "_id": "6658f0c6b129b2bb87a5d001",
      "userId": "6658efc6b129b2bb87a5d000",
      "itemName": "Milk",
      "category": "Dairy",
      "quantity": "2 liters",
      "purchaseDate": "2026-05-29T00:00:00.000Z",
      "expiryDate": "2026-06-04T00:00:00.000Z",
      "storageType": "Fridge",
      "status": "Unopened",
      "actionType": "added",
      "createdAt": "2026-05-29T16:10:00.000Z",
      "updatedAt": "2026-05-29T16:10:00.000Z"
    }
  ]
}
```

```json
{
  "success": true,
  "data": {
    "totalItemsEverAdded": 42,
    "totalActiveItems": 18,
    "totalExpiredItems": 3,
    "totalConsumedItems": 12,
    "totalDeletedItems": 4,
    "totalInventoryValue": null,
    "mostPurchasedItems": [
      { "itemName": "Milk", "category": "Dairy", "count": 6 }
    ],
    "monthlyPurchaseTrends": [
      { "year": 2026, "month": 5, "label": "2026-05", "total": 14 }
    ],
    "weeklyPurchaseTrends": [
      { "year": 2026, "week": 22, "label": "2026-W22", "total": 6 }
    ],
    "categoryWiseStatistics": [
      { "category": "Dairy", "total": 9, "quantityEntries": ["2 liters"] }
    ],
    "frequentlyWastedItems": [
      { "itemName": "Bread", "category": "Bakery", "count": 2 }
    ]
  }
}
```

## Postman Examples

1. Register or log in with `POST /api/auth/login`.
2. Copy `data.token` from the response.
3. Add header `Authorization: Bearer <token>`.
4. Create inventory with `POST /api/food`.
5. Confirm immutable history with `GET /api/history`.
6. Mark an item consumed with `PATCH /api/food/:id/consume`.
7. Confirm analytics with `GET /api/history/stats`.
8. Export with `GET /api/history/export?format=csv`.

The `History` collection includes metadata fields reserved for future consumption prediction, shopping recommendations, waste prediction, and smart grocery planning.
