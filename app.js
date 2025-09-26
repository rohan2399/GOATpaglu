// Replace the products array in your app.js with this REAL product data OR load from backend
const products = [
    {
        id: 1,
        name: "Unisex Standard Crew T-Shirt",
        price: 799, // Your selling price (you can adjust this)
        originalPrice: 999, // Your original price
        image: "/api/placeholder/300/300", // You can add real image later
        category: "Basic",
        sizes: ["S", "M", "L", "XL", "XXL"], // Available sizes from Qikink
        colors: ["White", "Black"], // Available colors from Qikink
        description: "Premium unisex crew neck t-shirt with custom DTF printing. Professional quality guaranteed by Qikink.",
        rating: 4.8,
        reviews: 15,
        // IMPORTANT: Your REAL Qikink product details
        qikinkProductId: 62944074, // From your dashboard
        qikinkBasePrice: 256.35, // Qikink's cost to you
        qikinkPrintType: 17, // DTF = 17
        qikinkVariations: {
            // Map size-color combinations to Qikink SKUs
            "White": {
                "S": "MStRnHs-Wh-S",
                "M": "MStRnHs-Wh-M", 
                "L": "MStRnHs-Wh-L",
                "XL": "MStRnHs-Wh-XL",
                "XXL": "MStRnHs-Wh-XXL"
            },
            "Black": {
                "S": "MStRnHs-Bk-S",
                "M": "MStRnHs-Bk-M",
                "L": "MStRnHs-Bk-L", 
                "XL": "MStRnHs-Bk-XL",
                "XXL": "MStRnHs-Bk-XXL"
            }
        }
    }
    // You can add more products later as you create them in Qikink
];

// Load products dynamically from backend (OPTIONAL - use this instead of static array above)
async function loadProductsFromBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/products`);
    const data = await response.json();

    if (data.success) {
      // Transform Qikink API response to your frontend product model
      products = data.data.map(qikinkProduct => ({
        id: qikinkProduct.product_id,
        name: qikinkProduct.product_name,
        price: qikinkProduct.selling_price,
        originalPrice: qikinkProduct.original_price,
        image: qikinkProduct.image_url || "/api/placeholder/300/300",
        category: qikinkProduct.category || "Basic",
        sizes: qikinkProduct.sizes || [],
        colors: qikinkProduct.colors || [],
        description: qikinkProduct.description || '',
        rating: qikinkProduct.rating || 4.8,
        reviews: qikinkProduct.reviews_count || 15,
        qikinkProductId: qikinkProduct.product_id,
        qikinkVariations: qikinkProduct.variations || {}
      }));

      filteredProducts = [...products];
      loadShopProducts(); // Your function to render products on page
      loadFeaturedProducts();
    } else {
      console.error('Failed to fetch products from backend:', data.error);
    }
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

// Helper function to get the correct Qikink SKU
function getQikinkSKU(productId, size, color) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.qikinkVariations) {
        console.error('Product or variations not found:', productId);
        return null;
    }
    
    const sku = product.qikinkVariations[color]?.[size];
    if (!sku) {
        console.error('SKU not found for:', color, size);
        return null;
    }
    
    return sku;
}

// ⚠️ IMPORTANT: Update this to your deployed backend URL
const BACKEND_URL = 'https://goatpaglu-backend.onrender.com'; // Replace with your actual backend URL

const categories = ["All", "Basic", "Graphic", "Logo", "Vintage", "Sports", "Art"];
const sizeGuide = {
    "XS": "Chest: 30-32 inches",
    "S": "Chest: 34-36 inches",
    "M": "Chest: 38-40 inches",
    "L": "Chest: 42-44 inches",
    "XL": "Chest: 46-48 inches",
    "XXL": "Chest: 50-52 inches"
};

// Global variables
let cart = [];
let currentProduct = null;
let filteredProducts = [...products];
let currentPage = 'home';
let orderInProgress = false;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadFeaturedProducts();
    loadShopProducts();
    setupCategoryFilter();
    
    // OPTIONAL: Use this instead of static products array
    // loadProductsFromBackend();
});

function initializeApp() {
    updateCartCount();
    showPage('home');
    updateNavigation('home');
}

function setupEventListeners() {
    // Navigation event delegation
    document.body.addEventListener('click', function(e) {
        // Handle navigation links
        if (e.target.hasAttribute('data-page')) {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            showPage(page);
            updateNavigation(page);
            return;
        }

        // Handle cart button
        if (e.target.id === 'cartBtn' || e.target.closest('#cartBtn')) {
            e.preventDefault();
            openCartModal();
            return;
        }

        // Handle modal close buttons
        if (e.target.classList.contains('modal__close') || 
            e.target.id === 'closeCartModal2' || 
            e.target.id === 'closeCartModal' || 
            e.target.id === 'closeCheckout' || 
            e.target.id === 'closeSizeGuide') {
            closeAllModals();
            return;
        }

        // Handle modal overlay clicks
        if (e.target.classList.contains('modal__overlay')) {
            closeAllModals();
            return;
        }

        // Handle checkout button
        if (e.target.id === 'checkoutBtn') {
            e.preventDefault();
            openCheckoutModal();
            return;
        }
    });

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            const mainNav = document.getElementById('mainNav');
            if (mainNav) {
                mainNav.style.display = mainNav.style.display === 'flex' ? 'none' : 'flex';
            }
        });
    }

    // Search and filters
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryFilter);
    }

    const sortFilter = document.getElementById('sortFilter');
    if (sortFilter) {
        sortFilter.addEventListener('change', handleSort);
    }

    // Checkout form - UPDATED FOR QIKINK INTEGRATION
    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleQikinkCheckout);
    }

    // Contact form
    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
}

// Navigation Functions
function showPage(pageId) {
    // Hide all pages
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageId;
    }
}

function updateNavigation(activePageId) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === activePageId) {
            link.classList.add('active');
        }
    });
}

// Product Display Functions
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    const featuredProducts = products.slice(0, 6);
    container.innerHTML = featuredProducts.map(product => createProductCard(product)).join('');
}

function loadShopProducts() {
    const container = document.getElementById('shopProducts');
    if (!container) return;

    container.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

function createProductCard(product) {
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    
    return `
        <div class="product-card" onclick="showProductDetail(${product.id})">
            <div class="product-card__image">
                ${product.image.includes('placeholder') ? 
                    product.name : 
                    `<img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                }
            </div>
            <div class="product-card__content">
                <h3 class="product-card__name">${product.name}</h3>
                <p class="product-card__description">${product.description}</p>
                <div class="product-card__price">
                    <span class="price-current">₹${product.price}</span>
                    <span class="price-original">₹${product.originalPrice}</span>
                    <span class="status status--success">${discount}% OFF</span>
                </div>
                <div class="product-card__rating">
                    <span class="rating-stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                    <span>${product.rating} (${product.reviews} reviews)</span>
                </div>
                <button class="btn btn--primary btn--full-width" onclick="event.stopPropagation(); quickAddToCart(${product.id})">
                    Quick Add to Cart
                </button>
            </div>
        </div>
    `;
}

