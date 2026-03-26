const SYSTEM_PROMPT = `Kamu adalah AI Career Advisor dari platform Startz — sebuah platform career planning yang dirancang khusus untuk mahasiswa dan fresh graduate Indonesia.

Tentang Startz:
- Startz adalah platform all-in-one untuk career planning yang membantu mahasiswa dan fresh graduate merencanakan, mempersiapkan, dan meluncurkan karier impian mereka
- Fitur utama: Career Roadmap personalisasi, Kelas dari praktisi industri, AI Career Advisor 24/7, Sertifikasi yang diakui perusahaan, Komunitas peer learning
- Pengguna dapat membuat kelas mereka sendiri sebagai instruktur/mentor
- Tersedia kelas di berbagai bidang: Tech, Business, Design, Marketing, Data Science, Career Skills
- Ada kelas gratis dan berbayar (mulai dari Rp 99K hingga Rp 499K)
- Sudah digunakan oleh 48.000+ pengguna aktif
- Memiliki 1.200+ kelas tersedia
- 320+ mentor berpengalaman
- 92% tingkat kepuasan pengguna
- Bermitra dengan ratusan perusahaan di Indonesia termasuk perusahaan tech, startup, BUMN, dan korporasi multinasional

Cara kerja Startz:
1. Buat profil (isi latar belakang, minat, tujuan karier)
2. Dapatkan Career Roadmap yang dipersonalisasi oleh AI
3. Ikuti kelas yang relevan dengan roadmap karier
4. Dapatkan sertifikasi dan launch karier

Untuk instruktur/creator kelas:
- Siapa saja bisa membuat kelas di Startz
- Revenue sharing yang kompetitif untuk instruktur
- Support dari tim Startz untuk kualitas konten
- Akses ke ribuan calon pelajar

Gaya komunikasi:
- Gunakan bahasa Indonesia yang friendly, hangat, dan supportive
- Sertakan emoji relevan secara natural
- Jawaban ringkas tapi informatif
- Selalu arahkan ke fitur atau aksi nyata di Startz jika relevan
- Berikan motivasi dan semangat kepada pengguna yang sedang merencanakan karier
- Jika ada pertanyaan yang tidak berkaitan dengan Startz atau karier, tetap jawab dengan helpful tapi arahkan kembali ke konteks Startz

Ingat: Kamu adalah wajah dari Startz. Jadilah helpful, encouraging, dan knowledgeable.`;

  let conversationHistory = [];
  let isLoading = false;

  function getTime() {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  function hideWelcome() {
    const w = document.getElementById('welcome');
    if (w) w.remove();
  }

  function appendMessage(role, text) {
    const msgs = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = `msg-row ${role}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${role === 'bot' ? 'avatar-bot' : 'avatar-user'}`;
    avatar.textContent = role === 'bot' ? '🤖' : '👤';

    const bubbleWrap = document.createElement('div');

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = formatText(text);

    const time = document.createElement('div');
    time.className = 'msg-time';
    time.textContent = getTime();

    bubbleWrap.appendChild(bubble);
    bubbleWrap.appendChild(time);
    row.appendChild(avatar);
    row.appendChild(bubbleWrap);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
    return bubble;
  }

  function formatText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function showTyping() {
    const msgs = document.getElementById('messages');
    const row = document.createElement('div');
    row.className = 'msg-row bot';
    row.id = 'typing-row';

    const avatar = document.createElement('div');
    avatar.className = 'msg-avatar avatar-bot';
    avatar.textContent = '🤖';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

    row.appendChild(avatar);
    row.appendChild(indicator);
    msgs.appendChild(row);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('typing-row');
    if (t) t.remove();
  }

  async function sendMessage() {
    if (isLoading) return;
    const input = document.getElementById('userInput');
    const text = input.value.trim();
    if (!text) return;

    hideWelcome();
    input.value = '';
    input.style.height = 'auto';
    isLoading = true;
    document.getElementById('sendBtn').disabled = true;

    appendMessage('user', text);
    conversationHistory.push({ role: 'user', content: text });

    showTyping();

    try {
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',   // ~2GB VRAM — cocok untuk RTX 3070 8GB
          stream: false,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...conversationHistory
          ]
        })
      });

      const data = await response.json();
      removeTyping();

      if (data.message?.content) {
        const reply = data.message.content;
        conversationHistory.push({ role: 'assistant', content: reply });
        appendMessage('bot', reply);
      } else {
        throw new Error('No response content');
      }
    } catch (err) {
      removeTyping();
      const msgs = document.getElementById('messages');
      const errDiv = document.createElement('div');
      errDiv.className = 'error-msg';
      errDiv.textContent = '⚠️ Ollama tidak terdeteksi. Jalankan: OLLAMA_ORIGINS="*" ollama serve';
      msgs.appendChild(errDiv);
      msgs.scrollTop = msgs.scrollHeight;
      conversationHistory.pop();
    }

    isLoading = false;
    document.getElementById('sendBtn').disabled = false;
    input.focus();
  }

  function sendQuick(text) {
    document.getElementById('userInput').value = text;
    sendMessage();
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }