/**
 * Lớp biểu diễn cho một Phòng nghỉ trong khách sạn
 */
class Room {
    #isBooked;

    constructor(id, type, floor, basePrice, isBooked = false) {
        this.id = id;
        this.type = type; // Standard, VIP, President
        this.floor = floor;
        this._basePrice = basePrice >= 0 ? basePrice : 0;
        this.#isBooked = Boolean(isBooked);
    }

    get basePrice() {
        return this._basePrice;
    }

    set basePrice(value) {
        if (value < 0) {
            throw new Error("Giá phòng không được là số âm.");
        }
        this._basePrice = value;
    }

    getIsBooked() {
        return this.#isBooked;
    }

    book() {
        if (this.#isBooked) {
            throw new Error(`Phòng ${this.id} đã được đặt trước đó!`);
        }
        this.#isBooked = true;
        return true;
    }

    cancel() {
        this.#isBooked = false;
    }

    // Phục vụ việc Serialize sang JSON bao gồm cả Private Field
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            floor: this.floor,
            basePrice: this.basePrice,
            isBooked: this.#isBooked
        };
    }
}

/**
 * Lớp biểu diễn Thông tin Khách hàng
 */
class Customer {
    constructor(id, name, phone, referredBy = null) {
        this.id = id;
        this.name = name;
        this.phone = phone;
        this.referredBy = referredBy;
    }
}

/**
 * Lớp Quản lý Hệ thống Khách sạn
 */
class BookingSystem {
    constructor() {
        this.hotelMatrix = []; // Mảng 2D [Tầng][Phòng]
        this.bookingHistory = [];
        this.customers = [];
    }

    setMatrix(matrix) {
        this.hotelMatrix = matrix;
    }

    addBooking(bookingRecord) {
        // Áp dụng Deep Clone tránh bẫy Ghost Cart Trap
        const clonedRecord = JSON.parse(JSON.stringify(bookingRecord));
        this.bookingHistory.push(clonedRecord);
    }

    addCustomer(customer) {
        const existing = this.customers.find(c => c.id === customer.id);
        if (!existing) {
            this.customers.push(customer);
        }
    }
}