// Product Detail Functions
function showProductDetail(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    const modal = document.getElementById('productModal');
    if (!modal) return;

    // Update modal content
    document.getElementById('modalProductName').textContent = currentProduct.name;
    document.getElementById('modalProductDescription').textContent = currentProduct.description;
    document.getElementById('modalProductPrice').textContent = `₹${currentProduct.price}`;
    document.getElementById('modalProductOriginalPrice').textContent = `₹${currentProduct.originalPrice}`;
    document.getElementById('modalProductRating').innerHTML = `
        <span class="rating-stars">${'★'.repeat(Math.floor(currentProduct.rating))}${'☆'.repeat(5-Math.floor(currentProduct.rating))}</span>
        <span>${currentProduct.rating} (${currentProduct.reviews} reviews)</span>
    `;

    // Update size options
    const sizeContainer = document.getElementById('modalSizeOptions');
    if (sizeContainer) {
        sizeContainer.innerHTML = currentProduct.sizes.map(size => 
            `<button class="size-option" data-size="${size}">${size}</button>`
        ).join('');
    }

    // Update color options
    const colorContainer = document.getElementById('modalColorOptions');
    if (colorContainer) {
        colorContainer.innerHTML = currentProduct.colors.map(color => 
            `<button class="color-option" data-color="${color}">${color}</button>`
        ).join('');
    }

    // Add event listeners
    setupProductModalListeners();
    
    modal.classList.remove('hidden');
}

