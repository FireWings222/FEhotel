class MyFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer class="footer">
                <h2 class="footer-logo">H</h2>
                <div class="social-links">
                    <a href="#" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                    <a href="#" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                    <a href="#" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
                </div>
                <div class="footer-info">
                    <p>경기 성남시 분당구 판교역로 000 H호텔</p>
                    <p>사업자등록번호 000-00-00000 | 전화 010-000-0000 | 팩스 02-000-0000</p>
                    <div class="footer-policy">
                        <a href="#">이용약관</a> | <a href="#">개인정보처리방침</a>
                    </div>
                    <!-- 연도를 2026년으로 업데이트했습니다 -->
                    <p class="copyright">Copyright © 2026 H Hotel. All rights reserved.</p>
                </div>
                <button class="btn-top" onclick="window.scrollTo(0,0)">↑</button>
            </footer>
        `;
    }
}

// 'my-footer'라는 새로운 HTML 태그로 등록합니다!
customElements.define('my-footer', MyFooter);