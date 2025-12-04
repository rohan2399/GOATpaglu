// Static product array with REAL Qikink product data
const products = [
    {
        id: 1,
        name: "Unisex Standard Crew T-Shirt",
        price: 799,
        originalPrice: 999,
        image: "img/UnisexStandardCrewTShirt.jpg",
        images: [
            "img/UnisexStandardCrewTShirt.jpg", 
            "img/UnisexStandardCrewTShirt.jpg", 
            "img/UnisexStandardCrewTShirt.jpg"
        ],
        category: "Basic",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["White", "Black"],
        description: "Premium unisex crew neck t-shirt with custom DTF printing. Professional quality guaranteed by Qikink.",
        rating: 4.8,
        reviews: 15,
        qikinkProductId: 62944074,
        qikinkVariations: {
            "White": { "S": "MStRnHs-Wh-S", "M": "MStRnHs-Wh-M", "L": "MStRnHs-Wh-L", "XL": "MStRnHs-Wh-XL", "XXL": "MStRnHs-Wh-XXL" },
            "Black": { "S": "MStRnHs-Bk-S", "M": "MStRnHs-Bk-M", "L": "MStRnHs-Bk-L", "XL": "MStRnHs-Bk-XL", "XXL": "MStRnHs-Bk-XXL" }
        }
    },
    {
        id: 2,
        name: "Unisex Hoodie",
        price: 1500,
        originalPrice: 2000,
        category: "Hoodie",
        image: "img/UnisexHoodie.jpg",
        images: ["img/UnisexHoodie.jpg", "img/UnisexHoodie.jpg"],
        description: "Classic unisex hoodie",
        sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        colors: ["White", "Royal Blue"],
        rating: 4.7,
        reviews: 12,
        qikinkProductId: 63172226,
        qikinkVariations: {
            "White": { "XS": "UHd-Wh-XS", "S": "MVnHs-Wh-S", "M": "UHd-Wh-M", "L": "UHd-Wh-L", "XL": "UHd-Wh-XL", "XXL":"UHd-Wh-XXL", "3XL":"UHd-Wh-3XL" },
            "Royal Blue": { "XS": "UHd-Rb-XS", "S": "UHd-Rb-S", "M": "UHd-Rb-M", "L": "UHd-Rb-L", "XL": "UHd-Rb-XL", "XXL":"UHd-Rb-XXL", "3XL":"UHd-Rb-3XL" }
        }
    },
    {
        id: 3,
        name: "Cristiano Ronaldo ManUtd",
        price: 1700,
        originalPrice: 3000,
        image: "img/CristainoRonaldo.jpg",
        images: ["img/CristainoRonaldo.jpg", "img/CristainoRonaldo.jpg"],
        category: "Basic",
        sizes: ["S", "M", "L", "XL", "XXL"],
        colors: ["White"],
        description: "Unisex Oversized Hoodie with 400 GSM",
        rating: 4.8,
        reviews: 15,
        qikinkProductId: 63321978,
        qikinkVariations: {
            "White": { "S": "UOsHd-Wh-S", "M": "UOsHd-Wh-M", "L": "UOsHd-Wh-L", "XL": "UOsHd-Wh-XL", "XXL": "UOsHd-Wh-XXL", "XXXL": "UOsHd-Wh-XXXL" }
        }
    }
];

// Helper function to get Qikink SKU
function getQikinkSKU(productId, size, color) {
    const product = products.find(p => p.id === productId);
    if (!product || !product.qikinkVariations) return null;
    return product.qikinkVariations[color]?.[size] || null;
}

const BACKEND_URL = 'https://goatpaglu-backend.onrender.com';
const categories = ["All", "Basic", "Hoodie", "Graphic", "Logo", "Vintage", "Sports", "Art"];

// Global variables
let cart = [];
let currentProduct = null;
let filteredProducts = [...products];
let orderInProgress = false;

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadShopProducts();
    setupCategoryFilter();
});

function initializeApp() {
    updateCartCount();
    
    // HISTORY API FIX: Check URL hash on load to open correct page
    const hash = window.location.hash.replace('#', '');
    if (hash) {
        showPage(hash, false); // Don't push state on initial load
    } else {
        showPage('home', false); // Default to home
    }
}

