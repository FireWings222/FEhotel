let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0 ~ 11
let bookedDates = []; // 예약된 날짜들을 저장할 배열
let selectedDateString = ""; // 사용자가 선택한 날짜
let currentRoomPrices = []; // 가격 계산을 위해 저장
let currentSeasons = []; // 시즌 계산을 위해 저장

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('roomId') || 1; 

    fetchRoomData(roomId);
});

async function fetchRoomData(roomId) {
    try {
        // 예약 정보(reservation)까지 같이 불러옵니다.
        const [roomRes, seasonRes, priceRes, reserveRes] = await Promise.all([
            fetch(`/rooms/${roomId}`),
            fetch(`/season`),
            fetch(`/price?room_id=${roomId}`),
            fetch(`/reservation?room_id=${roomId}`)
        ]);

        const room = await roomRes.json();
        currentSeasons = await seasonRes.json();
        currentRoomPrices = await priceRes.json();
        const reservations = await reserveRes.json();

        // 1. 방 정보 화면에 표시
        renderRoomInfo(room);

        // 2. 예약된 날짜(체크인~체크아웃)들을 찾아 배열에 텍스트로 저장 (예: "2026-05-01")
        bookedDates = extractBookedDates(reservations);

        // 3. 달력 렌더링 시작
        renderCalendar();
        setupCalendarEvents();

    } catch (error) {
        console.error("데이터를 불러오는데 실패했습니다.", error);
    }
}

// 🌟 달력을 화면에 그리는 함수
function renderCalendar() {
    const title = document.getElementById("calendar-title");
    const grid = document.getElementById("calendar-grid");
    
    grid.innerHTML = ""; // 기존 달력 지우기
    title.textContent = `${currentYear}년 ${String(currentMonth + 1).padStart(2, '0')}월`;

    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 이번달 1일의 요일
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // 이번달 총 일수
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate(); // 저번달 총 일수

    const today = new Date();
    today.setHours(0,0,0,0);

    // 1. 저번 달 날짜 채우기 (흐리게)
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

        // 일요일은 기본적으로 빨간색 (선택된 날짜 제외)
        if (cellDate.getDay() === 0) div.style.color = "#ff6b6b";

        // 과거 날짜는 비활성화
        if (cellDate < today) {
            div.classList.add("disabled");
            div.style.color = "#ddd";
        } 
        // 예약된 날짜인지 확인
        else if (bookedDates.includes(dateStr)) {
            div.classList.add("reserved");
            const resSpan = document.createElement("div");
            resSpan.className = "reserved-text";
            resSpan.textContent = "예약완료";
            div.appendChild(resSpan);
        } 
        // 예약 가능한 날짜 클릭 이벤트
        else {
            div.addEventListener("click", () => {
                // 기존 선택 해제
                document.querySelectorAll(".date-cell.selected").forEach(el => el.classList.remove("selected"));
                div.classList.add("selected");
                
                selectedDateString = dateStr;
                calculatePrice(cellDate);
            });

            // 이전에 선택했던 날짜라면 다시 선택 표시 유지
            if (selectedDateString === dateStr) {
                div.classList.add("selected");
            }
        }

        grid.appendChild(div);
    }

    // 3. 다음 달 날짜 채우기 (흐리게)
    const totalCells = firstDay + daysInMonth;
    const nextMonthDays = 42 - totalCells; // 6줄(42칸) 맞추기
    for (let i = 1; i <= nextMonthDays; i++) {
        const div = document.createElement("div");
        div.className = "date-cell disabled";
        div.textContent = i;
        grid.appendChild(div);
    }
}

// 🌟 이전/다음 달 버튼 이벤트
function setupCalendarEvents() {
    document.getElementById("prev-month").addEventListener("click", () => {
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

// 예약 데이터에서 예약 불가능한 날짜들을 계산해서 배열로 반환
function extractBookedDates(reservations) {
    const dates = [];
    reservations.forEach(res => {
        let current = new Date(res.check_in_date);
        const end = new Date(res.check_out_date);
        
        // 체크인 날짜부터 체크아웃 전날까지만 막음 (체크아웃 날짜는 다른사람이 체크인 가능하므로)
        while (current < end) {
            dates.push(formatDateString(current));
            current.setDate(current.getDate() + 1);
        }
    });
    return dates;
}

// 날짜 포맷 (YYYY-MM-DD)
function formatDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

// 기존 방 정보 렌더링 (동일)
function renderRoomInfo(room) {
    document.getElementById("room-title").textContent = room.name_eng.toUpperCase();
    document.getElementById("room-desc-ko").textContent = room.desc;
    document.getElementById("room-desc-en").textContent = room.desc_eng;
    document.getElementById("capacity-note").textContent = `기준 인원 ${room.min}명 / 최대 ${room.capacity}명`;

    const mainImg = document.getElementById("main-img");
    mainImg.src = `https://placehold.co/800x400?text=${room.name_eng}`;

    const thumbList = document.getElementById("thumb-list");
    room.images.forEach(imgName => {
        const imgEl = document.createElement("img");
        imgEl.src = `https://placehold.co/100x100?text=Thumb`;
        imgEl.addEventListener("click", () => {
            mainImg.src = imgEl.src.replace("100x100", "800x400");
        });
        thumbList.appendChild(imgEl);
    });
}

// 가격 계산 
function calculatePrice(selectedDate) {
    const priceDisplay = document.getElementById("total-price");

    const peakSeason = currentSeasons.find(s => s.id === 2);
    const peakStart = new Date(peakSeason.start_date);
    const peakEnd = new Date(peakSeason.end_date);
    
    let currentSeasonId = 1; 
    if (selectedDate >= peakStart && selectedDate <= peakEnd) {
        currentSeasonId = 2; 
    }

    const dayOfWeek = selectedDate.getDay();
    const isWeekend = (dayOfWeek === 5 || dayOfWeek === 6);

    const currentPriceObj = currentRoomPrices.find(p => p.season_id === currentSeasonId);

    let finalPrice = 0;
    if (currentPriceObj) {
        finalPrice = isWeekend ? currentPriceObj.weekend_price : currentPriceObj.weekday_price;
    }

    priceDisplay.textContent = finalPrice.toLocaleString();
}