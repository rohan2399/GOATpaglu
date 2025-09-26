// Global variables
let products = [];
let filteredProducts = [];
let cart = [];
let currentProduct = null;
let currentPage = 'home';
let orderInProgress = false;

const BACKEND_URL = 'https://goatpaglu-backend.onrender.com'; // Your backend URL

// Fetch products dynamically from backend
async function loadProductsFromBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/products`);
    const data = await response.json();
    if (data.success) {
      // Map incoming Qikink products to frontend product model
      products = data.data.map(p => ({
        id: p.product_id,
        name: p.product_name,
        price: p.selling_price,
        originalPrice: p.original_price,
        image: p.image_url || "/api/placeholder/300/300",
        category: p.category || "Basic",
        sizes: p.sizes || [],
        colors: p.colors || [],
        description: p.description || '',
        rating: p.rating || 0,
        reviews: p.reviews || 0,
        qikinkVariations: p.variations || {}
      }));
      filteredProducts = [...products];
      initializeApp();
      loadShopProducts();
      loadFeaturedProducts();
      setupCategoryFilter();
    } else {
      console.error('Failed to load products:', data.error);
    }
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

// Get SKU from products
function getQikinkSKU(productId, size, color) {
  const product = products.find(p => p.id === productId);
  if (!product || !product.qikinkVariations) {
    console.error('Product or variations not found:', productId);
    return null;
  }
  return product.qikinkVariations[color]?.[size] || null;
}

// Other UI and helper functions remain same (navigation, cart, modal handlers)...

// Checkout function
async function handleQikinkCheckout(e) {
  e.preventDefault();
  if (orderInProgress) {
    showNotification('Order already in progress...', 'warning');
    return;
  }
  if (cart.length === 0) {
    showNotification('Your cart is empty', 'error');
    return;
  }
  orderInProgress = true;
  const submitBtn = document.querySelector('#checkoutForm button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Processing Order...';
  submitBtn.disabled = true;
  try {
    const formData = new FormData(e.target);
    const customerData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      zipCode: formData.get('zipCode'),
      paymentMethod: formData.get('paymentMethod')
    };
    const requiredFields = ['firstName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'];
    for (let f of requiredFields) {
      if (!customerData[f]) throw new Error(`Please fill in ${f}`);
    }
    const orderNumber = `ORD${Date.now().toString().slice(-10)}`;
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;
    const lineItems = cart.map(item => {
      const sku = getQikinkSKU(item.productId, item.size, item.color);
      if (!sku) throw new Error(`Invalid size/color combo: ${item.color} ${item.size}`);
      return {
        search_from_my_products: 1,
        quantity: item.quantity.toString(),
        sku: sku,
        price: item.price.toString()
      };
    });
    const orderData = {
      order_number: orderNumber,
      qikink_shipping: "1",
      gateway: customerData.paymentMethod === 'cod' ? 'COD' : 'PREPAID',
      total_order_value: total.toString(),
      line_items: lineItems,
      shipping_address: {
        first_name: customerData.firstName,
        last_name: customerData.lastName || '',
        address1: customerData.address,
        phone: customerData.phone,
        email: customerData.email,
        city: customerData.city,
        zip: customerData.zipCode,
        province: customerData.state,
        country_code: 'IN'
      }
    };
    const response = await fetch(`${BACKEND_URL}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorMessage}`);
    }
    const result = await response.json();
    if (result.success) {
      showOrderConfirmation(result.data, customerData, total);
      cart = [];
      updateCartCount();
      closeAllModals();
      showNotification('Order placed successfully!', 'success');
    } else {
      throw new Error(result.error || 'Order failed');
    }
  } catch (error) {
    showNotification(`Order failed: ${error.message}`, 'error');
    console.error(error);
  } finally {
    orderInProgress = false;
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
}

// Call loadProductsFromBackend on page load to fetch products dynamically
document.addEventListener('DOMContentLoaded', loadProductsFromBackend);
