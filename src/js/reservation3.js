let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); 
let bookedDates = []; 
let currentRoomPrices = []; 
let currentSeasons = []; 
let currentHolidays = []; // 🌟 1. 공휴일 데이터를 저장할 배열 추가

let startDate = null; 
let endDate = null;

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId') || 1; 

    document.querySelector(".btn-submit").disabled = true;

    fetchRoomData(roomId);
});

async function fetchRoomData(roomId) {
    try {
        // 🌟 2. fetch 목록에 holiday(공휴일) 추가
        const [roomRes, seasonRes, priceRes, reserveRes, holidayRes] = await Promise.all([
            fetch(`/rooms/${roomId}`),
            fetch(`/season`),
            fetch(`/price?room_id=${roomId}`),
            fetch(`/reservation?room_id=${roomId}`),
            fetch(`/holiday`) // 공휴일 불러오기
        ]);

        const room = await roomRes.json();
        currentSeasons = await seasonRes.json();
        currentRoomPrices = await priceRes.json();
        const reservations = await reserveRes.json();
        currentHolidays = await holidayRes.json(); // 데이터 저장

        renderRoomInfo(room);
        bookedDates = extractBookedDates(reservations);
        renderCalendar();
        setupCalendarEvents();

    } catch (error) {
        console.error("데이터를 불러오는데 실패했습니다.", error);
    }
}

function renderCalendar() {
    const title = document.getElementById("calendar-title");
    const grid = document.getElementById("calendar-grid");
    
    grid.innerHTML = ""; 
    title.textContent = `${currentYear}년 ${String(currentMonth + 1).padStart(2, '0')}월`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); 
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); 
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate(); 

    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. 저번 달 날짜 채우기
    for (let i = firstDay; i > 0; i--) {
        const div = document.createElement("div");
        div.className = "date-cell disabled";
        div.textContent = daysInPrevMonth - i + 1;
        grid.appendChild(div);
    }

    // 2. 이번 달 날짜 채우기
    for (let i = 1; i <= daysInMonth; i++) {
        const cellDate = new Date(currentYear, currentMonth, i);
        const dateStr = formatDateString(cellDate);
        
        const div = document.createElement("div");
        div.className = "date-cell";
        
        const numSpan = document.createElement("span");
        numSpan.textContent = i;
        div.appendChild(numSpan);

        // 🌟 3. 현재 날짜가 db.json의 공휴일 목록에 있는지 확인
        const isHoliday = currentHolidays.some(h => h.holiday_date === dateStr);

        // 일요일이거나 공휴일이면 글씨를 빨간색으로 변경
        if (cellDate.getDay() === 0 || isHoliday) {
            div.style.color = "#ff6b6b";
            // 원하신다면 div.title = "공휴일"; 처럼 마우스 오버 시 툴팁을 넣을 수도 있습니다.
        }

        if (cellDate < today) {
            div.classList.add("disabled");
            div.style.color = "#ddd";
        } else if (bookedDates.includes(dateStr)) {
            div.classList.add("reserved");
            const resSpan = document.createElement("div");
            resSpan.className = "reserved-text";
            resSpan.textContent = "예약완료";
            div.appendChild(resSpan);
        } else {
            div.addEventListener("click", () => handleDateSelection(cellDate));
        }

        if (startDate && cellDate.getTime() === startDate.getTime()) {
            div.classList.add("selected");
            const label = document.createElement("span");
            label.className = "label";
            label.textContent = "입실";
            div.appendChild(label);
        } else if (endDate && cellDate.getTime() === endDate.getTime()) {
            div.classList.add("selected");
            const label = document.createElement("span");
            label.className = "label";
            label.textContent = "퇴실";
            div.appendChild(label);
        } else if (startDate && endDate && cellDate > startDate && cellDate < endDate) {
            div.classList.add("in-range");
        }

        grid.appendChild(div);
    }

    // 3. 다음 달 날짜 채우기
    const totalCells = firstDay + daysInMonth;
    const nextMonthDays = 42 - totalCells; 
    
    for (let i = 1; i <= nextMonthDays; i++) {
        // 🌟 자바스크립트는 13월이 되면 자동으로 다음 년도 1월로 똑똑하게 계산해줍니다
        const cellDate = new Date(currentYear, currentMonth + 1, i);
        const dateStr = formatDateString(cellDate);
        
        const div = document.createElement("div");
        div.className = "date-cell"; // 클릭을 막던 'disabled' 제거
        
        // 다음 달 날짜라는 걸 티 내기 위해 기본 투명도를 살짝 낮춤
        div.style.opacity = "0.4"; 
        
        const numSpan = document.createElement("span");
        numSpan.textContent = i;
        div.appendChild(numSpan);

        // 공휴일/일요일 빨간색 처리
        const isHoliday = currentHolidays.some(h => h.holiday_date === dateStr);
        if (cellDate.getDay() === 0 || isHoliday) {
            div.style.color = "#ff6b6b";
        }

        // 예약 상태 및 클릭 이벤트 추가
        if (bookedDates.includes(dateStr)) {
            div.classList.add("reserved");
            const resSpan = document.createElement("div");
            resSpan.className = "reserved-text";
            resSpan.textContent = "예약완료";
            div.appendChild(resSpan);
        } else {
            // 🌟 다음 달 날짜도 클릭할 수 있게 이벤트 연결
            div.addEventListener("click", () => handleDateSelection(cellDate));
        }

        // 입실/퇴실 선택 시 스타일 적용 (선택되면 다시 선명해지게 opacity = "1")
        if (startDate && cellDate.getTime() === startDate.getTime()) {
            div.classList.add("selected");
            div.style.opacity = "1";
            const label = document.createElement("span");
            label.className = "label";
            label.textContent = "입실";
            div.appendChild(label);
        } else if (endDate && cellDate.getTime() === endDate.getTime()) {
            div.classList.add("selected");
            div.style.opacity = "1";
            const label = document.createElement("span");
            label.className = "label";
            label.textContent = "퇴실";
            div.appendChild(label);
        } else if (startDate && endDate && cellDate > startDate && cellDate < endDate) {
            div.classList.add("in-range");
            div.style.opacity = "1";
        }

        grid.appendChild(div);
    }
}

