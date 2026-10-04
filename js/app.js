const system = new BookingSystem();
document.addEventListener("DOMContentLoaded", () => {
    initMockData();
    loadFromLocalStorage();
    setupNavigation();
    setupEventListeners();
    renderAll();
});
function initMockData() {
    // Khởi tạo Mock Data Khách hàng có sẵn để kiểm chứng đệ quy Referral
    const c1 = new Customer("CUS01", "Nguyễn Văn A", "0901111111", null);
    const c2 = new Customer("CUS02", "Trần Thị B", "0902222222", "CUS01");
    const c3 = new Customer("CUS03", "Lê Văn C", "0903333333", "CUS02");
    system.customers.push(c1, c2, c3);

    // Mảng 2D khởi tạo 3 tầng, mỗi tầng 5 phòng
    const matrix = [];
    const types = ["Standard", "VIP", "President"];
    const prices = [1000000, 2500000, 5000000];

    for (let f = 0; f < 3; f++) {
        const floorRooms = [];
        for (let r = 1; r <= 5; r++) {
            const roomId = `${f + 1}0${r}`;
            const typeIndex = f; // Tầng 1: Standard, Tầng 2: VIP, Tầng 3: President
            floorRooms.push(new Room(roomId, types[typeIndex], f + 1, prices[typeIndex]));
        }
        matrix.push(floorRooms);
    }
    system.setMatrix(matrix);
}

function saveData() {
    localStorage.setItem("luxestay_matrix", JSON.stringify(system.hotelMatrix));
    localStorage.setItem("luxestay_bookings", JSON.stringify(system.bookingHistory));
    localStorage.setItem("luxestay_customers", JSON.stringify(system.customers));
}

function loadFromLocalStorage() {
    const rawMatrix = localStorage.getItem("luxestay_matrix");
    const rawBookings = localStorage.getItem("luxestay_bookings");
    const rawCustomers = localStorage.getItem("luxestay_customers");

    if (rawMatrix) {
        const parsedMatrix = JSON.parse(rawMatrix);
        // Re-instantiation: Map lại data thô thành Instance của Lớp Room
        system.hotelMatrix = parsedMatrix.map(floor =>
            floor.map(r => new Room(r.id, r.type, r.floor, r.basePrice, r.isBooked))
        );
    }

    if (rawBookings) {
        system.bookingHistory = JSON.parse(rawBookings);
    }

    if (rawCustomers) {
        system.customers = JSON.parse(rawCustomers).map(c => new Customer(c.id, c.name, c.phone, c.referredBy));
    }
}

// --- UI ROUTING ---
function setupNavigation() {
    const navClient = document.getElementById("nav-client");
    const navAdmin = document.getElementById("nav-admin");
    const clientView = document.getElementById("client-view");
    const adminView = document.getElementById("admin-view");

    navClient.addEventListener("click", () => {
        navClient.classList.add("active");
        navAdmin.classList.remove("active");
        clientView.classList.remove("hidden");
        adminView.classList.add("hidden");
    });

    navAdmin.addEventListener("click", () => {
        navAdmin.classList.add("active");
        navClient.classList.remove("active");
        adminView.classList.remove("hidden");
        clientView.classList.add("hidden");
        renderAdminDashboard();
    });
}

function renderAll() {
    renderHotelMap();
    renderAdminDashboard();
}

