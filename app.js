// State Configuration
const ROOM_RANGES = {
    1: { name: 'Delux', start: 1, end: 10, rate: 2000, badgeClass: 'badge-delux' },
    2: { name: 'Semi-Delux', start: 11, end: 25, rate: 1500, badgeClass: 'badge-semidelux' },
    3: { name: 'General', start: 26, end: 45, rate: 1000, badgeClass: 'badge-general' },
    4: { name: 'Joint Room', start: 46, end: 50, rate: 1700, badgeClass: 'badge-joint' }
};

let rooms = [];

// Initialize Room Database
function initRooms() {
    const saved = localStorage.getItem('horizon_hotel_rooms');
    if (saved) {
        try {
            rooms = JSON.parse(saved);
            return;
        } catch (e) {
            console.error("Failed to load rooms, reinitializing...", e);
        }
    }

    rooms = [];
    // Populate rooms based on ranges
    for (const key in ROOM_RANGES) {
        const range = ROOM_RANGES[key];
        for (let r = range.start; r <= range.end; r++) {
            rooms.push({
                roomNumber: r,
                typeId: parseInt(key),
                typeName: range.name,
                rate: range.rate,
                status: 'vacant', // 'vacant' or 'occupied'
                guest: null
            });
        }
    }
    saveRooms();
}

function saveRooms() {
    localStorage.setItem('horizon_hotel_rooms', JSON.stringify(rooms));
}

// Stats & Metrics
function updateStats() {
    const total = rooms.length;
    const occupied = rooms.filter(r => r.status === 'occupied').length;
    const vacant = total - occupied;

    document.getElementById('stat-total-rooms').textContent = total;
    document.getElementById('stat-occupied-rooms').textContent = occupied;
    document.getElementById('stat-vacant-rooms').textContent = vacant;
}

// Navigation & Routing
const VIEWS = {
    dashboard: { title: 'Dashboard', subtitle: 'Live room allocation status and metrics' },
    checkin: { title: 'Check-In Portal', subtitle: 'Register guests and assign rooms' },
    checkout: { title: 'Check-Out Desk', subtitle: 'Process payments and release hotel rooms' },
    directory: { title: 'Guest Directory', subtitle: 'History and active customer profiles' }
};

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-menu .nav-item');
    const viewPanels = document.querySelectorAll('.view-panel');
    const titleEl = document.getElementById('view-title');
    const subtitleEl = document.getElementById('view-subtitle');

    function switchView(viewName) {
        // Toggle Nav item active classes
        navItems.forEach(item => {
            if (item.getAttribute('data-view') === viewName) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle View Panels
        viewPanels.forEach(panel => {
            if (panel.id === `view-${viewName}`) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });

        // Update Title Headers
        if (VIEWS[viewName]) {
            titleEl.textContent = VIEWS[viewName].title;
            subtitleEl.textContent = VIEWS[viewName].subtitle;
        }

        // View-specific initializations
        if (viewName === 'dashboard') {
            renderRoomMap();
        } else if (viewName === 'checkin') {
            updateLiveCheckinCost();
        } else if (viewName === 'directory') {
            renderDirectoryTable();
        } else if (viewName === 'checkout') {
            resetCheckoutForm();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetView = item.getAttribute('data-view');
            window.location.hash = targetView;
            switchView(targetView);
        });
    });

    // Hash Router
    function handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (VIEWS[hash]) {
            switchView(hash);
        } else {
            window.location.hash = 'dashboard';
            switchView('dashboard');
        }
    }

    window.addEventListener('hashchange', handleHashChange);
    // Initial load check
    handleHashChange();
}

