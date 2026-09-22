// reservation5.js

const urlParams = new URLSearchParams(window.location.search);
const roomId = urlParams.get('roomId');
const checkin = urlParams.get('checkin');
const checkout = urlParams.get('checkout');
const extraGuests = urlParams.get('guests') || 0;
const price = urlParams.get('price');

let holidays = []; 

document.addEventListener("DOMContentLoaded", () => {
    
    Promise.all([
        fetch(`/rooms/${roomId}`),
        fetch(`/holiday`)
    ])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(([room, holidayData]) => {
        
        document.getElementById("disp-room").value = room.name_eng.toUpperCase();
        
        // 🌟 화면 입력창에도 딱 '추가 인원수'만 나오도록 수정
        document.getElementById("disp-guests").value = `${extraGuests}명`;
        
        holidays = holidayData;
        renderReadOnlyCalendar(checkin, checkout);
    })
    .catch(error => console.error("데이터 불러오기 실패:", error));

    document.getElementById("disp-price").textContent = Number(price).toLocaleString();
    document.getElementById("final-submit-btn").addEventListener("click", submitReservation);
});

async function submitReservation(event) {

    //if (event) event.preventDefault();

    const nameInput = document.getElementById("input-name");
    const phoneInput = document.getElementById("input-phone");
    const errName = document.getElementById("err-name");
    const errPhone = document.getElementById("err-phone");

    let isValid = true;

    if (nameInput.value.trim().length === 0) {
        errName.style.display = "block";
        nameInput.classList.add("input-error");
        isValid = false;
    } else {
        errName.style.display = "none";
        nameInput.classList.remove("input-error");
    }

    const phoneRegex = /^01([0|1|6|7|8|9])\d{3,4}\d{4}$/;

    if (!phoneRegex.test(phoneInput.value.trim())) {
        errPhone.style.display = "block";
        errPhone.textContent = "올바른 휴대폰 번호 형식이 아닙니다."; // 에러 메시지도 더 자연스럽게 변경
        phoneInput.classList.add("input-error");
        isValid = false;
    } else {
        errPhone.style.display = "none";
        phoneInput.classList.remove("input-error");
    }

    if (!isValid) return;

    const newReservation = {
        customer_name: nameInput.value.trim(),
        phone_number: phoneInput.value.trim(),
        room_id: parseInt(roomId),
        check_in_date: checkin,
        check_out_date: checkout,
        number_of_guests: parseInt(extraGuests), 
        total_price: parseInt(price)
    };

    try {
        const response = await fetch("/reservation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newReservation)
        });

        if (response.ok) {
            // alert 대신 예약 완료 팝업(모달) 띄우기
            const modal = document.getElementById("success-modal");
            modal.style.display = "flex"; 
            
            document.getElementById("modal-confirm-btn").addEventListener("click", () => {
                window.location.href = "home.html";
            });
        } else {
            alert("예약 처리 중 문제가 발생했습니다.");
        }
    } catch (error) {
        alert("서버와 통신할 수 없습니다.");
    }
}

// 🌟 우측 읽기 전용 달력 렌더링 함수 (변경 없음)
function renderReadOnlyCalendar(startStr, endStr) {
    const [sYear, sMonth, sDay] = startStr.split('-').map(Number);
    const [eYear, eMonth, eDay] = endStr.split('-').map(Number);
    
    const startDate = new Date(sYear, sMonth - 1, sDay);
    const endDate = new Date(eYear, eMonth - 1, eDay);
    
    const year = startDate.getFullYear();
    const month = startDate.getMonth();

    document.getElementById("calendar-title").textContent = `${year}년 ${String(month + 1).padStart(2, '0')}월`;
    const grid = document.getElementById("calendar-grid");
    
    grid.innerHTML = ""; 

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const div = document.createElement("div");
        grid.appendChild(div);
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const cellDate = new Date(year, month, i);
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        const div = document.createElement("div");
        div.className = "date-cell";
        
        const numTxt = document.createTextNode(i);
        div.appendChild(numTxt);

        const isHoliday = holidays.some(h => h.holiday_date === dateStr);
        if (cellDate.getDay() === 0 || isHoliday) {
            div.style.color = "#ff6b6b";
        }

        if (cellDate >= startDate && cellDate <= endDate) {
            div.classList.add("selected-range");
            div.style.color = "#fff"; 
            
            const label = document.createElement("span");
            if (cellDate.getTime() === startDate.getTime()) label.textContent = "입실";
            else if (cellDate.getTime() === endDate.getTime()) label.textContent = "퇴실";
            div.appendChild(label);
        }

        grid.appendChild(div);
    }
}