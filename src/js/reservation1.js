document.addEventListener("DOMContentLoaded", () => {
    fetchPriceData();
});

async function fetchPriceData() {
    try {
        // 객실, 시즌, 가격 정보를 동시에 가져옵니다.
        const [roomRes, seasonRes, priceRes] = await Promise.all([
            fetch('/rooms'),
            fetch('/season'),
            fetch('/price')
        ]);

        const rooms = await roomRes.json();
        const seasons = await seasonRes.json();
        const prices = await priceRes.json();

        renderPriceTable(rooms, seasons, prices);

    } catch (error) {
        console.error("데이터를 불러오는데 실패했습니다.", error);
    }
}

function renderPriceTable(rooms, seasons, prices) {
    const tbody = document.getElementById("price-tbody");
    tbody.innerHTML = ""; // 초기화

    rooms.forEach(room => {
        // 해당 방의 비수기(1)와 성수기(2) 가격 데이터를 찾습니다.
        const offSeason = prices.find(p => p.room_id === room.id && p.season_id === 1) || {};
        const peakSeason = prices.find(p => p.room_id === room.id && p.season_id === 2) || {};

        const tr = document.createElement("tr");

        // 1. 객실명, 면적, 인원
        tr.innerHTML += `<td class="room-name-td">${room.name}</td>`;
        tr.innerHTML += `<td>${room.area}㎡</td>`;
        tr.innerHTML += `<td>${room.min}/${room.capacity}</td>`;

        // 2. 비수기 요금 (주중, 주말, 휴일)
        tr.innerHTML += `<td>${(offSeason.weekday_price || 0).toLocaleString()}</td>`;
        tr.innerHTML += `<td>${(offSeason.weekend_price || 0).toLocaleString()}</td>`;
        tr.innerHTML += `<td>${(offSeason.holiday_price || 0).toLocaleString()}</td>`;

        // 3. 성수기 요금 (주중, 주말, 휴일)
        tr.innerHTML += `<td>${(peakSeason.weekday_price || 0).toLocaleString()}</td>`;
        tr.innerHTML += `<td>${(peakSeason.weekend_price || 0).toLocaleString()}</td>`;
        tr.innerHTML += `<td>${(peakSeason.holiday_price || 0).toLocaleString()}</td>`;

        tbody.appendChild(tr);
    });
}