// Dashboard: Room Map Rendering
function renderRoomMap() {
    const container = document.getElementById('room-map-container');
    container.innerHTML = ''; // clear

    for (const key in ROOM_RANGES) {
        const range = ROOM_RANGES[key];
        const section = document.createElement('div');
        section.className = 'room-type-section';

        const header = document.createElement('h4');
        header.className = 'room-type-header';
        header.textContent = `${range.name} Class`;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'rooms-grid';

        const rangeRooms = rooms.filter(r => r.typeId === parseInt(key));
        rangeRooms.forEach(room => {
            const card = document.createElement('div');
            card.className = `room-card ${room.status}`;
            card.innerHTML = `
                <span class="room-number">${room.roomNumber}</span>
                <span class="room-status-text">${room.status}</span>
            `;

            card.addEventListener('click', () => handleRoomClick(room));
            grid.appendChild(card);
        });

        section.appendChild(grid);
        container.appendChild(section);
    }
}

// Room Click Handler
function handleRoomClick(room) {
    if (room.status === 'vacant') {
        // Quick Action: Pre-select room type in check-in view
        const selectEl = document.getElementById('guest-room-type');
        selectEl.value = room.typeId;
        window.location.hash = 'checkin';
        
        // Dynamic Notification
        showToast(`Selected room class: ${room.typeName}. Filling check-in form.`, 'success');
    } else {
        // Show details in modal
        showRoomDetailModal(room);
    }
}

