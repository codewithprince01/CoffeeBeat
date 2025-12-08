
# 1. Login as Customer
$loginResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"customer@coffee.test","password":"Password123!"}'
$token = $loginResponse.accessToken
Write-Host "Customer Token: $token"

# 2. Create Order
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$orderBody = @{
    "items" = @(
        @{
            "productId" = "espresso" # Assuming product IDs from DataSeeder match slugs or IDs. Let's check DataSeeder product IDs. 
            # DataSeeder doesn't explicitly set IDs, they are auto-generated. 
            # But the product SLUG is usually unique. Let's try to lookup ID first or just guess.
            # Actually, OrderService expects productId to be the ID, not slug.
            # I should fetch products first to get a valid ID.
            "quantity" = 1
        }
    )
    "notes" = "Test Realtime Order"
}

# Fetch products to get a valid ID
$products = Invoke-RestMethod -Uri "http://localhost:8081/api/products" -Method Get
$productId = $products.data[0].id
Write-Host "Product ID: $productId"

$orderBody.items[0].productId = $productId
$jsonBody = $orderBody | ConvertTo-Json -Depth 3

Write-Host "Creating Order..."
try {
    $orderResponse = Invoke-RestMethod -Uri "http://localhost:8081/api/orders" -Method Post -Headers $headers -Body $jsonBody -ContentType "application/json"
    Write-Host "Order Created: $($orderResponse.id)"
} catch {
    Write-Host "Error creating order: $_"
    Write-Host $_.Exception.Response.GetResponseStream()
}
