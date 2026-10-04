function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function calculateReferralPoints(customerID, allCustomers) {
    const customer = allCustomers.find(c => c.id === customerID);
    
    if (!customer || !customer.referredBy) {
        return 0;
    }

    return 10 + calculateReferralPoints(customer.referredBy, allCustomers);
}

function suggestAdjacentRooms(hotelMatrix, floorIndex, quantity) {
    const floorRooms = hotelMatrix[floorIndex];
    if (!floorRooms) return null;
    
    if (quantity > floorRooms.length) {
        return { error: "Số lượng phòng yêu cầu vượt quá số phòng tối đa trên một tầng." };
    }

    let consecutiveRooms = [];
    for (let i = 0; i < floorRooms.length; i++) {
        const room = floorRooms[i];
        if (!room.getIsBooked()) {
            consecutiveRooms.push(room);
            if (consecutiveRooms.length === quantity) {
                return { rooms: consecutiveRooms };
            }
        } else {
            consecutiveRooms = []; 
        }
    }

    return { rooms: null }; 
}