// Guest Detail Modal Handler
function showRoomDetailModal(room) {
    const modal = document.getElementById('room-detail-modal');
    const title = document.getElementById('room-modal-title');
    const body = document.getElementById('room-modal-body');
    const footer = document.getElementById('room-modal-footer');

    title.textContent = `Room Assigned - #${room.roomNumber}`;
    
    const guest = room.guest;
    const paymentBadge = guest.paymentOption === 2 ? 'badge-card' : 'badge-cash';
    const paymentText = guest.paymentOption === 2 ? 'Credit/Debit Card' : 'Cash';
    
    body.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            <div class="detail-row">
                <span class="detail-label">Guest Name:</span>
                <span class="detail-value">${guest.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Mobile Number:</span>
                <span class="detail-value">${guest.phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${guest.address}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Room Class:</span>
                <span class="detail-value"><span class="badge ${ROOM_RANGES[room.typeId].badgeClass}">${room.typeName}</span></span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Duration of Stay:</span>
                <span class="detail-value">${guest.days} Days</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Type:</span>
                <span class="detail-value"><span class="badge ${paymentBadge}">${paymentText}</span></span>
            </div>
            <div class="detail-row" style="border-top: 1px dashed var(--border-color); padding-top: 1rem;">
                <span class="detail-label" style="font-weight: 700; color: var(--primary);">Total Accrued Bill:</span>
                <span class="detail-value" style="font-weight: 700; color: var(--primary); font-size: 1.1rem;">Rs. ${guest.bill.toLocaleString()}</span>
            </div>
        </div>
    `;

    footer.innerHTML = `
        <button class="btn btn-secondary" id="btn-modal-close-action">Close</button>
        <button class="btn btn-danger" id="btn-modal-checkout-action">Process Checkout</button>
    `;

    // Toggle Modal Active Class
    modal.classList.add('active');

    document.getElementById('btn-modal-close-action').onclick = () => {
        modal.classList.remove('active');
    };

    document.getElementById('btn-modal-checkout-action').onclick = () => {
        modal.classList.remove('active');
        triggerCheckout(room.roomNumber);
    };
}

// Close Modal Events
document.getElementById('btn-close-room-modal').onclick = () => {
    document.getElementById('room-detail-modal').classList.remove('active');
};

// Check-in Live Cost Preview
const checkinForm = document.getElementById('checkin-form');
const roomTypeSelect = document.getElementById('guest-room-type');
const daysInput = document.getElementById('guest-days');
const paymentSelect = document.getElementById('guest-payment');

function updateLiveCheckinCost() {
    const typeId = parseInt(roomTypeSelect.value);
    const days = parseInt(daysInput.value) || 0;
    const payment = parseInt(paymentSelect.value);

    const range = ROOM_RANGES[typeId];
    if (!range) return;

    const baseCharge = range.rate * days;
    let discount = 0;
    if (payment === 2) {
        discount = baseCharge * 0.10; // 10% discount for cards
    }
    const total = baseCharge - discount;

    document.getElementById('estimate-base-charge').textContent = `Rs. ${baseCharge.toLocaleString()}`;
    document.getElementById('estimate-discount').textContent = `Rs. ${discount.toLocaleString()} (${payment === 2 ? '10%' : '0%'})`;
    document.getElementById('estimate-total-bill').textContent = `Rs. ${total.toLocaleString()}`;
}

roomTypeSelect.addEventListener('change', updateLiveCheckinCost);
daysInput.addEventListener('input', updateLiveCheckinCost);
paymentSelect.addEventListener('change', updateLiveCheckinCost);

// Check-in Form Submit
checkinForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('guest-name').value.trim();
    const phone = document.getElementById('guest-phone').value.trim();
    const address = document.getElementById('guest-address').value.trim();
    const typeId = parseInt(roomTypeSelect.value);
    const days = parseInt(daysInput.value);
    const paymentOption = parseInt(paymentSelect.value);

    // Form validation checks
    if (!name || name.length === 0 || !isNaN(name)) {
        showToast("Please enter a valid guest name (non-numeric text)", "error");
        return;
    }
    if (!address || address.length === 0) {
        showToast("Please enter guest address", "error");
        return;
    }
    if (phone.length !== 10 || isNaN(phone)) {
        showToast("Mobile number must be a valid 10-digit number", "error");
        return;
    }
    if (days <= 0 || isNaN(days)) {
        showToast("Duration of stay must be 1 day or more", "error");
        return;
    }

    // Find first vacant room of this type
    const range = ROOM_RANGES[typeId];
    const availableRoom = rooms.find(r => r.typeId === typeId && r.status === 'vacant');

    if (!availableRoom) {
        showToast(`Sorry, there are no vacant rooms available in the ${range.name} class.`, "error");
        return;
    }

    // Calculate final bill
    const baseCharge = range.rate * days;
    const discount = paymentOption === 2 ? (baseCharge * 0.10) : 0;
    const finalBill = baseCharge - discount;

    // Allocate room
    availableRoom.status = 'occupied';
    availableRoom.guest = {
        name,
        phone,
        address,
        days,
        paymentOption,
        bill: finalBill
    };

    saveRooms();
    updateStats();
    showToast(`Checked in successfully! Room #${availableRoom.roomNumber} has been allocated.`, "success");

    // Display billing/invoice modal popup
    showReceiptModal(availableRoom);

    // Reset Form and redirect
    checkinForm.reset();
    updateLiveCheckinCost();
    window.location.hash = 'dashboard';
});

// Toast / Notification alerts
function showToast(message, type = 'success') {
    // Create element
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '2rem';
    toast.style.right = '2rem';
    toast.style.padding = '1rem 1.5rem';
    toast.style.borderRadius = '8px';
    toast.style.color = 'var(--bg-base)';
    toast.style.fontWeight = '600';
    toast.style.fontSize = '0.9rem';
    toast.style.zIndex = '2000';
    toast.style.boxShadow = 'var(--shadow-lg)';
    toast.style.animation = 'fadeIn 0.3s ease forwards';

    if (type === 'success') {
        toast.style.background = 'linear-gradient(135deg, var(--success), #34d399)';
    } else {
        toast.style.background = 'linear-gradient(135deg, var(--danger), #f87171)';
        toast.style.color = '#ffffff';
    }

    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 4000);
}

