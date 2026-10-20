(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const body = document.body;
  const opening = $("#opening");
  const story = $("#story");
  const storyCopy = $("#storyCopy");
  const progress = $("#progress");
  const sceneSymbol = $("#sceneSymbol");
  const eyebrow = $("#eyebrow");
  const title = $("#title");
  const copy = $("#copy");
  const choices = $("#choices");
  const signature = $("#signature");
  const nextButton = $("#nextButton");
  const replayButton = $("#replayButton");
  const canvas = $("#fireworks");
  const ctx = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const params = new URLSearchParams(window.location.search);
  const cleanParam = (value, fallback) => (value || fallback).trim().slice(0, 40);
  const recipient = cleanParam(params.get("to"), "");
  const sender = cleanParam(params.get("from"), "Rio và bạn");
  if (recipient) $("#openingLead").textContent = `Một lời chúc nhỏ từ Rio và bạn, gửi riêng đến ${recipient}.`;

  const scenes = [
    {
      id: "hello", theme: "date", icon: "♡", eyebrow: "RIO CÓ ĐIỀU MUỐN NÓI",
      title: recipient ? `Này ${recipient} ơi!` : "Này bạn ơi!",
      text: "Rio mang đến một món quà nhỏ cùng thật nhiều lời thương dành cho bạn.", duration: 5200, burst: true
    },
    {
      id: "date", theme: "date", icon: "✦", eyebrow: "NGÀY PHỤ NỮ VIỆT NAM",
      title: "20 · 10", text: "Chúc mừng ngày của những người phụ nữ tuyệt vời. Hôm nay và mọi ngày, mong bạn luôn được trân trọng và yêu thương.", duration: 6100
    },
    {
      id: "kindness", theme: "kindness", icon: "☀", eyebrow: "RIO THẤY BẠN THẬT ĐẶC BIỆT",
      title: "Bạn rạng rỡ\ntheo cách riêng", text: "Không cần phải giống ai cả. Nụ cười, sự chân thành và những điều bạn làm mỗi ngày đã tạo nên nét đẹp rất riêng của bạn.", duration: 6800
    },
    {
      id: "everyday", theme: "everyday", icon: "☾", eyebrow: "MỘT LỜI NHẮN NHỎ",
      title: "Bạn cũng xứng đáng\nđược nâng niu", text: "Mong bạn luôn có thời gian nghỉ ngơi, được lắng nghe và thoải mái theo đuổi những điều khiến trái tim mình vui.", duration: 6500
    },
    {
      id: "little-joys", theme: "wish", icon: "✧", eyebrow: "NHỮNG NIỀM VUI BE BÉ",
      title: "Mong ngày nào cũng\ncó điều khiến bạn cười", text: "Một tách trà ngon, một tin nhắn dễ thương hay một buổi chiều thảnh thơi — những điều nhỏ xinh cũng có thể làm lòng mình ấm áp.", duration: 6300
    },
    {
      id: "wish", theme: "wish", icon: "♥", eyebrow: "RIO CHÚC BẠN BỐN ĐIỀU",
      title: "Khỏe mạnh · Bình yên\nTự do · Được yêu thương", text: "Chúc bạn có thật nhiều niềm vui, luôn tin vào mình và gặp thật nhiều điều tốt đẹp trên hành trình phía trước.", duration: 7400
    },
    {
      id: "question", theme: "question", icon: "?", eyebrow: "RIO HỎI THẬT KHẼ",
      title: "Hôm nay bạn đã\ntự khen mình chưa?", text: "Dù câu trả lời là gì, bạn vẫn đã cố gắng rất nhiều rồi.", wait: true
    },
    {
      id: "final", theme: "final", icon: "♡", eyebrow: "GỬI BẰNG CẢ TẤM LÒNG",
      title: "Chúc bạn một ngày\nthật đáng yêu", text: "Rio và bạn gửi đến bạn một cái ôm thật ấm cùng thật nhiều điều tốt đẹp.", final: true, burst: true
    }
  ];

  let current = -1;
  let timer = 0;
  let width = 0;
  let height = 0;
  let particles = [];
  let lastTap = 0;

  function buildProgress() {
    progress.replaceChildren();
    scenes.forEach(() => {
      const segment = document.createElement("span");
      segment.className = "progress-segment";
      segment.append(document.createElement("i"));
      progress.append(segment);
    });
  }

  function updateProgress(index, scene) {
    [...progress.children].forEach((segment, i) => {
      segment.classList.toggle("is-done", i < index);
      segment.classList.toggle("is-current", i === index && !scene.wait && !scene.final);
      segment.style.setProperty("--duration", `${scene.duration || 6500}ms`);
    });
  }

  function showScene(index) {
    if (index < 0 || index >= scenes.length) return;
    window.clearTimeout(timer);
    current = index;
    const scene = scenes[index];
    body.dataset.scene = scene.theme;
    body.classList.add("is-playing");
    opening.classList.add("is-leaving");
    story.hidden = false;
    requestAnimationFrame(() => story.classList.add("is-active"));
    sceneSymbol.textContent = scene.icon;
    eyebrow.textContent = scene.eyebrow;
    title.textContent = scene.title;
    copy.textContent = scene.text;
    choices.hidden = !scene.wait;
    signature.hidden = !scene.final;
    nextButton.hidden = !!scene.wait || !!scene.final;
    replayButton.hidden = !scene.final;
    $("#tapHint").hidden = !!scene.wait || !!scene.final;
    if (scene.final) {
      const who = recipient ? `Gửi ${recipient}` : "Gửi bạn";
      signature.textContent = `${who} · từ ${sender}`;
      fireworksBurst(width * 0.5, height * 0.31, reducedMotion ? 0.65 : 1.15);
      window.setTimeout(() => fireworksBurst(width * 0.28, height * 0.36, 0.65), 300);
      window.setTimeout(() => fireworksBurst(width * 0.72, height * 0.34, 0.65), 620);
    } else if (scene.burst) {
      fireworksBurst(width * 0.5, height * 0.3, reducedMotion ? 0.55 : 1);
      window.setTimeout(() => fireworksBurst(width * 0.29, height * 0.34, 0.55), 280);
      window.setTimeout(() => fireworksBurst(width * 0.71, height * 0.33, 0.55), 540);
    }
    storyCopy.classList.remove("is-entering");
    void storyCopy.offsetWidth;
    storyCopy.classList.add("is-entering");
    updateProgress(index, scene);
    if (!scene.wait && !scene.final) timer = window.setTimeout(() => showScene(index + 1), scene.duration);
  }

  function nextScene() {
    const now = Date.now();
    if (now - lastTap < 350 || current < 0) return;
    lastTap = now;
    if (current < scenes.length - 1) showScene(current + 1);
  }

  function answerQuestion(answer) {
    if (current !== scenes.findIndex(scene => scene.wait)) return;
    window.clearTimeout(timer);
    choices.hidden = true;
    eyebrow.textContent = answer === "yes" ? "RIO MỪNG LẮM" : "RIO MUỐN NHẮN BẠN";
    title.textContent = answer === "yes" ? "Giỏi quá, nhớ nhé!" : "Vậy Rio khen bạn nha";
    copy.textContent = answer === "yes"
      ? "Hãy cứ dịu dàng với chính mình như cách bạn vẫn dịu dàng với mọi người."
      : "Bạn tuyệt vời hơn bạn nghĩ và xứng đáng được nghỉ ngơi, được vui vẻ, được yêu thương nữa đó.";
    nextButton.hidden = true;
    $("#tapHint").hidden = true;
    fireworksBurst(width * 0.5, height * 0.38, 0.6);
    timer = window.setTimeout(() => showScene(scenes.length - 1), 3200);
  }

  function startExperience() {
    if (body.classList.contains("is-playing")) return;
    opening.classList.add("is-leaving");
    body.classList.add("is-playing");
    showScene(0);
  }

  function replay() {
    window.clearTimeout(timer);
    body.dataset.scene = "opening";
    body.classList.remove("is-playing");
    story.classList.remove("is-active");
    opening.classList.remove("is-leaving");
    story.hidden = true;
    choices.hidden = true;
    current = -1;
    [...progress.children].forEach(segment => segment.classList.remove("is-done", "is-current"));
  }


  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const colors = ["#ff9fc9", "#ffd98a", "#c1adff", "#9be8ef", "#fff5df"];
  function fireworksBurst(x, y, power = 1) {
    if (!ctx) return;
    const count = Math.round((reducedMotion ? 30 : 78) * power);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1.1 + Math.random() * 4.1) * power;
      const life = 46 + Math.random() * 38;
      particles.push({
        x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        gravity: 0.027 + Math.random() * 0.035, life, maxLife: life,
        radius: 1 + Math.random() * 2.1, color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function drawFireworks() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    particles = particles.filter(particle => particle.life > 0);
    particles.forEach(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.987;
      particle.vy = particle.vy * 0.987 + particle.gravity;
      particle.life -= 1;
      ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    window.requestAnimationFrame(drawFireworks);
  }

  $("#startButton").addEventListener("click", startExperience);
  nextButton.addEventListener("click", nextScene);
  replayButton.addEventListener("click", replay);
  choices.addEventListener("click", event => {
    const button = event.target.closest("[data-answer]");
    if (button) answerQuestion(button.dataset.answer);
  });
  opening.addEventListener("click", event => {
    if (!event.target.closest("button")) startExperience();
  });
  story.addEventListener("click", event => {
    if (!event.target.closest("button") && current >= 0 && !scenes[current].wait && !scenes[current].final) nextScene();
  });
  document.addEventListener("keydown", event => {
    if (event.target.closest("button")) return;
    if (event.key === " " || event.key === "ArrowRight" || event.key === "Enter") {
      event.preventDefault();
      if (current < 0) startExperience();
      else nextScene();
    }
  });
  window.addEventListener("resize", resizeCanvas, { passive: true });

  buildProgress();
  resizeCanvas();
  drawFireworks();
})();