function renderHotelMap(highlightRoomIds = []) {
    const mapContainer = document.getElementById("hotel-map");
    mapContainer.innerHTML = "";

    system.hotelMatrix.forEach((floor, fIndex) => {
        const floorDiv = document.createElement("div");
        floorDiv.className = "floor-row";
        
        const title = document.createElement("div");
        title.className = "floor-title";
        title.textContent = `Tầng ${fIndex + 1}`;
        floorDiv.appendChild(title);

        const grid = document.createElement("div");
        grid.className = "rooms-grid";

        floor.forEach(room => {
            const card = document.createElement("div");
            
            let bgClass = room.getIsBooked() ? "bg-red" : "bg-green";
            if (highlightRoomIds.includes(room.id)) {
                bgClass = "bg-highlight";
            }
            
            card.className = `room-card ${bgClass}`;
            card.innerHTML = `<strong>${room.id}</strong><br>${room.type}<br>${formatCurrency(room.basePrice)}`;

            card.addEventListener("click", () => handleRoomSelect(room));
            grid.appendChild(card);
        });

        floorDiv.appendChild(grid);
        mapContainer.appendChild(floorDiv);
    });
}

function handleRoomSelect(room) {
    if (room.getIsBooked()) {
        alert("Phòng này đã được đặt, vui lòng chọn phòng khác.");
        return;
    }
    document.getElementById("booking-room-id").value = room.id;
}

function setupEventListeners() {

    document.getElementById("cust-id").addEventListener("input", (e) => {
        const custId = e.target.value.trim();
        const discountMsg = document.getElementById("referral-discount-msg");
        const points = calculateReferralPoints(custId, system.customers);
        
        if (points >= 20) {
            discountMsg.textContent = `Bạn tích lũy được ${points} điểm referral: ĐƯỢC GIẢM GIA 5%!`;
        } else {
            discountMsg.textContent = points > 0 ? `Điểm referral hiện tại: ${points} (Cần 20 điểm để giảm 5%)` : "";
        }
    });

    document.getElementById("booking-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const errorMsg = document.getElementById("form-error-msg");
        errorMsg.textContent = "";

        const roomId = document.getElementById("booking-room-id").value;
        const custId = document.getElementById("cust-id").value.trim();
        const custName = document.getElementById("cust-name").value.trim();
        const custPhone = document.getElementById("cust-phone").value.trim();
        const custReferred = document.getElementById("cust-referred").value.trim() || null;

        if (!roomId) {
            errorMsg.textContent = "Vui lòng chọn phòng trên sơ đồ!";
            return;
        }

        let selectedRoom = null;
        for (const floor of system.hotelMatrix) {
            selectedRoom = floor.find(r => r.id === roomId);
            if (selectedRoom) break;
        }

        try {
            selectedRoom.book(); // Thực thi Encapsulation method
        } catch (err) {
            errorMsg.textContent = err.message;
            return;
        }

        const newCustomer = new Customer(custId, custName, custPhone, custReferred);
        system.addCustomer(newCustomer);

        const points = calculateReferralPoints(custId, system.customers);
        let finalPrice = selectedRoom.basePrice;
        if (points >= 20) finalPrice *= 0.95;

        const bookingRecord = {
            id: "BK_" + Date.now(),
            roomId: selectedRoom.id,
            customerName: custName,
            customerPhone: custPhone,
            totalAmount: finalPrice
        };
        system.addBooking(bookingRecord);

        saveData();

        document.getElementById("booking-form").reset();
        document.getElementById("booking-room-id").value = "";
        document.getElementById("referral-discount-msg").textContent = "";
        alert("Đặt phòng thành công!");
        renderAll();
    });

    document.getElementById("btn-suggest").addEventListener("click", () => {
        const floorIdx = parseInt(document.getElementById("suggest-floor").value, 10);
        const qty = parseInt(document.getElementById("suggest-qty").value, 10);
        const msgBox = document.getElementById("suggest-msg");
        
        const result = suggestAdjacentRooms(system.hotelMatrix, floorIdx, qty);
        if (result.error) {
            msgBox.className = "msg-box error-text";
            msgBox.textContent = result.error;
            renderHotelMap();
        } else if (!result.rooms) {
            msgBox.className = "msg-box error-text";
            msgBox.textContent = "Không tìm thấy dãy phòng liền kề còn trống theo yêu cầu.";
            renderHotelMap();
        } else {
            msgBox.className = "msg-box highlight-text";
            msgBox.textContent = `Đã tìm thấy ${qty} phòng liền kề trống!`;
            const roomIds = result.rooms.map(r => r.id);
            renderHotelMap(roomIds);
        }
    });

    document.getElementById("btn-filter-vip").addEventListener("click", () => {
        // Modern Array: filter
        const filtered = system.bookingHistory.filter(b => b.totalAmount > 2000000);
        renderBookingTable(filtered);
    });

    document.getElementById("btn-sort-price").addEventListener("click", () => {
        // Modern Array: sort với callback chuẩn
        const sorted = [...system.bookingHistory].sort((a, b) => a.totalAmount - b.totalAmount);
        renderBookingTable(sorted);
    });

    document.getElementById("btn-reset-table").addEventListener("click", () => {
        renderBookingTable(system.bookingHistory);
    });

    document.getElementById("btn-export-email").addEventListener("click", () => {
        // Modern Array: map
        const customerList = system.bookingHistory.map(b => `${b.customerName} (${b.customerPhone})`);
        alert("Danh sách khách hàng nhận tri ân:\n" + customerList.join("\n"));
    });
}

