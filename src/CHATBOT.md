# H Hotel 로컬 LLM 챗봇

브라우저는 같은 주소의 `POST /api/chat`만 호출하며, `server.js`가 로컬 vLLM API로 요청을 전달합니다. vLLM 주소와 system prompt는 브라우저에 노출되지 않습니다.

## 실행

1. Ubuntu 서버의 vLLM을 `http://192.168.23.18:4100/v1/chat/completions`에서 `Qwen/Qwen3-8B-AWQ` 모델로 실행합니다.
2. 이 폴더에서 처음 한 번 `npm install`을 실행합니다.
3. `npm start`를 실행합니다.
4. `http://127.0.0.1:3000/home.html`을 엽니다.

기본값을 바꾸려면 서버 실행 전에 `PORT`, `LLM_URL`, `LLM_MODEL` 환경 변수를 설정할 수 있습니다.

## API 요청 형식

```json
{
  "messages": [
    { "role": "user", "content": "체크인 시간은 몇 시인가요?" }
  ]
}
```

서버는 최대 10개의 `user`/`assistant` 메시지만 받고, 서버에 고정된 호텔 안내용 system prompt를 앞에 추가합니다.
