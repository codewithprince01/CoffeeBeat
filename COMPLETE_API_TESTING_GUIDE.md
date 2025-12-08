# Coffee Beat - Complete API Testing Guide

## Table of Contents
1. [Postman Collection Setup](#postman-collection-setup)
2. [Environment Configuration](#environment-configuration)
3. [API Endpoints with Raw Data](#api-endpoints-with-raw-data)
4. [Testing Order](#testing-order)
5. [Expected Responses](#expected-responses)
6. [Troubleshooting](#troubleshooting)

---

## Postman Collection Setup

### Complete Postman Collection JSON

Copy this complete JSON and import into Postman:

```json
{
  "info": {
    "_postman_id": "coffee-beat-complete-api",
    "name": "Coffee Beat Complete API",
    "description": "Complete API testing collection for Coffee Shop Management System",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "pm.test(\"Response has tokens\", function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('token');",
                  "    pm.expect(jsonData).to.have.property('refreshToken');",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"name\": \"Test Customer\",\n    \"email\": \"customer@test.com\",\n    \"password\": \"Password123!\",\n    \"confirmPassword\": \"Password123!\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/register",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "register"]
            }
          }
        },
        {
          "name": "Login",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test(\"Response has tokens\", function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('token');",
                  "    pm.expect(jsonData).to.have.property('refreshToken');",
                  "});",
                  "",
                  "// Store tokens for future requests",
                  "if (pm.response.code === 200) {",
                  "    const jsonData = pm.response.json();",
                  "    pm.environment.set(\"authToken\", jsonData.token);",
                  "    pm.environment.set(\"refreshToken\", jsonData.refreshToken);",
                  "    pm.environment.set(\"userEmail\", jsonData.user.email);",
                  "    pm.environment.set(\"userRole\", jsonData.user.role);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"email\": \"admin@coffee.test\",\n    \"password\": \"Password123!\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/login",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Refresh Token",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test(\"Response has new token\", function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('token');",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{refreshToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/refresh",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "refresh"]
            }
          }
        },
        {
          "name": "Get Current User",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test(\"Response has user data\", function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('email');",
                  "    pm.expect(jsonData).to.have.property('role');",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/auth/me",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "me"]
            }
          }
        },
        {
          "name": "Logout",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "// Clear environment variables",
                  "pm.environment.unset(\"authToken\");",
                  "pm.environment.unset(\"refreshToken\");",
                  "pm.environment.unset(\"userEmail\");",
                  "pm.environment.unset(\"userRole\");"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/auth/logout",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "logout"]
            }
          }
        },
        {
          "name": "Update Profile",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"name\": \"Updated User Name\",\n    \"phone\": \"+1234567890\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/profile",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "profile"]
            }
          }
        },
        {
          "name": "Change Password",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"currentPassword\": \"Password123!\",\n    \"newPassword\": \"NewPassword123!\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/auth/change-password",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "change-password"]
            }
          }
        },
        {
          "name": "Create Invite Token (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "// Store invite token for testing",
                  "if (pm.response.code === 201) {",
                  "    const jsonData = pm.response.json();",
                  "    pm.environment.set(\"inviteToken\", jsonData.token);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/auth/invite?email=staff@test.com&role=ROLE_CHEF",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "invite"],
              "query": [
                {
                  "key": "email",
                  "value": "staff@test.com"
                },
                {
                  "key": "role",
                  "value": "ROLE_CHEF"
                }
              ]
            }
          }
        },
        {
          "name": "Validate Invite Token",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/auth/validate-invite/{{inviteToken}}",
              "host": ["{{baseUrl}}"],
              "path": ["auth", "validate-invite", "{{inviteToken}}"]
            }
          }
        }
      ]
    },
    {
      "name": "Products",
      "item": [
        {
          "name": "Get All Products",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});",
                  "",
                  "pm.test(\"Response has products\", function () {",
                  "    const jsonData = pm.response.json();",
                  "    pm.expect(jsonData).to.have.property('content');",
                  "    pm.expect(jsonData.content).to.be.an('array');",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products?page=0&size=10&sortBy=name&sortDir=asc",
              "host": ["{{baseUrl}}"],
              "path": ["products"],
              "query": [
                {
                  "key": "page",
                  "value": "0"
                },
                {
                  "key": "size",
                  "value": "10"
                },
                {
                  "key": "sortBy",
                  "value": "name"
                },
                {
                  "key": "sortDir",
                  "value": "asc"
                }
              ]
            }
          }
        },
        {
          "name": "Get Product by ID",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products/{{productId}}",
              "host": ["{{baseUrl}}"],
              "path": ["products", "{{productId}}"]
            }
          }
        },
        {
          "name": "Get Product by Slug",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products/slug/test-coffee",
              "host": ["{{baseUrl}}"],
              "path": ["products", "slug", "test-coffee"]
            }
          }
        },
        {
          "name": "Create Product (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "// Store created product ID",
                  "if (pm.response.code === 201) {",
                  "    const jsonData = pm.response.json();",
                  "    pm.environment.set(\"productId\", jsonData.id);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"name\": \"Test Coffee\",\n    \"slug\": \"test-coffee\",\n    \"price\": 4.99,\n    \"stock\": 100,\n    \"description\": \"A delicious test coffee\",\n    \"category\": \"COFFEE\",\n    \"imageUrl\": \"https://example.com/coffee.jpg\",\n    \"ingredients\": [\"Coffee Beans\", \"Water\"],\n    \"allergens\": []\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/products",
              "host": ["{{baseUrl}}"],
              "path": ["products"]
            }
          }
        },
        {
          "name": "Update Product (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"name\": \"Updated Test Coffee\",\n    \"slug\": \"test-coffee\",\n    \"price\": 5.99,\n    \"stock\": 150,\n    \"description\": \"An updated delicious test coffee\",\n    \"category\": \"COFFEE\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/products/{{productId}}",
              "host": ["{{baseUrl}}"],
              "path": ["products", "{{productId}}"]
            }
          }
        },
        {
          "name": "Update Product Stock (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PATCH",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"stock\": 200\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/products/{{productId}}/stock",
              "host": ["{{baseUrl}}"],
              "path": ["products", "{{productId}}", "stock"]
            }
          }
        },
        {
          "name": "Get Product Categories",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products/categories",
              "host": ["{{baseUrl}}"],
              "path": ["products", "categories"]
            }
          }
        },
        {
          "name": "Get In Stock Products",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products/in-stock",
              "host": ["{{baseUrl}}"],
              "path": ["products", "in-stock"]
            }
          }
        },
        {
          "name": "Get Low Stock Products (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/products/low-stock",
              "host": ["{{baseUrl}}"],
              "path": ["products", "low-stock"]
            }
          }
        },
        {
          "name": "Get Product Stats (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/products/stats",
              "host": ["{{baseUrl}}"],
              "path": ["products", "stats"]
            }
          }
        },
        {
          "name": "Search Products",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/products/search?q=coffee&page=0&size=10",
              "host": ["{{baseUrl}}"],
              "path": ["products", "search"],
              "query": [
                {
                  "key": "q",
                  "value": "coffee"
                },
                {
                  "key": "page",
                  "value": "0"
                },
                {
                  "key": "size",
                  "value": "10"
                }
              ]
            }
          }
        },
        {
          "name": "Delete Product (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 204\", function () {",
                  "    pm.response.to.have.status(204);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/products/{{productId}}",
              "host": ["{{baseUrl}}"],
              "path": ["products", "{{productId}}"]
            }
          }
        }
      ]
    },
    {
      "name": "Orders",
      "item": [
        {
          "name": "Create Order",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "// Store order ID",
                  "if (pm.response.code === 201) {",
                  "    const jsonData = pm.response.json();",
                  "    pm.environment.set(\"orderId\", jsonData.id);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"items\": [\n        {\n            \"productId\": \"{{productId}}\",\n            \"quantity\": 2,\n            \"price\": 4.99,\n            \"specialInstructions\": \"Extra sugar\"\n        }\n    ],\n    \"totalAmount\": 9.98,\n    \"orderType\": \"DINE_IN\",\n    \"tableNumber\": \"T1\",\n    \"specialInstructions\": \"Order for table T1\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/orders",
              "host": ["{{baseUrl}}"],
              "path": ["orders"]
            }
          }
        },
        {
          "name": "Get Order by ID",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/{{orderId}}",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "{{orderId}}"]
            }
          }
        },
        {
          "name": "Get My Orders",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/my-orders?page=0&size=10",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "my-orders"],
              "query": [
                {
                  "key": "page",
                  "value": "0"
                },
                {
                  "key": "size",
                  "value": "10"
                }
              ]
            }
          }
        },
        {
          "name": "Update Order Status",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"status\": \"PREPARING\",\n    \"chefId\": \"{{chefId}}\",\n    \"waiterId\": \"{{waiterId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/orders/{{orderId}}/status",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "{{orderId}}", "status"]
            }
          }
        },
        {
          "name": "Cancel Order",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/{{orderId}}/cancel",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "{{orderId}}", "cancel"]
            }
          }
        },
        {
          "name": "Get All Orders (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders?page=0&size=20&status=PENDING",
              "host": ["{{baseUrl}}"],
              "path": ["orders"],
              "query": [
                {
                  "key": "page",
                  "value": "0"
                },
                {
                  "key": "size",
                  "value": "20"
                },
                {
                  "key": "status",
                  "value": "PENDING"
                }
              ]
            }
          }
        },
        {
          "name": "Get Chef Orders",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/chef-orders",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "chef-orders"]
            }
          }
        },
        {
          "name": "Get Waiter Orders",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/waiter-orders",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "waiter-orders"]
            }
          }
        },
        {
          "name": "Get Orders Needing Chef",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/needing-chef",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "needing-chef"]
            }
          }
        },
        {
          "name": "Get Orders Needing Waiter",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/needing-waiter",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "needing-waiter"]
            }
          }
        },
        {
          "name": "Get Order Stats (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/stats",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "stats"]
            }
          }
        },
        {
          "name": "Get Today's Orders (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/orders/today",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "today"]
            }
          }
        },
        {
          "name": "Assign Order to Chef (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"chefId\": \"{{chefId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/orders/{{orderId}}/assign-chef",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "{{orderId}}", "assign-chef"]
            }
          }
        },
        {
          "name": "Assign Order to Waiter (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"waiterId\": \"{{waiterId}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/orders/{{orderId}}/assign-waiter",
              "host": ["{{baseUrl}}"],
              "path": ["orders", "{{orderId}}", "assign-waiter"]
            }
          }
        }
      ]
    },
    {
      "name": "Bookings",
      "item": [
        {
          "name": "Create Booking",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 201\", function () {",
                  "    pm.response.to.have.status(201);",
                  "});",
                  "",
                  "// Store booking ID",
                  "if (pm.response.code === 201) {",
                  "    const jsonData = pm.response.json();",
                  "    pm.environment.set(\"bookingId\", jsonData.id);",
                  "}"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"tableNumber\": \"T1\",\n    \"bookingDate\": \"2024-12-25T18:00:00\",\n    \"numberOfGuests\": 4,\n    \"specialRequests\": \"Window seat preferred\",\n    \"customerName\": \"John Doe\",\n    \"customerPhone\": \"+1234567890\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/bookings",
              "host": ["{{baseUrl}}"],
              "path": ["bookings"]
            }
          }
        },
        {
          "name": "Get Booking by ID",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/bookings/{{bookingId}}",
              "host": ["{{baseUrl}}"],
              "path": ["bookings", "{{bookingId}}"]
            }
          }
        },
        {
          "name": "Get My Bookings",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/bookings/my-bookings",
              "host": ["{{baseUrl}}"],
              "path": ["bookings", "my-bookings"]
            }
          }
        },
        {
          "name": "Update Booking",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n    \"tableNumber\": \"T2\",\n    \"bookingDate\": \"2024-12-25T19:00:00\",\n    \"numberOfGuests\": 5,\n    \"specialRequests\": \"Updated window seat request\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/bookings/{{bookingId}}",
              "host": ["{{baseUrl}}"],
              "path": ["bookings", "{{bookingId}}"]
            }
          }
        },
        {
          "name": "Cancel Booking",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/bookings/{{bookingId}}/cancel",
              "host": ["{{baseUrl}}"],
              "path": ["bookings", "{{bookingId}}", "cancel"]
            }
          }
        },
        {
          "name": "Complete Booking",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{authToken}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/bookings/{{bookingId}}/complete",
              "host": ["{{baseUrl}}"],
              "path": ["bookings", "{{bookingId}}", "complete"]
            }
          }
        },
        {
          "name": "Check Table Availability",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          ],
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/bookings/check-availability?tableNumber=T1&timeSlot=2024-12-25T18:00:00",
              "host": ["{{baseUrl}}"],
              "path": ["bookings", "check-availability"],
              "query": [
                {
                  "key": "tableNumber",
                  "value": "T1"
                },
                {
                  "key": "timeSlot",
                  "value": "2024-12-25T18:00:00"
                }
              ]
            }
          }
        },
        {
          "name": "Get All Bookings (Admin)",
          "event": [
            {
              "listen": "test",
              "script": {
                "exec": [
                  "pm.test(\"Status code is 200\", function () {",
                  "    pm.response.to.have.status(200);",
                  "});"
                ],
                "type": "text/javascript"
              }
            }
          . . .
