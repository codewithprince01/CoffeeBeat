// Load products from localStorage (where admin stores them)
export const loadProductsFromStorage = () => {
  try {
    const products = []
    
    // Check localStorage for admin products
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith('product_')) {
        const productData = localStorage.getItem(key)
        if (productData) {
          const product = JSON.parse(productData)
          products.push(product)
        }
      }
    }
    
    console.log('Loaded products from storage:', products.length)
    return products
  } catch (error) {
    console.error('Failed to load products from storage:', error)
    return []
  }
}

// Get all products (backend + localStorage)
export const getAllProducts = async () => {
  try {
    // First try to get from localStorage (admin products)
    const storageProducts = loadProductsFromStorage()
    
    if (storageProducts.length > 0) {
      console.log('Using localStorage products:', storageProducts.length)
      return storageProducts
    }
    
    // If no localStorage products, try backend API
    try {
      const response = await fetch('http://localhost:8080/api/products')
      if (response.ok) {
        const backendProducts = await response.json()
        console.log('Using backend products:', backendProducts.length)
        return backendProducts.content || backendProducts || []
      }
    } catch (error) {
      console.log('Backend products failed, using sample data')
    }
    
    // Last resort: sample products
    return getSampleProducts()
  } catch (error) {
    console.error('Failed to get products:', error)
    return getSampleProducts()
  }
}

// Sample products fallback
const getSampleProducts = () => {
  return [
    {
      id: '1',
      name: 'Cappuccino',
      description: 'Rich espresso with steamed milk foam',
      price: 4.50,
      category: 'Coffee',
      stock: 50,
      available: true,
      imageUrl: '/images/menu/cappuccino.svg'
    },
    {
      id: '2',
      name: 'Espresso',
      description: 'Strong black coffee shot',
      price: 3.00,
      category: 'Coffee',
      stock: 100,
      available: true,
      imageUrl: '/images/menu/espresso.svg'
    },
    {
      id: '3',
      name: 'Latte',
      description: 'Smooth espresso with steamed milk',
      price: 4.00,
      category: 'Coffee',
      stock: 30,
      available: true,
      imageUrl: '/images/menu/latte.svg'
    },
    {
      id: '4',
      name: 'Croissant',
      description: 'Buttery French pastry',
      price: 3.50,
      category: 'Pastries',
      stock: 25,
      available: true,
      imageUrl: '/images/menu/croissant.svg'
    },
    {
      id: '5',
      name: 'Muffin',
      description: 'Fresh baked blueberry muffin',
      price: 3.00,
      category: 'Pastries',
      stock: 20,
      available: true,
      imageUrl: '/images/menu/muffin.svg'
    },
    {
      id: '6',
      name: 'Sandwich',
      description: 'Club sandwich with fries',
      price: 8.50,
      category: 'Food',
      stock: 15,
      available: true,
      imageUrl: '/images/menu/sandwich.svg'
    }
  ]
}