function setupEventListeners() {
    // HISTORY API FIX: Listen for Back/Forward button clicks
    window.addEventListener('popstate', function(event) {
        if (event.state && event.state.page) {
            showPage(event.state.page, false); // Don't push state, just show it
        } else {
            showPage('home', false);
        }
    });

    // Navigation event delegation
    document.body.addEventListener('click', function(e) {
        const link = e.target.closest('[data-page]');
        if (link) {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            showPage(page); // Defaults to pushing state
            return;
        }
    });
    
    // Search inputs
    const globalSearchBtn = document.getElementById('globalSearchBtn');
    if (globalSearchBtn) {
        globalSearchBtn.addEventListener('click', function() {
            const input = document.getElementById('globalSearchInput');
            performSearch(input.value);
        });
    }
    
    const shopSearchInput = document.getElementById('shopSearchInput');
    if (shopSearchInput) {
        shopSearchInput.addEventListener('input', handleSearch);
    }

    // Filter delegation
    const sortFilter = document.getElementById('sortFilter');
    if(sortFilter) {
        sortFilter.addEventListener('click', function(e) {
            if(e.target.classList.contains('dropdown-item')) {
                e.preventDefault();
                handleSort(e.target.dataset.sort);
            }
        });
    }
    
    const categoryFilter = document.getElementById('categoryFilter');
    if(categoryFilter) {
        categoryFilter.addEventListener('click', function(e) {
            if(e.target.classList.contains('nav-link')) {
                e.preventDefault();
                handleCategoryFilter(e.target.dataset.category);
            }
        });
    }

    // Checkout form
    const checkoutForm = document.getElementById('newCheckoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleQikinkCheckout);
    }
    
    // Product Detail Page Listeners
    const detailAddToCart = document.getElementById('detailAddToCart');
    if(detailAddToCart) {
        detailAddToCart.addEventListener('click', function(e) {
            e.preventDefault();
            addToCartFromDetail();
        });
    }
    
    const detailDecreaseQty = document.getElementById('detailDecreaseQty');
    if(detailDecreaseQty) {
        detailDecreaseQty.addEventListener('click', function() {
            const input = document.getElementById('detailQuantity');
            let val = parseInt(input.value);
            if(val > 1) input.value = val - 1;
        });
    }
    
    const detailIncreaseQty = document.getElementById('detailIncreaseQty');
    if(detailIncreaseQty) {
        detailIncreaseQty.addEventListener('click', function() {
            const input = document.getElementById('detailQuantity');
            input.value = parseInt(input.value) + 1;
        });
    }
}

// HISTORY API FIX: Added addToHistory parameter
function showPage(pageId, addToHistory = true) {
    const allPages = document.querySelectorAll('.page');
    allPages.forEach(page => {
        page.classList.remove('active');
    });

    const targetPage = document.getElementById(pageId + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
        window.scrollTo(0, 0);
        
        // Update browser URL and History
        if (addToHistory) {
            history.pushState({ page: pageId }, null, `#${pageId}`);
        }
        
        // Update Navigation Active State
        updateNavigation(pageId);
    }
    
    if (pageId === 'cart') {
        updateCartDisplay();
    }
}

function updateNavigation(activePageId) {
    const navLinks = document.querySelectorAll('.nav-item .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === activePageId) {
            link.classList.add('active');
        }
    });
}

function performSearch(query) {
    const searchInput = document.getElementById('shopSearchInput');
    if(searchInput) searchInput.value = query;
    handleSearch();
    showPage('shop');
}

function loadShopProducts() {
    const container = document.getElementById('shopProducts');
    if (!container) return;

    container.innerHTML = filteredProducts.map(product => createProductCard(product)).join('');
}

