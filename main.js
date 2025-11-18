// ─────────────────────────────────────────────────────────────────────────────
// 全局变量
// ─────────────────────────────────────────────────────────────────────────────
let rafId = null; // 动画请求ID
let FPS = 60; // 帧率
let FRAME_TIME = 1000 / FPS; // 每帧时间
let lastTime = 0; // 上一帧时间
let accumulator = 0; // 累加时间
let indexList = []; // 索引列表
let flashMode = 'static'; // 滚动方式
const total = 542; // 总数量
let scale = window.innerWidth / 375; // 以375为基准
const musicBgm = new Howl({
  src: ['./assets/audios/bg.mp3'],
  loop: true,
});
const musicBattle = new Howl({
  src: ['./assets/audios/battle.mp3'],
  loop: true,
});
const musicGet = new Howl({ src: ['./assets/audios/get.mp3'] });
const musicClick = new Howl({ src: ['./assets/audios/click.mp3'] });
const imgs = [
  "./assets/imgs/btn-start.png",
  "./assets/imgs/btn-stop.png",
  "./assets/imgs/collection_min.png",
  "./assets/imgs/bg_min.jpeg"
];

// ─────────────────────────────────────────────────────────────────────────────
// HTML元素
// ─────────────────────────────────────────────────────────────────────────────
const loading = document.querySelector(".loading");
const content = document.querySelector(".content");
const footer = document.querySelector(".footer");
const app = document.querySelector("#app");
// 图像
const mainImg = document.querySelector("#main-img");
const imgWrapper = document.querySelector("#img-wrapper");
// 主按钮
const startBtn = document.querySelector("#btn-start");
const startBtnText = document.querySelector("#btn-start .btn-text");
// 设置
const settingPanel = document.querySelector("#setting-panel");
const settingBtn = document.querySelector("#setting");
const settingBtnClose = document.querySelector("#setting-close");
const settingBrightness = document.querySelector("#setting-brightness");
const settingBrightnessValue = document.querySelector("#setting-brightness-value");
const settingBlur = document.querySelector("#setting-blur");
const settingBlurValue = document.querySelector("#setting-blur-value");
const settingGray = document.querySelector("#setting-gray");
const settingGrayValue = document.querySelector("#setting-gray-value");

// ─────────────────────────────────────────────────────────────────────────────
// 预加载图片
// ─────────────────────────────────────────────────────────────────────────────
let imgLoaded = 0;
let loadingTimeout;
const preload = () => {
  for (let i = 0; i < imgs.length; i += 1) {
    const img = new Image();
    img.src = imgs[i];
    img.onload = () => {
      if (++imgLoaded === imgs.length) {
        boot();
      }
    }
  }
  loadingTimeout = setTimeout(() => {
    loading.style.opacity = "1";
  }, 1000)
}
window.addEventListener('load', () => {
  preload();
});

// ─────────────────────────────────────────────────────────────────────────────
// 启动
// ─────────────────────────────────────────────────────────────────────────────
const boot = () => {
  clearTimeout(loadingTimeout);
  loading.style.opacity = "0";
  content.style.display = "flex";
  footer.style.display = "block";
  enableStart = true;
  imgWrapper.style.zoom = `${scale}`;
  window.addEventListener('resize', () => {
    scale = window.innerWidth / 375; // 以375为基准
    imgWrapper.style.zoom = `${scale}`;
  })
}

// 切换主图像（每帧）
const stepFrame = () => {
  const index = indexList.shift();
  const row = Math.floor(index / 24);
  const col = index % 24;
  mainImg.style.backgroundPosition = `-${col * 256}px -${row * 256}px`;
  if (indexList.length === 0) {
    getRandomIndex();
  }
};
// 生成随机序列
const getRandomIndex = () => {
  for (let i = 0; i < total; i += 1) {
    indexList.push(i);
  }
  indexList.sort(() => Math.random() - 0.5);
}
// 动画循环
const loop = (time) => {
  if (lastTime === 0) {
    lastTime = time;
  }
  const dt = time - lastTime;
  lastTime = time;
  accumulator += dt;
  while (accumulator >= FRAME_TIME) {
    stepFrame();
    accumulator -= FRAME_TIME;
  }
  rafId = requestAnimationFrame(loop);
};