function setupProductModalListeners() {
    // Size selection
    document.querySelectorAll('.size-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-option').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Color selection
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Quantity controls
    const quantityInput = document.getElementById('modalQuantity');
    const decreaseBtn = document.getElementById('decreaseQuantity');
    const increaseBtn = document.getElementById('increaseQuantity');

    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', function() {
            const current = parseInt(quantityInput.value);
            if (current > 1) {
                quantityInput.value = current - 1;
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', function() {
            const current = parseInt(quantityInput.value);
            quantityInput.value = current + 1;
        });
    }

    // Add to cart button
    const addToCartBtn = document.getElementById('modalAddToCart');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', addToCartFromModal);
    }
}

// Cart Functions
function quickAddToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Use first available size/color as defaults
    const defaultSize = product.sizes[0];
    const defaultColor = product.colors[0];

    const cartItem = {
        id: Date.now(),
        productId: productId,
        name: product.name,
        price: product.price,
        size: defaultSize,
        color: defaultColor,
        quantity: 1,
        image: product.image,
        qikinkProductId: product.qikinkProductId,
        qikinkPrintType: product.qikinkPrintType
    };

    cart.push(cartItem);
    updateCartCount();
    showNotification(`${product.name} (${defaultColor} ${defaultSize}) added to cart!`);
}

function addToCartFromModal() {
    if (!currentProduct) return;

    const selectedSize = document.querySelector('.size-option.selected');
    const selectedColor = document.querySelector('.color-option.selected');
    const quantity = parseInt(document.getElementById('modalQuantity').value);

    if (!selectedSize || !selectedColor) {
        showNotification('Please select size and color', 'error');
        return;
    }

    // Validate the size/color combination exists in Qikink
    const qikinkSKU = getQikinkSKU(currentProduct.id, selectedSize.dataset.size, selectedColor.dataset.color);
    if (!qikinkSKU) {
        showNotification('Selected size/color combination not available', 'error');
        return;
    }

    const cartItem = {
        id: Date.now(),
        productId: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        size: selectedSize.dataset.size,
        color: selectedColor.dataset.color,
        quantity: quantity,
        image: currentProduct.image,
        qikinkProductId: currentProduct.qikinkProductId,
        qikinkPrintType: currentProduct.qikinkPrintType
    };

    cart.push(cartItem);
    updateCartCount();
    closeAllModals();
    showNotification(`${currentProduct.name} (${cartItem.color} ${cartItem.size}) added to cart!`);
}