// Receipt Modal Handler
function showReceiptModal(room) {
    const modal = document.getElementById('receipt-modal');
    const container = document.getElementById('receipt-invoice-print');

    const guest = room.guest;
    const paymentText = guest.paymentOption === 2 ? 'Credit/Debit Card' : 'Cash Payment';
    const rateText = room.rate.toLocaleString();
    const subtotal = room.rate * guest.days;
    const discountText = guest.paymentOption === 2 ? `10% Card Discount` : `None`;

    container.innerHTML = `
        <div class="receipt-header">
            <div class="receipt-hotel-name">GRAND HORIZON HOTEL</div>
            <div class="receipt-hotel-sub">Serving Guests Since 1950</div>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row">
            <label>Guest Name:</label>
            <span>${guest.name}</span>
        </div>
        <div class="receipt-row">
            <label>Mobile Number:</label>
            <span>${guest.phone}</span>
        </div>
        <div class="receipt-row">
            <label>Guest Address:</label>
            <span>${guest.address}</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row">
            <label>Room Assigned:</label>
            <span>Room #${room.roomNumber} (${room.typeName})</span>
        </div>
        <div class="receipt-row">
            <label>Daily Room rate:</label>
            <span>Rs. ${rateText} / Day</span>
        </div>
        <div class="receipt-row">
            <label>Duration of Stay:</label>
            <span>${guest.days} Days</span>
        </div>
        <div class="receipt-row">
            <label>Subtotal Rate:</label>
            <span>Rs. ${subtotal.toLocaleString()}</span>
        </div>
        <div class="receipt-row">
            <label>Payment Discount:</label>
            <span>${discountText}</span>
        </div>
        <div class="receipt-row total-row">
            <label>GRAND TOTAL:</label>
            <span>Rs. ${guest.bill.toLocaleString()}</span>
        </div>
        <div class="receipt-divider"></div>
        <div class="receipt-row">
            <label>Payment Method:</label>
            <span>${paymentText}</span>
        </div>
        <div class="receipt-footer">
            Thank you for staying at Grand Horizon.<br>Hope you enjoyed our hospitality!
        </div>
    `;

    modal.classList.add('active');

    document.getElementById('btn-close-receipt-modal').onclick = () => {
        modal.classList.remove('active');
    };
    document.getElementById('btn-done-receipt').onclick = () => {
        modal.classList.remove('active');
    };
    document.getElementById('btn-print-receipt').onclick = () => {
        window.print();
    };
}

// Checkout Controller
const checkoutForm = document.getElementById('checkout-form');
const checkoutRoomInput = document.getElementById('checkout-room-no');
const checkoutSearchBtn = document.getElementById('btn-checkout-search');
const checkoutSubmitBtn = document.getElementById('btn-checkout-submit');
const checkoutEmptyState = document.getElementById('checkout-empty-state');
const checkoutActiveProfile = document.getElementById('checkout-active-profile');

function resetCheckoutForm() {
    checkoutForm.reset();
    checkoutSubmitBtn.disabled = true;
    checkoutEmptyState.style.display = 'flex';
    checkoutActiveProfile.style.display = 'none';
}

function searchCheckoutGuest() {
    const roomNo = parseInt(checkoutRoomInput.value);
    if (!roomNo || isNaN(roomNo)) {
        showToast("Please enter a valid room number", "error");
        return;
    }

    const room = rooms.find(r => r.roomNumber === roomNo);
    if (!room) {
        showToast("Room number does not exist. (Range: 1 - 50)", "error");
        return;
    }

    if (room.status === 'vacant') {
        showToast(`Room #${roomNo} is already vacant.`, "error");
        resetCheckoutForm();
        return;
    }

    // If occupied, render active profile
    checkoutEmptyState.style.display = 'none';
    checkoutActiveProfile.style.display = 'block';
    checkoutSubmitBtn.disabled = false;

    const guest = room.guest;
    const paymentBadge = guest.paymentOption === 2 ? 'badge-card' : 'badge-cash';
    const paymentText = guest.paymentOption === 2 ? 'Credit/Debit Card' : 'Cash';

    checkoutActiveProfile.innerHTML = `
        <div class="card" style="background-color: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); padding: 1.25rem;">
            <h4 style="color: var(--primary); margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem;">Billing Verification Summary</h4>
            <div class="detail-row">
                <span class="detail-label">Guest Occupant:</span>
                <span class="detail-value">${guest.name}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Assigned Room:</span>
                <span class="detail-value">Room #${room.roomNumber} (${room.typeName})</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Mobile Number:</span>
                <span class="detail-value">${guest.phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Duration of stay:</span>
                <span class="detail-value">${guest.days} Days</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Payment Method:</span>
                <span class="detail-value"><span class="badge ${paymentBadge}">${paymentText}</span></span>
            </div>
            <div class="detail-row" style="margin-top: 0.5rem; padding-top: 0.75rem; border-top: 1px dashed var(--border-color);">
                <span class="detail-label" style="font-weight: 700; color: var(--primary);">Final Balance Payable:</span>
                <span class="detail-value" style="font-weight: 700; color: var(--primary); font-size: 1.15rem;">Rs. ${guest.bill.toLocaleString()}</span>
            </div>
        </div>
    `;
}

