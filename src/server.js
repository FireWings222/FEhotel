const http = require('node:http');
const path = require('node:path');
const jsonServer = require('json-server');

const app = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'data', 'db.json'));
const middlewares = jsonServer.defaults({
    static: path.join(__dirname),
    noCors: true
});

const PORT = Number(process.env.PORT || 3000);
const LLM_URL = new URL(process.env.LLM_URL || 'http://192.168.23.18:4100/v1/chat/completions');
const LLM_MODEL = process.env.LLM_MODEL || 'Qwen/Qwen3-8B-AWQ';
const SYSTEM_PROMPT = [
    '당신은 H Hotel 홈페이지의 간단한 안내 챗봇입니다.',
    '항상 한국어로 친절하고 간단하게 답변하세요.',
    '호텔의 기본 정보, 체크인/체크아웃, 조식, 주차, 부대시설 같은 일반적인 문의에 답변하세요.',
    '확실하지 않은 정보는 추측하지 말고 "정확한 정보는 호텔에 문의해 주세요."라고 안내하세요.',
    '예약 가능 여부, 실시간 객실 가격, 결제 상태처럼 실시간 확인이 필요한 내용은 직접 확정하지 마세요.'
].join('\n');

app.disable('x-powered-by');
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    next();
});
app.use(middlewares);
app.use(jsonServer.bodyParser);

app.post('/api/chat', async (req, res) => {
    const messages = normalizeMessages(req.body?.messages);
    if (!messages.length || messages[messages.length - 1].role !== 'user') {
        return res.status(400).json({ error: '질문을 입력해 주세요.' });
    }

    try {
        const upstream = await requestLlm({
            model: LLM_MODEL,
            messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
            max_tokens: 256,
            temperature: 0.3,
            stream: false,
            chat_template_kwargs: { enable_thinking: false }
        });
        const answer = upstream?.choices?.[0]?.message?.content;
        if (typeof answer !== 'string' || !answer.trim()) throw new Error('LLM response did not include an answer.');
        return res.json({ message: stripThinking(answer) });
    } catch (error) {
        console.error('[chat proxy]', error.message);
        const status = error.code === 'ECONNREFUSED' ? 503 : 502;
        return res.status(status).json({
            error: status === 503
                ? 'AI 서버에 연결할 수 없습니다. 로컬 LLM 서버를 확인해 주세요.'
                : 'AI 답변을 받지 못했습니다. 잠시 후 다시 시도해 주세요.'
        });
    }
});

app.use(router);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`H Hotel: http://127.0.0.1:${PORT}/home.html`);
    console.log(`Chat proxy: ${LLM_URL.origin}${LLM_URL.pathname}`);
});

function normalizeMessages(value) {
    if (!Array.isArray(value)) return [];
    return value.slice(-10)
        .filter((item) => item && ['user', 'assistant'].includes(item.role))
        .map((item) => ({
            role: item.role,
            content: typeof item.content === 'string' ? item.content.trim().slice(0, 1000) : ''
        }))
        .filter((item) => item.content);
}

function stripThinking(value) {
    return value.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function requestLlm(payload) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify(payload);
        const request = http.request({
            protocol: LLM_URL.protocol,
            hostname: LLM_URL.hostname,
            port: LLM_URL.port,
            path: `${LLM_URL.pathname}${LLM_URL.search}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            },
            timeout: 60000
        }, (response) => {
            let raw = '';
            response.setEncoding('utf8');
            response.on('data', (chunk) => {
                raw += chunk;
                if (raw.length > 2_000_000) response.destroy(new Error('LLM response is too large.'));
            });
            response.on('end', () => {
                try {
                    const data = JSON.parse(raw);
                    if (!response.statusCode || response.statusCode >= 400) {
                        return reject(new Error(data?.error?.message || `LLM HTTP ${response.statusCode}`));
                    }
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            });
        });
        request.on('timeout', () => request.destroy(new Error('LLM request timed out.')));
        request.on('error', reject);
        request.end(body);
    });
}