function handleDateSelection(cellDate) {
    if (!startDate || (startDate && endDate)) {
        startDate = cellDate;
        endDate = null;
    } else if (startDate && !endDate) {
        if (cellDate < startDate) {
            startDate = cellDate;
        } else if (cellDate.getTime() === startDate.getTime()) {
            startDate = null;
        } else {
            const diffDays = Math.round(Math.abs(cellDate - startDate) / (1000 * 60 * 60 * 24));
            if (diffDays > 6) {
                showCustomAlert("최대 6일 예약이 가능합니다");
                return;
            }

            let hasBooked = false;
            for (let d = new Date(startDate); d < cellDate; d.setDate(d.getDate() + 1)) {
                if (bookedDates.includes(formatDateString(d))) {
                    hasBooked = true;
                    break;
                }
            }
            if (hasBooked) {
                showCustomAlert("선택한 기간 내에 예약이 완료된 날짜가 포함되어 있습니다.");
                startDate = cellDate; 
                renderCalendar();
                calculatePrice();
                return;
            }

            endDate = cellDate;
        }
    }
    
    renderCalendar();
    calculatePrice();
}

function setupCalendarEvents() {
    document.getElementById("prev-month").addEventListener("click", () => {
        const today = new Date();
        
        // 🌟 이번 달 이하일 경우 알림 없이 그냥 조용히 리턴(멈춤)
        if (currentYear < today.getFullYear() || (currentYear === today.getFullYear() && currentMonth <= today.getMonth())) {
            return; 
        }

        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById("next-month").addEventListener("click", () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
}

function extractBookedDates(reservations) {
    const dates = [];
    reservations.forEach(res => {
        let current = new Date(res.check_in_date);
        const end = new Date(res.check_out_date);
        
        while (current < end) {
            dates.push(formatDateString(current));
            current.setDate(current.getDate() + 1);
        }
    });
    return dates;
}

function formatDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function renderRoomInfo(room) {
    document.getElementById("room-title").textContent = room.name_eng.toUpperCase();
    document.getElementById("room-desc-ko").textContent = room.desc;
    document.getElementById("room-desc-en").textContent = room.desc_eng;
    
    document.getElementById("capacity-note").textContent = `기준 인원 ${room.min}명, 추가 시 한 명당 객실 가격의 20%`;

    const extraGuestSelect = document.getElementById("extra-guest");
    const extraGuestGroup = extraGuestSelect.closest(".form-group"); 
    
    const maxExtra = room.capacity - room.min;

    // 🌟 1. 무조건 화면에 보이도록 표시
    extraGuestGroup.style.display = "flex"; 
    extraGuestSelect.innerHTML = ""; 

    if (maxExtra === 0) {
        // 🌟 2. 추가 인원이 불가능한 방일 경우: "없음"만 넣고 비활성화(disabled)
        const option = document.createElement("option");
        option.value = 0;
        option.textContent = "없음";
        extraGuestSelect.appendChild(option);
        
        extraGuestSelect.disabled = true; // 선택 불가능하게 잠금
        extraGuestSelect.style.backgroundColor = "#f5f5f5"; // 회색 배경으로 변경해 시각적 안내
        
    } else {
        // 🌟 3. 추가 인원이 가능한 경우: 옵션을 채우고 활성화
        extraGuestSelect.disabled = false;
        extraGuestSelect.style.backgroundColor = "#fff"; // 원래 흰색 배경으로
        
        for (let i = 0; i <= maxExtra; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i === 0 ? "없음" : `${i}명`;
            extraGuestSelect.appendChild(option);
        }
        
        extraGuestSelect.addEventListener("change", calculatePrice);
    }

    // 🌟 수정된 부분: 가짜 이미지(placehold.co) 대신 db.json의 실제 이미지 데이터를 연결합니다.
    const mainImg = document.getElementById("main-img");
    
    // 1. 이미지가 배열에 있다면 첫 번째 이미지를 메인 이미지로 띄움
    if (room.images && room.images.length > 0) {
        mainImg.src = room.images[0]; 
    }

    const thumbList = document.getElementById("thumb-list");
    thumbList.innerHTML = ""; 
    
    // 2. 썸네일 이미지들도 진짜 이미지 경로로 반복해서 만들어 줌
    if (room.images) {
        room.images.forEach(imgPath => {
            const imgEl = document.createElement("img");
            imgEl.src = imgPath; 
            
            // 3. 썸네일을 클릭하면 메인 이미지가 해당 이미지로 바뀌도록 설정
            imgEl.addEventListener("click", () => {
                mainImg.src = imgEl.src;
            });
            
            thumbList.appendChild(imgEl);
        });
    }
}

function calculatePrice() {
    const priceDisplay = document.getElementById("total-price");
    const submitBtn = document.querySelector(".btn-submit");
    
    const extraGuests = parseInt(document.getElementById("extra-guest").value) || 0;
    
    if (!startDate || !endDate) {
        priceDisplay.textContent = "0";
        submitBtn.disabled = true; 
        return;
    }

    submitBtn.disabled = false;

    let totalPrice = 0;

    for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        
        const peakSeason = currentSeasons.find(s => s.id === 2);
        const peakStart = new Date(peakSeason.start_date);
        const peakEnd = new Date(peakSeason.end_date);
        
        let currentSeasonId = 1; 
        if (d >= peakStart && d <= peakEnd) {
            currentSeasonId = 2; 
        }

        const dateStr = formatDateString(d);
        const isHoliday = currentHolidays.some(h => h.holiday_date === dateStr); // 🌟 공휴일 체크
        const dayOfWeek = d.getDay();
        const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6); 

        const currentPriceObj = currentRoomPrices.find(p => p.season_id === currentSeasonId);

        if (currentPriceObj) {
            let baseDailyPrice = 0;

            // 🌟 4. 요금 적용 우선순위 (공휴일 -> 주말 -> 평일)
            if (isHoliday) {
                baseDailyPrice = currentPriceObj.holiday_price;
            } else if (isWeekend) {
                baseDailyPrice = currentPriceObj.weekend_price;
            } else {
                baseDailyPrice = currentPriceObj.weekday_price;
            }
            
            let extraCharge = baseDailyPrice * 0.2 * extraGuests;
            totalPrice += (baseDailyPrice + extraCharge);
        }
    }

    priceDisplay.textContent = totalPrice.toLocaleString();
}

document.querySelector(".btn-submit").addEventListener("click", () => {
    if (!startDate || !endDate) {
        showCustomAlert("체크인과 체크아웃 날짜를 선택해주세요.");
        return;
    }

    const roomId = new URLSearchParams(window.location.search).get('roomId') || 1;
    const checkin = formatDateString(startDate);
    const checkout = formatDateString(endDate);
    const guests = document.getElementById("extra-guest").value;
    const price = document.getElementById("total-price").textContent.replace(/,/g, ''); 

    const queryString = `?roomId=${roomId}&checkin=${checkin}&checkout=${checkout}&guests=${guests}&price=${price}`;
    window.location.href = `reservation5.html` + queryString;
});

document.addEventListener("DOMContentLoaded", () => {
    // ... 기존 코드들 ...

    // 🌟 모달창 닫기 버튼 이벤트 추가
    const alertModal = document.getElementById("alert-modal");
    const alertConfirmBtn = document.getElementById("alert-modal-confirm-btn");
    
    if(alertConfirmBtn) {
        alertConfirmBtn.addEventListener("click", () => {
            alertModal.style.display = "none";
        });
    }
});

// 🌟 모달창을 띄우는 전용 함수 추가 (파일 맨 아래 등 빈 곳에 추가)
function showCustomAlert(message) {
    const modal = document.getElementById("alert-modal");
    const msgBox = document.getElementById("alert-modal-msg");
    
    msgBox.textContent = message;
    modal.style.display = "flex";
}