checkoutSearchBtn.addEventListener('click', searchCheckoutGuest);

function triggerCheckout(roomNumber) {
    const room = rooms.find(r => r.roomNumber === roomNumber);
    if (!room || room.status === 'vacant') return;

    // Show receipt modal first so they can print/view
    showReceiptModal(room);

    // Save check-out updates
    const guestName = room.guest.name;
    room.status = 'vacant';
    room.guest = null;

    saveRooms();
    updateStats();
    renderRoomMap();
    resetCheckoutForm();
    showToast(`Successfully checked out ${guestName} from Room #${roomNumber}!`, "success");
}

checkoutForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const roomNo = parseInt(checkoutRoomInput.value);
    triggerCheckout(roomNo);
});

// Directory Panel search and filtering
const directorySearchInput = document.getElementById('directory-search');
const directoryFilterClass = document.getElementById('directory-filter-room-class');

function renderDirectoryTable() {
    const tbody = document.getElementById('directory-table-body');
    tbody.innerHTML = ''; // clear

    const filterClass = directoryFilterClass.value;
    const searchQuery = directorySearchInput.value.toLowerCase().trim();

    // Only active occupied rooms or previously checked guests (in this simple design, we check active list)
    const occupiedRooms = rooms.filter(r => r.status === 'occupied');

    const filtered = occupiedRooms.filter(room => {
        // Class Filter
        if (filterClass !== 'all' && room.typeId !== parseInt(filterClass)) {
            return false;
        }

        // Search Query (name, room number, or mobile)
        if (searchQuery) {
            const nameMatch = room.guest.name.toLowerCase().includes(searchQuery);
            const phoneMatch = room.guest.phone.includes(searchQuery);
            const roomMatch = room.roomNumber.toString() === searchQuery;
            return nameMatch || phoneMatch || roomMatch;
        }

        return true;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem;">
                    No active guests found matching the search criteria.
                </td>
            </tr>
        `;
        return;
    }

    filtered.forEach(room => {
        const guest = room.guest;
        const tr = document.createElement('tr');
        const paymentBadge = guest.paymentOption === 2 ? 'badge-card' : 'badge-cash';
        const paymentText = guest.paymentOption === 2 ? 'Card' : 'Cash';
        const roomClassBadge = ROOM_RANGES[room.typeId].badgeClass;

        tr.innerHTML = `
            <td style="font-weight: 700; color: var(--primary);">#${room.roomNumber}</td>
            <td style="font-weight: 600;">${guest.name}</td>
            <td>${guest.phone}</td>
            <td><span class="badge ${roomClassBadge}">${room.typeName}</span></td>
            <td>${guest.days} Days</td>
            <td><span class="badge ${paymentBadge}">${paymentText}</span></td>
            <td style="font-weight: 700;">Rs. ${guest.bill.toLocaleString()}</td>
            <td>
                <button class="btn btn-secondary btn-sm-checkout" style="padding: 0.4rem 0.8rem; font-size: 0.8rem; border-color: rgba(239, 68, 68, 0.3); color: var(--danger);" data-room="${room.roomNumber}">
                    Check-Out
                </button>
            </td>
        `;

        // Action binding
        tr.querySelector('.btn-sm-checkout').onclick = () => {
            triggerCheckout(room.roomNumber);
            renderDirectoryTable();
        };

        tbody.appendChild(tr);
    });
}

directorySearchInput.addEventListener('input', renderDirectoryTable);
directoryFilterClass.addEventListener('change', renderDirectoryTable);

// App Bootstrapping
window.addEventListener('DOMContentLoaded', () => {
    initRooms();
    updateStats();
    initNavigation();
    
    // Auto-update stats every few seconds to keep GUI dashboard in sync
    setInterval(updateStats, 5000);
});