// ─────────────────────────────────────────────────────────────────────────────
// 通用方法
// ─────────────────────────────────────────────────────────────────────────────
// 初始化滑块
const initSlider = (id, onValueChange, valueFormatter) => {
  const sliderTrack = document.querySelector(`#${id} .weui-slider__track`);
  const sliderHandler = document.querySelector(`#${id} .weui-slider__handler`);
  const sliderValue = document.querySelector(`#${id} .weui-slider-box__value`);
  const sliderInner = document.querySelector(`#${id} .weui-slider__inner`);

  let totalLen = sliderInner.getBoundingClientRect().width,
    startLeft = 100,
    startX = 0;

  // 点击
  sliderInner.addEventListener('click', function(e){
    let dist = e.clientX - this.getBoundingClientRect().left,
        percent;
    dist = dist < 0 ? 0 : dist > totalLen ? totalLen : dist;
    percent =  parseInt(dist / totalLen * 100);
    onValueChange(percent);
    sliderTrack.style.width = percent + '%';
    sliderHandler.style.left = percent + '%';
    sliderValue.textContent = typeof valueFormatter === 'function' ? valueFormatter(percent) : percent;
    musicClick.play();
  })

  // 滑动
  sliderHandler.addEventListener('touchstart', function (e) {
    startLeft = parseInt(sliderHandler.style.left) * totalLen / 100;
    startX = e.changedTouches[0].clientX;
  })
  sliderHandler.addEventListener('touchmove', function(e){
    let dist = startLeft + e.changedTouches[0].clientX - startX,
        percent;
    dist = dist < 0 ? 0 : dist > totalLen ? totalLen : dist;
    percent =  parseInt(dist / totalLen * 100);
    onValueChange(percent);
    sliderTrack.style.width = percent + '%';
    sliderHandler.style.left = percent + '%';
    sliderValue.textContent = typeof valueFormatter === 'function' ? valueFormatter(percent) : percent;
    e.preventDefault();
  })
}