function updateCartCount() {
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (!modal) return;

    updateCartDisplay();
    modal.classList.remove('hidden');
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartSummaryContainer = document.getElementById('cartSummary');

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--color-text-secondary);">Your cart is empty</p>';
        cartSummaryContainer.innerHTML = '';
        return;
    }

    // Display cart items
    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">
            <div class="cart-item__image">
                ${item.image.includes('placeholder') ? item.name : `<img src="${item.image}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">`}
            </div>
            <div class="cart-item__details">
                <div class="cart-item__name">${item.name}</div>
                <div class="cart-item__options">Size: ${item.size}, Color: ${item.color}</div>
                <div class="cart-item__quantity">
                    <button onclick="updateCartItemQuantity(${index}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateCartItemQuantity(${index}, 1)">+</button>
                    <button onclick="removeCartItem(${index})" style="margin-left: 10px; color: var(--color-error);">Remove</button>
                </div>
            </div>
            <div class="cart-item__price">₹${item.price * item.quantity}</div>
        </div>
    `).join('');

    // Calculate and display summary
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    cartSummaryContainer.innerHTML = `
        <div class="cart__summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${subtotal}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>₹${shipping}</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>₹${total}</span>
            </div>
        </div>
    `;
}

function updateCartItemQuantity(index, change) {
    if (cart[index]) {
        cart[index].quantity += change;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        updateCartCount();
        updateCartDisplay();
    }
}

function removeCartItem(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartDisplay();
}

// Checkout Functions - UPDATED FOR QIKINK INTEGRATION
function openCheckoutModal() {
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    const modal = document.getElementById('checkoutModal');
    if (!modal) return;

    // Update checkout summary
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    const checkoutSummary = document.getElementById('checkoutSummary');
    if (checkoutSummary) {
        checkoutSummary.innerHTML = `
            <h3>Order Summary</h3>
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>₹${subtotal}</span>
            </div>
            <div class="summary-row">
                <span>Shipping:</span>
                <span>₹${shipping}</span>
            </div>
            <div class="summary-row total">
                <span>Total:</span>
                <span>₹${total}</span>
            </div>
        `;
    }

    modal.classList.remove('hidden');
}

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
        for (let field of requiredFields) {
            if (!customerData[field]) {
                throw new Error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
            }
        }

        const orderNumber = `ORD${Date.now().toString().slice(-10)}`;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 50;
        const total = subtotal + shipping;

        const lineItems = cart.map(item => {
            const sku = getQikinkSKU(item.productId, item.size, item.color);
            if (!sku) {
                throw new Error(`Invalid size/color combination: ${item.color} ${item.size}`);
            }
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
                last_name: customerData.lastName || "",
                address1: customerData.address,
                phone: customerData.phone,
                email: customerData.email,
                city: customerData.city,
                zip: customerData.zipCode,
                province: customerData.state,
                country_code: "IN"
            }
        };

        const response = await fetch(`${BACKEND_URL}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
            showOrderConfirmation(result.data, customerData, total);
            cart = [];
            updateCartCount();
            closeAllModals();
            showNotification('Order placed successfully! Check your email for details.', 'success');
        } else {
            throw new Error(result.error || 'Order failed');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showNotification(`Order failed: ${error.message}`, 'error');
    } finally {
        orderInProgress = false;
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function showOrderConfirmation(orderResult, customerData, total) {
    const modal = document.getElementById('orderConfirmationModal');
    if (!modal) {
        // Create confirmation modal if it doesn't exist
        const modalHTML = `
            <div id="orderConfirmationModal" class="modal hidden">
                <div class="modal__overlay">
                    <div class="modal__content">
                        <div class="modal__header">
                            <h2>Order Confirmed!</h2>
                            <button class="modal__close" onclick="closeAllModals()">&times;</button>
                        </div>
                        <div class="modal__body">
                            <div id="orderConfirmationContent"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    const content = document.getElementById('orderConfirmationContent');
    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="width: 80px; height: 80px; background: var(--color-success); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px;">✓</div>
            <h3>Thank you for your order!</h3>
        </div>
        
        <div class="order-details">
            <p><strong>Order ID:</strong> ${orderResult.order_id || 'Processing...'}</p>
            <p><strong>Total Amount:</strong> ₹${total}</p>
            <p><strong>Customer:</strong> ${customerData.firstName} ${customerData.lastName}</p>
            <p><strong>Email:</strong> ${customerData.email}</p>
            <p><strong>Phone:</strong> ${customerData.phone}</p>
            
            <div style="background: var(--color-bg-3); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4>What happens next?</h4>
                <ul style="margin: 10px 0; padding-left: 20px;">
                    <li>Your order has been sent to Qikink for processing</li>
                    <li>You'll receive email updates on order status</li>
                    <li>Printing will begin within 24 hours</li>
                    <li>Expected delivery: 5-7 business days</li>
                </ul>
            </div>
            
            <p style="color: var(--color-text-secondary); font-size: 14px;">
                Order confirmation and tracking details will be sent to your email address.
            </p>
        </div>
    `;

    document.getElementById('orderConfirmationModal').classList.remove('hidden');
}

// Search and Filter Functions
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    
    loadShopProducts();
}

function handleCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const selectedCategory = categoryFilter.value;
    
    if (selectedCategory === 'All') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === selectedCategory);
    }
    
    loadShopProducts();
}

function handleSort() {
    const sortFilter = document.getElementById('sortFilter');
    const sortBy = sortFilter.value;
    
    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'rating':
            filteredProducts.sort((a, b) => b.rating - a.rating);
            break;
        default:
            filteredProducts = [...products];
    }
    
    loadShopProducts();
}

function setupCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (!categoryFilter) return;

    categoryFilter.innerHTML = categories.map(category => 
        `<option value="${category}">${category}</option>`
    ).join('');
}

// Utility Functions
function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.add('hidden');
    });
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? 'var(--color-success)' : 
                    type === 'error' ? 'var(--color-error)' : 
                    'var(--color-warning)'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: var(--shadow-lg);
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Contact Form Handler
function handleContactForm(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', Object.fromEntries(formData));
    
    showNotification('Thank you for your message! We will get back to you soon.');
    e.target.reset();
}

// Backend Connection Test (for debugging)
async function testBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/`);
        const data = await response.json();
        console.log('Backend connection test:', data);
        showNotification('Backend connected successfully!', 'success');
    } catch (error) {
        console.error('Backend connection failed:', error);
        showNotification('Backend connection failed. Please check your backend URL.', 'error');
    }
}

// Initialize backend connection test on page load
window.addEventListener('load', function() {
    // Uncomment this line to test backend connection on page load
    // testBackendConnection();
});