function renderAdminDashboard() {
    renderCustomerTable();
    renderBookingTable(system.bookingHistory);
    renderCanvasChart();
}

function renderCustomerTable() {
    const tbody = document.querySelector("#customer-table tbody");
    tbody.innerHTML = "";

    system.customers.forEach(c => {
        const tr = document.createElement("tr");
        const points = calculateReferralPoints(c.id, system.customers);
        tr.innerHTML = `
            <td>${c.id}</td>
            <td>${c.name}</td>
            <td>${c.phone}</td>
            <td>${c.referredBy || 'Không'}</td>
            <td><strong>${points} pts</strong></td>
        `;
        tbody.appendChild(tr);
    });
}

function renderBookingTable(records) {
    const tbody = document.querySelector("#booking-table tbody");
    tbody.innerHTML = "";

    records.forEach(b => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${b.id}</td>
            <td>${b.roomId}</td>
            <td>${b.customerName}</td>
            <td>${b.customerPhone}</td>
            <td>${formatCurrency(b.totalAmount)}</td>
        `;
        tbody.appendChild(tr);
    });

    const totalRev = system.bookingHistory.reduce((sum, item) => sum + item.totalAmount, 0);
    document.getElementById("total-revenue-val").textContent = formatCurrency(totalRev);
}

function renderCanvasChart() {
    const canvas = document.getElementById("revenue-chart");
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const revenueByType = { Standard: 0, VIP: 0, President: 0 };
    
    system.bookingHistory.forEach(b => {
        // Tìm loại phòng dựa trên roomId
        for (const floor of system.hotelMatrix) {
            const found = floor.find(r => r.id === b.roomId);
            if (found) {
                revenueByType[found.type] = (revenueByType[found.type] || 0) + b.totalAmount;
                break;
            }
        }
    });

    const categories = Object.keys(revenueByType);
    const values = Object.values(revenueByType);
    const maxVal = Math.max(...values, 10000000); // Mức trần tham chiếu tối thiểu 10TR

    const barWidth = 60;
    const gap = 50;
    const startX = 80;
    const startY = 200;

    ctx.beginPath();
    ctx.moveTo(50, 20);
    ctx.lineTo(50, startY);
    ctx.lineTo(450, startY);
    ctx.strokeStyle = "#333";
    ctx.stroke();

    categories.forEach((cat, index) => {
        const val = values[index];
        const barHeight = (val / maxVal) * 150;
        const x = startX + index * (barWidth + gap);
        const y = startY - barHeight;

        ctx.fillStyle = index === 0 ? "#3498db" : index === 1 ? "#9b59b6" : "#f1c40f";
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.fillStyle = "#333";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(cat, x + barWidth / 2, startY + 15);

        ctx.fillText(`${(val / 1000000).toFixed(1)}M`, x + barWidth / 2, y - 5);
    });
}