// 初始化radio group
const initRadioGroup = (id, onValueChange) => {
  const radioGroup = document.querySelector(`#${id}`);
  const radios = radioGroup.querySelectorAll(`input[type="radio"]`);
  radios.forEach((radio) => {
    radio.addEventListener('change', (e) => {
      onValueChange(e.target.value);
    })
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// 交互
// ─────────────────────────────────────────────────────────────────────────────
// APP
let musicBgmPlayed = false;
app.addEventListener("click", (e) => {
  closeSetting(e);
  e.stopPropagation();
});
app.addEventListener("touchmove", (e) => e.preventDefault());
app.addEventListener("touchstart", (e) => {
  loopBgm();
  e.stopPropagation()
});
const loopBgm = () => {
  if (!musicBgmPlayed && !musicBgm.playing()) {
    musicBgm.play();
    musicBgmPlayed = true;
  }
}

// 主按钮
let enableStart = false
startBtn.addEventListener("click", () => {
  if (!enableStart) return
  rafId ? endLoop() : startLoop();
});
startBtn.addEventListener(`touchstart`, (e) => {
  e.stopPropagation();
  startBtn.classList.add(`active`);
});
startBtn.addEventListener(`touchend`, (e) => {
  e.stopPropagation();
  startBtn.classList.remove(`active`);
});
const startLoop = () => {
  lastTime = 0;
  accumulator = 0;
  getRandomIndex();
  startBtn.classList.toggle("stop", true);
  rafId = requestAnimationFrame(loop);
  musicBattle.play();
  musicGet.stop();
  musicBgm.fade(1, 0, 0.2);
  imgWrapper.classList.toggle("result", false);
}
const endLoop = () => {
  cancelAnimationFrame(rafId);
  rafId = null;
  lastTime = 0;
  accumulator = 0;
  startBtn.classList.toggle("stop", false);
  startBtn.classList.toggle(`disabled`, true);
  musicBattle.stop();
  musicGet.play();
  imgWrapper.classList.toggle("result", true);
  musicGet.once('end', () => {
    enableStart = true;
    startBtn.classList.toggle(`disabled`, false);
  })
}
musicGet.on('play', () => {
  setTimeout(() => {
    musicBgm.fade(0, 1, 1);
    if (!musicBgm.playing()) loopBgm();
  }, 3500)
})

// 设置
let settingAniTimeout = null;
let settingSliderInited = false;
let settingShow = false;
const openSetting = (e) => {
  if (settingShow) return
  settingShow = true
  musicClick.play();
  settingPanel.style.display = "block";
  clearTimeout(settingAniTimeout);
  if (!settingSliderInited) {
    initSettingSliders();
    settingSliderInited = true;
  }
  settingAniTimeout = setTimeout(() => {
    settingPanel.classList.toggle("animate__slideInUp", false);
  }, 600);
  e.stopPropagation()
}
const closeSetting = (e) => {
  if (!settingShow) return
  settingShow = false
  musicClick.play();
  settingPanel.classList.toggle("animate__slideOutDown", true);
  clearTimeout(settingAniTimeout);
  settingAniTimeout = setTimeout(() => {
    settingPanel.classList.toggle("animate__slideOutDown", false);
    settingPanel.classList.toggle("animate__slideInUp", true);
    settingPanel.style.display = "none";
  }, 600);
  e.stopPropagation()
}
settingPanel.addEventListener("click", (e) => e.stopPropagation());
settingBtn.addEventListener("click", openSetting);
settingBtnClose.addEventListener("click", closeSetting);
// 滑块
const initSettingSliders = () => {
  // 亮度强度
  initSlider("setting-brightness-value", (percent) => {
    imgWrapper.style.setProperty("--brightness-value", `${(100 - percent) / 100}`);
    imgWrapper.classList.toggle("result", false);
  });
  // 灰度强度
  initSlider("setting-gray-value", (percent) => {
    imgWrapper.style.setProperty("--grayscale-value", `${percent / 100}`);
    imgWrapper.classList.toggle("result", false);
  });
  // 模糊强度
  initSlider("setting-blur-value", (percent) => {
    imgWrapper.style.setProperty("--blur-value", `${percent / 100 * 5 / 100}rem`);
    imgWrapper.classList.toggle("result", false);
  });
  // 帧率
  initSlider("setting-frame-value", (percent) => {
    FPS = 10 + Math.floor(50 * percent / 100);
    FRAME_TIME = 1000 / FPS;
  }, () => `${FPS} FPS`);
}
// 调节亮度
settingBrightness.addEventListener("change", (e) => {
  musicClick.play();
  const brightness = e.target.checked;
  imgWrapper.classList.toggle("mask", brightness);
  imgWrapper.classList.toggle("result", false);
  settingBrightnessValue.classList.toggle("disabled", !brightness);
});
// 开启灰度
settingGray.addEventListener("change", (e) => {
  musicClick.play();
  const gray = e.target.checked;
  imgWrapper.classList.toggle("grayscale", gray);
  imgWrapper.classList.toggle("result", false);
  settingGrayValue.classList.toggle("disabled", !gray);
});
// 开启模糊
settingBlur.addEventListener("change", (e) => {
  musicClick.play();
  const blur = e.target.checked;
  imgWrapper.classList.toggle("blur", blur);
  imgWrapper.classList.toggle("result", false);
  settingBlurValue.classList.toggle("disabled", !blur);
});
// 滚动方式
initRadioGroup("setting-flash-mode", (value) => {
  flashMode = value;
  console.log(value);
});