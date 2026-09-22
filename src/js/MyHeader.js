class MyHeader extends HTMLElement {
    connectedCallback() {
        // 백틱(``) 기호를 사용하면 여러 줄의 HTML 코드를 편하게 넣을 수 있습니다.
        this.innerHTML = `
            <header class="header">
                <div class="logo">
                    <a href="../html/index.html">H</a>
                </div>
                <nav class="nav">
                    <ul class="main-menu">
                        <li class="nav-item">
                            <a href="#">ABOUT</a>
                            <ul class="submenu">
                                <li><a href="home.html">호텔 소개</a></li>
                                <li><a href="#">오시는길</a></li>
                            </ul>
                        </li>
                        <li class="nav-item">
                            <a href="#">ROOMS</a>
                            <ul class="submenu">
                                <li><a href="#">ROOM 1</a></li>
                                <li><a href="#">ROOM 2</a></li>
                                <li><a href="#">ROOM 3</a></li>
                            </ul>
                        </li>
                        <li class="nav-item">
                            <a href="#">RESERVATION</a>
                            <ul class="submenu">
                                <li><a href="reservation1.html">예약안내</a></li>
                                <li><a href="reservation2.html">실시간예약</a></li>
                            </ul>
                        </li>
                        <li class="nav-item">
                            <a href="#">COMMUNITY</a>
                            <ul class="submenu">
                                <li><a href="#">공지사항</a></li>
                                <li><a href="#">이벤트</a></li>
                                <li><a href="#">FAQ</a></li>
                            </ul>
                        </li>
                    </ul>
                </nav>
            </header>
        `;
    }
}

// 'my-header'라는 새로운 HTML 태그로 등록합니다!
customElements.define('my-header', MyHeader);