// REDIRECT FIX: Updated onclick events to strictly use showProductDetail
function createProductCard(product) {
    return `
    <div class="col-md-4">
        <div class="product-item">
            <div class="product-title">
                <a href="#" onclick="event.preventDefault(); showProductDetail(${product.id})">${product.name}</a>
                <div class="rating">
                    ${getStarRating(product.rating)}
                </div>
            </div>
            <div class="product-image">
                <a href="#" onclick="event.preventDefault(); showProductDetail(${product.id})">
                    <img src="${product.image}" alt="${product.name}">
                </a>
                <div class="product-action">
                    <a href="#" onclick="event.preventDefault(); showProductDetail(${product.id})"><i class="fa fa-cart-plus"></i></a>
                    <a href="#" onclick="event.preventDefault(); showProductDetail(${product.id})"><i class="fa fa-search"></i></a>
                </div>
            </div>
            <div class="product-price">
                <h3><span>₹</span>${product.price}</h3>
                <a class="btn" href="#" onclick="event.preventDefault(); showProductDetail(${product.id})"><i class="fa fa-shopping-cart"></i>Buy Now</a>
            </div>
        </div>
    </div>
    `;
}

function getStarRating(rating) {
    let stars = '';
    for (let i = 0; i < 5; i++) {
        if (i < Math.floor(rating)) {
            stars += '<i class="fa fa-star"></i>';
        } else {
            stars += '<i class="fa fa-star-o"></i>';
        }
    }
    return stars;
}

// Product Detail Functions
function showProductDetail(productId) {
    currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return;

    // Populate Detail Page Data
    document.getElementById('detailName').textContent = currentProduct.name;
    document.getElementById('detailPrice').textContent = `₹${currentProduct.price}`;
    document.getElementById('detailOriginalPrice').textContent = `₹${currentProduct.originalPrice}`;
    document.getElementById('detailDescription').textContent = currentProduct.description;
    document.getElementById('detailRating').innerHTML = getStarRating(currentProduct.rating);
    document.getElementById('detailQuantity').value = 1;

    // 1. Set the Main Image
    const mainImage = document.getElementById('detailImage');
    mainImage.src = currentProduct.image; 

    // 2. Generate Thumbnails
    const thumbnailContainer = document.getElementById('detailThumbnails');
    if(thumbnailContainer) {
        thumbnailContainer.innerHTML = ''; 

        const imagesToLoad = currentProduct.images && currentProduct.images.length > 0 
                             ? currentProduct.images 
                             : [currentProduct.image];

        imagesToLoad.forEach(imgSrc => {
            const thumbWrapper = document.createElement('div');
            thumbWrapper.className = 'col-3 p-1'; 
            
            const img = document.createElement('img');
            img.src = imgSrc;
            img.className = 'img-fluid border'; 
            img.style.cursor = 'pointer';
            
            img.onclick = function() {
                mainImage.src = imgSrc;
            };

            thumbWrapper.appendChild(img);
            thumbnailContainer.appendChild(thumbWrapper);
        });
    }

    // Sizes
    const sizeContainer = document.getElementById('detailSizeOptions');
    sizeContainer.innerHTML = currentProduct.sizes.map(size => 
        `<button type="button" class="btn size-option" data-size="${size}">${size}</button>`
    ).join('');

    // Colors
    const colorContainer = document.getElementById('detailColorOptions');
    colorContainer.innerHTML = currentProduct.colors.map(color => 
        `<button type="button" class="btn color-option" data-color="${color}">${color}</button>`
    ).join('');
    
    setupDetailOptionsListeners();
    showPage('productDetail'); // Will automatically push history state
}

function setupDetailOptionsListeners() {
    document.querySelectorAll('.size-option').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.size-option').forEach(b => {
                b.classList.remove('selected');
                b.style.backgroundColor = ""; 
                b.style.color = "";
            });
            this.style.backgroundColor = "#000";
            this.style.color = "#fff";
            this.classList.add('selected');
        });
    });

    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', function() {
             document.querySelectorAll('.color-option').forEach(b => {
                b.classList.remove('selected');
                b.style.backgroundColor = ""; 
                b.style.color = "";
             });
             this.style.backgroundColor = "#000";
             this.style.color = "#fff";
             this.classList.add('selected');
        });
    });
}

