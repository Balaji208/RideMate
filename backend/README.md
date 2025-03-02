# RideMate Backend API Documentation

## User Registration Endpoint

### **POST /users/register**

This endpoint registers a new user in the RideMate application. It validates the provided data and returns a JWT token along with the user details upon successful registration.

### **Request**

- **URL:** `/users/register`
- **Method:** `POST`
- **Headers:**
  - `Content-Type: application/json`
- **Request Body:**
  
  ```json
  {
    "fullName": {
      "firstName": "John",
      "lastName": "Doe"
    },
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```

### **Response**

#### ✅ **Success Response**

- **Status Code:** `201 Created`
- **Response Body:**

  ```json
  {
    "user": {
      "_id": "60c72b2f9b1d8e001c8e4b8a",
      "fullName": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "email": "john.doe@example.com",
      "password": "<hashed-password>",
      "socketID": null
    },
    "token": "JWT_TOKEN_HERE"
  }
  ```

#### ❌ **Error Response**

- **Status Code:** `400 Bad Request`
- **Response Body:** Returns validation error details if any required field is missing or invalid.

  ```json
  {
    "errors": [
      {
        "msg": "Invalid Email Address",
        "param": "email",
        "location": "body"
      },
      {
        "msg": "First name must be at least 3 characters long.",
        "param": "fullName.firstName",
        "location": "body"
      },
      {
        "msg": "Password must be at least 6 characters long.",
        "param": "password",
        "location": "body"
      }
    ]
  }
  ```

### **Example cURL Request**

```sh
curl -X POST http://localhost:3000/users/register \
-H "Content-Type: application/json" \
-d '{
  "fullName": {
    "firstName": "John",
    "lastName": "Doe"
  },
  "email": "john.doe@example.com",
  "password": "password123"
}'
```

### **Additional Information**

- **🔒 Password Handling:** The password is securely hashed before being stored in the database.
- **🔑 Token Generation:** A JWT token is generated using the user's ID and a secret (`JWT_SECRET` from your environment variables) on successful registration. This token is returned for use in subsequent authenticated requests.