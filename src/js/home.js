const swiper = new Swiper('.mySwiper', {
    loop: true, // 무한 반복
    
    // 🌟 추가된 부분: 이미지가 옆으로 밀리는 애니메이션 진행 속도 (800 = 0.8초)
    // 숫자를 늘리면 더 천천히 스윽 밀리고, 줄이면 휙휙 빠르게 넘어갑니다.
    speed: 800, 
    
    autoplay: {
        delay: 3500, // 3.5초마다 자동으로 다음 슬라이드 실행
        disableOnInteraction: false, 
    },
    pagination: {
        el: '.swiper-pagination',
        clickable: true, 
    },
});

document.addEventListener("DOMContentLoaded", () => {
    const slider = document.getElementById("rooms-slider");
    if (!slider) return;

    let isDown = false; // 마우스를 누르고 있는지 상태 확인
    let startX;         // 클릭한 처음 X 좌표
    let scrollLeft;     // 원래 스크롤 위치

    // 🖱️ 1. 마우스를 클릭했을 때
    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    // 🖱️ 2. 마우스가 슬라이드 밖으로 나갔을 때
    slider.addEventListener('mouseleave', () => {
        isDown = false;
    });

    // 🖱️ 3. 마우스 클릭을 뗐을 때
    slider.addEventListener('mouseup', () => {
        isDown = false;
    });

    // 🖱️ 4. 마우스를 드래그하며 움직일 때
    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return; // 누르고 있지 않으면 실행 안 함
        e.preventDefault(); // 기본 드래그 방지
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5; // 숫자(1.5)를 키우면 드래그 속도가 빨라집니다
        slider.scrollLeft = scrollLeft - walk;
    });

    // 📱 모바일 터치(스와이프) 지원
    slider.addEventListener('touchstart', (e) => {
        isDown = true;
        startX = e.touches[0].pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('touchend', () => {
        isDown = false;
    });

    slider.addEventListener('touchmove', (e) => {
        if (!isDown) return;
        const x = e.touches[0].pageX - slider.offsetLeft;
        const walk = (x - startX) * 1.5;
        slider.scrollLeft = scrollLeft - walk;
    });
});