function addToCartFromDetail() {
    if (!currentProduct) return;

    const selectedSizeBtn = document.querySelector('.size-option.selected');
    const selectedColorBtn = document.querySelector('.color-option.selected');
    const quantity = parseInt(document.getElementById('detailQuantity').value);

    if (!selectedSizeBtn || !selectedColorBtn) {
        showNotification('Please select size and color', 'error');
        return;
    }

    const size = selectedSizeBtn.dataset.size;
    const color = selectedColorBtn.dataset.color;

    const qikinkSKU = getQikinkSKU(currentProduct.id, size, color);
    if (!qikinkSKU) {
        showNotification('Selected size/color combination not available', 'error');
        return;
    }

    const cartItem = {
        id: Date.now(),
        productId: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.price,
        size: size,
        color: color,
        quantity: quantity,
        image: currentProduct.image
    };

    cart.push(cartItem);
    updateCartCount();
    showNotification(`${currentProduct.name} added to cart!`);
}

function updateCartCount() {
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
}

function updateCartDisplay() {
    const cartTableBody = document.getElementById('cartTableBody');
    const cartTotalSummary = document.getElementById('cartTotalSummary');

    if (!cartTableBody) return;

    if (cart.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Your cart is empty</td></tr>';
        if(cartTotalSummary) {
             cartTotalSummary.innerHTML = `
                  <h1>Cart Summary</h1>
                  <p>Sub Total<span>₹0</span></p>
                  <p>Shipping Cost<span>₹0</span></p>
                  <h2>Grand Total<span>₹0</span></h2>
             `;
        }
        return;
    }

    cartTableBody.innerHTML = cart.map((item, index) => `
        <tr>
            <td>
                <div class="img">
                    <a href="#"><img src="${item.image}" alt="Image"></a>
                    <p>${item.name}<br><small>${item.size} / ${item.color}</small></p>
                </div>
            </td>
            <td>₹${item.price}</td>
            <td>
                <div class="qty">
                    <button class="btn-minus" onclick="updateCartItemQuantity(${index}, -1)"><i class="fa fa-minus"></i></button>
                    <input type="text" value="${item.quantity}" readonly>
                    <button class="btn-plus" onclick="updateCartItemQuantity(${index}, 1)"><i class="fa fa-plus"></i></button>
                </div>
            </td>
            <td>₹${item.price * item.quantity}</td>
            <td><button onclick="removeCartItem(${index})"><i class="fa fa-trash"></i></button></td>
        </tr>
    `).join('');

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 50;
    const total = subtotal + shipping;

    if(cartTotalSummary) {
        cartTotalSummary.innerHTML = `
             <h1>Cart Summary</h1>
             <p>Sub Total<span>₹${subtotal}</span></p>
             <p>Shipping Cost<span>₹${shipping}</span></p>
             <h2>Grand Total<span>₹${total}</span></h2>
        `;
    }
    
    // Also update Checkout Summary if visible
    const checkoutSummary = document.getElementById('checkoutOrderSummary');
    if (checkoutSummary) {
        checkoutSummary.innerHTML = `
            <h1>Cart Total</h1>
            <p class="sub-total">Sub Total<span>₹${subtotal}</span></p>
            <p class="ship-cost">Shipping Cost<span>₹${shipping}</span></p>
            <h2>Grand Total<span>₹${total}</span></h2>
        `;
    }
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

// Search / Filter Handlers
function handleSearch() {
    const searchInput = document.getElementById('shopSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
    );
    
    loadShopProducts();
}

function handleCategoryFilter(category) {
    if (category === 'All') {
        filteredProducts = [...products];
    } else {
        filteredProducts = products.filter(product => product.category === category);
    }
    loadShopProducts();
}

function handleSort(sortBy) {
    switch(sortBy) {
        case 'price-low':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredProducts.sort((a, b) => b.price - a.price);
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
        `<li class="nav-item"><a class="nav-link" href="#" data-category="${category}">${category}</a></li>`
    ).join('');
}

// Checkout
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
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Processing...';
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

        const orderNumber = `ORD${Date.now().toString().slice(-10)}`;
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const shipping = subtotal > 500 ? 0 : 50;
        const total = subtotal + shipping;

        const lineItems = cart.map(item => {
            const sku = getQikinkSKU(item.productId, item.size, item.color);
            if (!sku) throw new Error(`Invalid SKU for ${item.name}`);
            return {
                search_from_my_products: 0,
                print_type_id: 17,
                quantity: item.quantity.toString(),
                sku: sku,
                price: item.price.toString()
            };
        });

        const orderPayload = {
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

        if (customerData.paymentMethod === 'razorpay') {
             const amount = total * 100; 
             const razorpayOrderResponse = await fetch(`${BACKEND_URL}/razorpay/order`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    amount: amount,
                    receipt: orderNumber,
                    notes: {
                        customer_name: `${customerData.firstName} ${customerData.lastName}`,
                        customer_email: customerData.email
                    }
                })
             });

            if (!razorpayOrderResponse.ok) throw new Error('Failed to create Razorpay order');
            const razorpayOrderData = await razorpayOrderResponse.json();
            
            if (typeof Razorpay === 'undefined') throw new Error('Razorpay SDK not loaded');

            const options = {
                key: 'rzp_test_RYDoufRmtnZwEH', 
                amount: amount,
                currency: 'INR',
                name: 'GoatPaglu',
                description: 'Order Payment',
                order_id: razorpayOrderData.order.id,
                handler: async function (response) {
                    try {
                        const verifyResponse = await fetch(`${BACKEND_URL}/payment/verify-and-place`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderPayload: orderPayload
                            })
                        });
                        const result = await verifyResponse.json();
                        if (result.success) {
                            cart = [];
                            updateCartCount();
                            showOrderConfirmation(result.data, customerData, total, response.razorpay_payment_id);
                            showNotification('Order Placed Successfully!', 'success');
                        } else {
                            throw new Error(result.error);
                        }
                    } catch (err) {
                        showNotification(err.message, 'error');
                    } finally {
                        orderInProgress = false;
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }
                },
                modal: {
                    ondismiss: function() {
                         orderInProgress = false;
                         submitBtn.textContent = originalText;
                         submitBtn.disabled = false;
                    }
                }
            };
            const rzp = new Razorpay(options);
            rzp.open();
            return;
        }

        // COD
        const response = await fetch(`${BACKEND_URL}/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const result = await response.json();
        if (result.success) {
            cart = [];
            updateCartCount();
            showOrderConfirmation(result.data, customerData, total);
            showNotification('Order Placed Successfully!', 'success');
        } else {
            throw new Error(result.error);
        }

    } catch (error) {
        console.error(error);
        showNotification(error.message, 'error');
    } finally {
        if (!orderInProgress) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
        orderInProgress = false;
    }
}

function showOrderConfirmation(orderData, customerData, total, paymentId = null) {
    const modalHTML = `
        <div id="orderConfirmationModal" class="modal" style="display: block;">
            <div class="modal__overlay">
                <div class="modal__content" style="position: relative;">
                    <button class="modal__close" onclick="document.getElementById('orderConfirmationModal').remove()">&times;</button>
                    <div style="text-align: center; padding: 20px;">
                        <div style="width: 60px; height: 60px; background: #28a745; color: white; border-radius: 50%; line-height: 60px; font-size: 30px; margin: 0 auto 15px;">✓</div>
                        <h3>Thank You!</h3>
                        <p>Your order has been placed.</p>
                        <div style="text-align: left; margin-top: 20px; background: #f8f9fa; padding: 15px; border-radius: 5px;">
                            <p><strong>Order ID:</strong> ${orderData.order_id || 'Pending'}</p>
                            ${paymentId ? `<p><strong>Payment ID:</strong> ${paymentId}</p>` : ''}
                            <p><strong>Amount:</strong> ₹${total}</p>
                        </div>
                         <button class="btn btn-primary mt-3" onclick="document.getElementById('orderConfirmationModal').remove(); showPage('home');">Continue Shopping</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showNotification(message, type = 'success') {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px; border-radius: 5px; color: white; z-index: 10000;
        background: ${type === 'success' ? '#28a745' : '#dc3545'};
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
