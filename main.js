(function () {
  // 浅拷贝对象属性
  function assign(target, source) {
    if (!source) return target;
    var key;
    for (key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
    return target;
  }

  // 合并默认配置与用户配置
  function mergeOptions(defaults, options) {
    var merged = {};
    assign(merged, defaults);
    assign(merged, options);
    if (defaults && defaults.selectors) {
      merged.selectors = {};
      assign(merged.selectors, defaults.selectors);
      if (options && options.selectors) assign(merged.selectors, options.selectors);
    }
    if (defaults && defaults.audio) {
      merged.audio = {};
      assign(merged.audio, defaults.audio);
      if (options && options.audio) assign(merged.audio, options.audio);
    }
    return merged;
  }

  // PokemonFlash 构造函数
  function PokemonFlash(options) {
    this.options = mergeOptions(PokemonFlash.defaults, options); // 合并后的配置

    this.rafId = null; // requestAnimationFrame ID
    this.lastTime = 0; // 上一帧时间戳
    this.accumulator = 0; // 时间累加器
    this.indexList = []; // 精灵索引序列
    this.flashMode = 'static'; // 滚动方式
    this.scale = window.innerWidth / this.options.baseWidth; // 缩放比例

    this.imgLoaded = 0; // 已加载图片数
    this.loadingTimeout = null; // 加载超时定时器

    this.musicBgmPlayed = false; // BGM 是否已播放
    this.enableStart = false; // 是否允许开始

    this.settingAniTimeout = null; // 设置面板动画定时器
    this.settingSliderInited = false; // 滑块是否已初始化
    this.settingShow = false; // 设置面板是否显示

    this.FPS = this.options.fps; // 帧率
    this.FRAME_TIME = 1000 / this.FPS; // 每帧时间（毫秒）

    this.musicBgm = new Howl({
      src: [this.options.audio.bgm],
      loop: true,
    });
    this.musicBattle = new Howl({
      src: [this.options.audio.battle],
      loop: true,
    });
    this.musicGet = new Howl({ src: [this.options.audio.get] });
    this.musicClick = new Howl({ src: [this.options.audio.click] });

    this.els = {}; // 缓存的 DOM 元素

    this.isEnd = true; // 是否结束游戏
  }

  // 默认配置
  PokemonFlash.defaults = {
    fps: 60, // 帧率
    total: 542, // 精灵总数
    cols: 24, // 精灵图每行数量
    frameSize: 256, // 每个精灵的尺寸（像素）
    baseWidth: 375, // 基准宽度（用于缩放）
    loadingDelay: 1000, // 加载延迟（毫秒）
    bgmFadeOutDuration: 0.2, // BGM 淡出时长（秒）
    bgmFadeInDelay: 3500, // BGM 淡入延迟（毫秒）
    bgmFadeInDuration: 1, // BGM 淡入时长（秒）
    settingPanelAniDuration: 600, // 设置面板动画时长（毫秒）
    imgs: [ // 需要预加载的图片
      './assets/imgs/btn-start.png',
      './assets/imgs/btn-stop.png',
      './assets/imgs/collection_min.png',
      './assets/imgs/bg_min.jpeg',
    ],
    audio: { // 音频文件路径
      bgm: './assets/audios/bg.mp3',
      battle: './assets/audios/battle.mp3',
      get: './assets/audios/get.mp3',
      click: './assets/audios/click.mp3',
    },
    selectors: { // DOM 选择器
      loading: '.loading',
      content: '.content',
      footer: '.footer',
      app: '#app',
      mainImg: '#main-img',
      horizontalImgWrapper: '#img-wrapper-horizontal',
      verticalImgWrapper: '#img-wrapper-vertical',
      imgWrapper: '#img-wrapper',
      startBtn: '#btn-start',
      startBtnText: '#btn-start .btn-text',
      settingPanel: '#setting-panel',
      settingBtn: '#setting',
      settingBtnClose: '#setting-close',
      settingBrightness: '#setting-brightness',
      settingBrightnessValue: '#setting-brightness-value',
      settingBlur: '#setting-blur',
      settingBlurValue: '#setting-blur-value',
      settingGray: '#setting-gray',
      settingGrayValue: '#setting-gray-value',
    },
  };

  // 初始化入口
  PokemonFlash.prototype.init = function () {
    var self = this;
    window.addEventListener('load', function () {
      self.cacheElements(); // 缓存 DOM 元素
      self.bindEvents(); // 绑定事件
      self.preload(); // 预加载图片
    });
  };

  // 缓存 DOM 元素
  PokemonFlash.prototype.cacheElements = function () {
    var s = this.options.selectors; // 选择器配置
    this.els.loading = document.querySelector(s.loading); // 加载提示
    this.els.content = document.querySelector(s.content); // 主内容区
    this.els.footer = document.querySelector(s.footer); // 页脚
    this.els.app = document.querySelector(s.app); // 应用容器
    this.els.mainImg = document.querySelector(s.mainImg); // 主精灵图
    this.els.horizontalImgWrapper = document.querySelector(s.horizontalImgWrapper); // 水平精灵图包装器
    this.els.horizontalImgs = this.els.horizontalImgWrapper.querySelectorAll('.img'); // 水平精灵图
    this.els.verticalImgWrapper = document.querySelector(s.verticalImgWrapper); // 垂直精灵图包装器
    this.els.verticalImgs = this.els.verticalImgWrapper.querySelectorAll('.img'); // 垂直精灵图
    this.els.imgWrapper = document.querySelector(s.imgWrapper); // 图片包装器
    this.els.startBtn = document.querySelector(s.startBtn); // 开始按钮
    this.els.startBtnText = document.querySelector(s.startBtnText); // 开始按钮文字
    this.els.settingPanel = document.querySelector(s.settingPanel); // 设置面板
    this.els.settingBtn = document.querySelector(s.settingBtn); // 设置按钮
    this.els.settingBtnClose = document.querySelector(s.settingBtnClose); // 设置关闭按钮
    this.els.settingBrightness = document.querySelector(s.settingBrightness); // 亮度开关
    this.els.settingBrightnessValue = document.querySelector(s.settingBrightnessValue); // 亮度滑块
    this.els.settingBlur = document.querySelector(s.settingBlur); // 模糊开关
    this.els.settingBlurValue = document.querySelector(s.settingBlurValue); // 模糊滑块
    this.els.settingGray = document.querySelector(s.settingGray); // 灰度开关
    this.els.settingGrayValue = document.querySelector(s.settingGrayValue); // 灰度滑块
  };

  // 绑定事件监听器
  PokemonFlash.prototype.bindEvents = function () {
    var self = this; // 保存 this 引用

    // 应用容器点击：关闭设置面板
    this.els.app.addEventListener('click', function (e) {
      self.closeSetting(e);
      e.stopPropagation();
    });

    // 应用容器触摸移动：阻止默认滚动
    this.els.app.addEventListener('touchmove', function (e) {
      e.preventDefault();
    });

    // 应用容器触摸开始：循环 BGM
    this.els.app.addEventListener('touchstart', function (e) {
      self.loopBgm();
      e.stopPropagation();
    });

    // 开始按钮点击：开始/停止循环
    this.els.startBtn.addEventListener('click', function () {
      if (!self.enableStart) return; // 不允许开始则返回
      if (self.rafId) {
        self.enableStart = false; // 禁用开始按钮
        self.endLoop(); // 正在运行则停止
      } else {
        self.startLoop(); // 否则开始
      }
    });

    // 开始按钮触摸开始：添加激活样式
    this.els.startBtn.addEventListener('touchstart', function (e) {
      e.stopPropagation();
      self.els.startBtn.classList.add('active');
    });

    // 开始按钮触摸结束：移除激活样式
    this.els.startBtn.addEventListener('touchend', function (e) {
      e.stopPropagation();
      self.els.startBtn.classList.remove('active');
    });

    // 设置面板点击：阻止事件冒泡
    this.els.settingPanel.addEventListener('click', function (e) {
      e.stopPropagation();
    });

    // 设置按钮点击：打开设置面板
    this.els.settingBtn.addEventListener('click', function (e) {
      self.openSetting(e);
    });

    // 设置关闭按钮点击：关闭设置面板
    this.els.settingBtnClose.addEventListener('click', function (e) {
      self.closeSetting(e);
    });

    // 亮度开关变化：切换亮度滤镜
    this.els.settingBrightness.addEventListener('change', function (e) {
      self.musicClick.play();
      var brightness = e.target.checked; // 开关状态
      self.els.imgWrapper.classList.toggle('mask', brightness);
      self.els.horizontalImgWrapper.classList.toggle('mask', brightness);
      self.els.verticalImgWrapper.classList.toggle('mask', brightness);
      self.els.imgWrapper.classList.toggle('result', false);
      self.els.horizontalImgWrapper.classList.toggle('result', false);
      self.els.verticalImgWrapper.classList.toggle('result', false);
      self.els.settingBrightnessValue.classList.toggle('disabled', !brightness);
    });

    // 灰度开关变化：切换灰度滤镜
    this.els.settingGray.addEventListener('change', function (e) {
      self.musicClick.play();
      var gray = e.target.checked; // 开关状态
      self.els.imgWrapper.classList.toggle('grayscale', gray);
      self.els.horizontalImgWrapper.classList.toggle('grayscale', gray);
      self.els.verticalImgWrapper.classList.toggle('grayscale', gray);
      self.els.imgWrapper.classList.toggle('result', false);
      self.els.horizontalImgWrapper.classList.toggle('result', false);
      self.els.verticalImgWrapper.classList.toggle('result', false);
      self.els.settingGrayValue.classList.toggle('disabled', !gray);
    });

    // 模糊开关变化：切换模糊滤镜
    this.els.settingBlur.addEventListener('change', function (e) {
      self.musicClick.play();
      var blur = e.target.checked; // 开关状态
      self.els.imgWrapper.classList.toggle('blur', blur);
      self.els.horizontalImgWrapper.classList.toggle('blur', blur);
      self.els.verticalImgWrapper.classList.toggle('blur', blur);
      self.els.imgWrapper.classList.toggle('result', false);
      self.els.horizontalImgWrapper.classList.toggle('result', false);
      self.els.verticalImgWrapper.classList.toggle('result', false);
      self.els.settingBlurValue.classList.toggle('disabled', !blur);
    });

    // 滚动方式单选组：更新滚动方式
    this.initRadioGroup('setting-flash-mode', function (value) {
      self.musicClick.play();
      self.flashMode = value; // 更新滚动方式
      if (self.flashMode === 'static') {
        self.els.horizontalImgWrapper.style.zoom = 'none';
        self.els.verticalImgWrapper.style.zoom = 'none';
        self.els.imgWrapper.style.display = 'block';
        self.els.horizontalImgWrapper.style.display = 'none';
        self.els.verticalImgWrapper.style.display = 'none';
      } else if (self.flashMode === 'horizontal') {
        self.els.imgWrapper.style.zoom = 'none';
        self.els.verticalImgWrapper.style.zoom = 'none';
        self.els.imgWrapper.style.display = 'none';
        self.els.horizontalImgWrapper.style.display = 'block';
        self.els.verticalImgWrapper.style.display = 'none';
      } else if (self.flashMode === 'vertical') {
        self.els.imgWrapper.style.zoom = 'none';
        self.els.horizontalImgWrapper.style.zoom = 'none';
        self.els.imgWrapper.style.display = 'none';
        self.els.horizontalImgWrapper.style.display = 'none';
        self.els.verticalImgWrapper.style.display = 'block';
      }
      self.flashModeBoot();
    });

    // 获取精灵音效播放时：延迟淡入 BGM
    this.musicGet.on('play', function () {
      setTimeout(function () {
        self.musicBgm.fade(0, 1, self.options.bgmFadeInDuration);
        if (!self.musicBgm.playing()) self.loopBgm();
      }, self.options.bgmFadeInDelay);
    });
  };

  // 预加载图片
  PokemonFlash.prototype.preload = function () {
    var self = this;
    var imgs = this.options.imgs; // 图片路径数组

    this.imgLoaded = 0; // 重置已加载计数
    for (var i = 0; i < imgs.length; i += 1) {
      (function (src) {
        var img = new Image(); // 创建图片对象
        img.src = src; // 设置图片源
        img.onload = function () {
          self.imgLoaded += 1; // 加载完成计数
          if (self.imgLoaded === imgs.length) {
            self.boot(); // 全部加载完成后启动
          }
        };
      })(imgs[i]);
    }

    // 设置加载超时：显示加载提示
    this.loadingTimeout = setTimeout(function () {
      self.els.loading.style.opacity = '1';
    }, this.options.loadingDelay);
  };

  // 启动应用（预加载完成后调用）
  PokemonFlash.prototype.boot = function () {
    var self = this;
    clearTimeout(this.loadingTimeout); // 清除加载超时
    this.els.loading.style.opacity = '0'; // 隐藏加载提示
    this.els.content.style.display = 'flex'; // 显示主内容
    this.els.footer.style.display = 'block'; // 显示页脚
    this.enableStart = true; // 允许开始

    this.flashModeBoot();

    // 窗口大小变化时更新缩放
    window.addEventListener('resize', function () {
      self.scale = window.innerWidth / self.options.baseWidth;
      if (self.flashMode === 'static') {
        self.els.imgWrapper.style.zoom = String(self.scale);
      } else if (self.flashMode === 'horizontal') {
        self.els.horizontalImgWrapper.style.zoom = String(self.scale);
      } else if (self.flashMode === 'vertical') {
        self.els.verticalImgWrapper.style.zoom = String(self.scale);
      }
    });
  };

  PokemonFlash.prototype.flashModeBoot = function() {
    var self = this;
    this.scale = window.innerWidth / this.options.baseWidth;
    if (this.flashMode === 'static') {
      this.els.imgWrapper.style.zoom = String(this.scale);
    } else if (this.flashMode === 'horizontal') {
      this.els.horizontalImgWrapper.style.zoom = String(this.scale);
      // 设置初始位置
      this.els.horizontalImgs.forEach(function(img, index) {
        var left = self.options.frameSize * (index - 2);
        img.style.transform = 'translateX(' + left + 'px)';
        img.left = left;
      });
    } else if (this.flashMode === 'vertical') {
      this.els.verticalImgWrapper.style.zoom = String(this.scale);
      // 设置初始位置
      this.els.verticalImgs.forEach(function(img, index) {
        var top = self.options.frameSize * (index - 2);
        img.style.transform = 'translateY(' + top + 'px)';
        img.top = top;
      });
    }
  }

  // 为图像设置背景图位置
  PokemonFlash.prototype.setImgBackground = function (img) {
    var index = this.indexList.shift(); // 取出下一个索引
    var row = Math.floor(index / this.options.cols); // 计算行号
    var col = index % this.options.cols; // 计算列号
    // 设置背景图位置
    img.style.backgroundPosition =
      '-' + col * this.options.frameSize + 'px -' + row * this.options.frameSize + 'px';

    // 如果序列用完，重新生成随机序列
    if (this.indexList.length === 0) {
      this.getRandomIndex();
    }
  };

  // 执行一帧动画：更新精灵图位置
  PokemonFlash.prototype.stepFrame = function () {
    this.setImgBackground(this.els.mainImg);
  };

  // 执行水平方向动画帧：更新精灵图位置
  PokemonFlash.prototype.stepHorizontalFrame = function (dt) {
    var self = this;
    // 加速系数
    var k = 0;
    if (!this.horizontalStoping) {
      this.horizontalAccDt += dt;
      this.horizontalAccDt = Math.min(this.horizontalAccDt, this.FRAME_TIME * this.FPS * 3);
      k = this.horizontalAccDt / (this.FRAME_TIME * this.FPS * 3);
    } else { // 正在停止
      this.horizontalAccDt -= dt;
      this.horizontalAccDt = Math.max(this.horizontalAccDt, 0);
      k = this.horizontalAccDt / (this.FRAME_TIME * this.FPS * 6);
      if (k === 0) { // 完全停止，滚到正确位置
        if (this.horizontalEndScrollX === null) this.setHorizontalEndScrollX();
        var move = this.horizontalEndScrollX * dt / (this.FRAME_TIME * this.FPS) / (Math.abs(this.horizontalEndScrollX) / this.options.frameSize);
        this.horizontalEndScrollXTotal += move;
        this.els.horizontalImgs.forEach(function(img) {
          var left = img.left;
          left += move;
          img.style.transform = 'translateX(' + left + 'px)';
          img.left = left;
        });
        if (Math.abs(this.horizontalEndScrollXTotal) >= Math.abs(this.horizontalEndScrollX)) { // 到了正确位置
          if (!this.isEnd) this.doEnd();
        }
        return ;
      }
    }
    this.els.horizontalImgs.forEach(function(img, index) {
      var left = img.left;
      if (left > self.options.frameSize * 2) { // 超出边界，回到最左侧，重新随机一只
        var nextIndex = index === self.els.horizontalImgs.length - 1 ? 0 : index + 1;
        left = self.els.horizontalImgs[nextIndex].left - self.options.frameSize;
        self.setImgBackground(img);
      } else { // 未到边界，继续移动
        left += self.options.frameSize * dt * k / (self.FRAME_TIME * 3);
      }
      img.style.transform = 'translateX(' + left + 'px)';
      img.left = left;
    });
  };

  // 执行垂直方向动画帧：更新精灵图位置
  PokemonFlash.prototype.stepVerticalFrame = function (dt) {
    var self = this;
    // 加速系数
    var k = 0;
    if (!this.verticalStoping) {
      this.verticalAccDt += dt;
      this.verticalAccDt = Math.min(this.verticalAccDt, this.FRAME_TIME * this.FPS * 3);
      k = this.verticalAccDt / (this.FRAME_TIME * this.FPS * 3);
    } else { // 正在停止
      this.verticalAccDt -= dt;
      this.verticalAccDt = Math.max(this.verticalAccDt, 0);
      k = this.verticalAccDt / (this.FRAME_TIME * this.FPS * 6);
      if (k === 0) { // 完全停止，滚到正确位置
        if (this.verticalEndScrollY === null) this.setVerticalEndScrollY();
        var move = this.verticalEndScrollY * dt / (this.FRAME_TIME * this.FPS) / (Math.abs(this.verticalEndScrollY) / this.options.frameSize);
        this.verticalEndScrollYTotal += move;
        this.els.verticalImgs.forEach(function(img) {
          var top = img.top;
          top += move;
          img.style.transform = 'translateY(' + top + 'px)';
          img.top = top;
        });
        if (Math.abs(this.verticalEndScrollYTotal) >= Math.abs(this.verticalEndScrollY)) { // 到了正确位置
          if (!this.isEnd) this.doEnd();
        }
        return ;
      }
    }
    this.els.verticalImgs.forEach(function(img, index) {
      var top = img.top;
      if (top > self.options.frameSize * 2) { // 超出边界，回到最上方，重新随机一只
        var nextIndex = index === self.els.verticalImgs.length - 1 ? 0 : index + 1;
        top = self.els.verticalImgs[nextIndex].top - self.options.frameSize;
        self.setImgBackground(img);
      } else { // 未到边界，继续移动
        top += self.options.frameSize * dt * k / (self.FRAME_TIME * 3);
      }
      img.style.transform = 'translateY(' + top + 'px)';
      img.top = top;
    });
  };

  // 生成随机索引序列
  PokemonFlash.prototype.getRandomIndex = function () {
    this.indexList.length = 0; // 清空现有序列
    for (var i = 0; i < this.options.total; i += 1) {
      this.indexList.push(i); // 添加所有索引
    }
    // 随机排序
    this.indexList.sort(function () {
      return Math.random() - 0.5;
    });
  };

  // 主动画循环（固定时间步长）
  PokemonFlash.prototype.loop = function (time) {
    if (this.lastTime === 0) {
      this.lastTime = time; // 初始化上一帧时间
    }
    var dt = time - this.lastTime; // 计算时间增量
    this.lastTime = time;
    this.accumulator += dt; // 累加到时间累加器

    // 当累加时间超过一帧时间时，执行动画帧
    if (this.flashMode === 'static') {
      while (this.accumulator >= this.FRAME_TIME) {
        this.stepFrame();
        this.accumulator -= this.FRAME_TIME;
      }
    } else if (this.flashMode === 'horizontal') {
      this.stepHorizontalFrame(dt);
    } else if (this.flashMode === 'vertical') {
      this.stepVerticalFrame(dt);
    }

    if (this.isEnd) {
      return;
    }
    var self = this;
    this.rafId = requestAnimationFrame(function (t) {
      self.loop(t); // 继续下一帧
    });
  };

  // 循环播放背景音乐（如果未播放）
  PokemonFlash.prototype.loopBgm = function () {
    if (!this.musicBgmPlayed && !this.musicBgm.playing()) {
      this.musicBgm.play();
      this.musicBgmPlayed = true; // 标记已播放
    }
  };

  // 开始动画循环
  PokemonFlash.prototype.startLoop = function () {
    var self = this;
    this.lastTime = 0; // 重置时间
    this.accumulator = 0; // 重置累加器
    this.getRandomIndex(); // 生成随机序列
    this.els.startBtn.classList.toggle('stop', true); // 切换为停止按钮样式
    this.rafId = requestAnimationFrame(function (t) {
      self.loop(t); // 启动动画循环
    });
    this.musicBattle.play(); // 播放战斗音乐
    this.musicGet.stop(); // 停止获取音效
    this.musicBgm.fade(1, 0, this.options.bgmFadeOutDuration); // 淡出 BGM
    this.isEnd = false;
    if (this.flashMode === 'static') {
      this.els.imgWrapper.classList.toggle('result', false); // 移除结果样式
    } else if (this.flashMode === 'horizontal') {
      this.els.horizontalImgWrapper.classList.toggle('result', false); // 移除结果样式
      this.horizontalAccDt = 0; // 加速度DT
      this.horizontalStoping = false; // 是否正在减速
      this.horizontalEndScrollX = null; // 结束后要额外滚动的距离
      this.horizontalEndScrollXTotal = 0; // 已滚动的距离
    } else if (this.flashMode === 'vertical') {
      this.els.verticalImgWrapper.classList.toggle('result', false); // 移除结果样式
      this.verticalAccDt = 0; // 加速度DT
      this.verticalStoping = false; // 是否正在减速
      this.verticalEndScrollY = null; // 结束后要额外滚动的距离
      this.verticalEndScrollYTotal = 0; // 已滚动的距离
    }
  };

  // 结束动画循环
  PokemonFlash.prototype.endLoop = function () {
    if (this.flashMode === 'static') {
      this.doEnd();
    } else if (this.flashMode === 'horizontal') {
      this.horizontalStoping = true; // 加速度DT
      this.els.startBtn.classList.toggle('disabled', true); // 禁用按钮
      this.musicClick.play(); // 播放点击音效
    } else if (this.flashMode === 'vertical') {
      this.verticalStoping = true; // 加速度DT
      this.els.startBtn.classList.toggle('disabled', true); // 禁用按钮
      this.musicClick.play(); // 播放点击音效
    }
  };

  PokemonFlash.prototype.doEnd = function() {
    var self = this;
    this.isEnd = true;
    cancelAnimationFrame(this.rafId); // 取消动画帧
    this.rafId = null; // 清空 ID
    this.lastTime = 0; // 重置时间
    this.accumulator = 0; // 重置累加器
    this.els.startBtn.classList.toggle('stop', false); // 恢复开始按钮样式
    this.els.startBtn.classList.toggle('disabled', true); // 禁用按钮
    this.musicBattle.stop(); // 停止战斗音乐
    this.musicGet.play(); // 播放获取音效
    this.els.imgWrapper.classList.toggle('result', true); // 添加结果样式
    this.els.horizontalImgWrapper.classList.toggle('result', true); // 添加结果样式
    this.els.verticalImgWrapper.classList.toggle('result', true); // 添加结果样式
    // 获取音效播放完成后恢复按钮状态
    this.musicGet.once('end', function () {
      self.enableStart = true; // 允许再次开始
      self.els.startBtn.classList.toggle('disabled', false); // 启用按钮
    });
  }

  PokemonFlash.prototype.setHorizontalEndScrollX = function () {
    let min = Number.POSITIVE_INFINITY;
    let actualMin = 0;
    this.els.horizontalImgs.forEach(function (img) {
      min = Math.min(min, Math.abs(img.left));
      if (min === Math.abs(img.left)) actualMin = img.left;
    });
    this.horizontalEndScrollX = actualMin * -1;
  };

  PokemonFlash.prototype.setVerticalEndScrollY = function () {
    let min = Number.POSITIVE_INFINITY;
    let actualMin = 0;
    this.els.verticalImgs.forEach(function (img) {
      min = Math.min(min, Math.abs(img.top));
      if (min === Math.abs(img.top)) actualMin = img.top;
    });
    this.verticalEndScrollY = actualMin * -1;
  };



  // 打开设置面板
  PokemonFlash.prototype.openSetting = function (e) {
    if (this.settingShow || !this.enableStart || !this.isEnd) return; // 已显示则返回
    this.settingShow = true; // 标记为显示
    this.musicClick.play(); // 播放点击音效
    this.els.settingPanel.style.display = 'block'; // 显示面板
    clearTimeout(this.settingAniTimeout); // 清除动画定时器

    // 首次打开时初始化滑块
    if (!this.settingSliderInited) {
      this.initSettingSliders();
      this.settingSliderInited = true;
    }

    var self = this;
    // 动画结束后移除入场动画类
    this.settingAniTimeout = setTimeout(function () {
      self.els.settingPanel.classList.toggle('animate__slideInUp', false);
    }, this.options.settingPanelAniDuration);

    e.stopPropagation(); // 阻止事件冒泡
  };

  // 关闭设置面板
  PokemonFlash.prototype.closeSetting = function (e) {
    if (!this.settingShow) return; // 未显示则返回
    this.settingShow = false; // 标记为隐藏
    this.musicClick.play(); // 播放点击音效
    this.els.settingPanel.classList.toggle('animate__slideOutDown', true); // 添加出场动画
    clearTimeout(this.settingAniTimeout); // 清除动画定时器

    var self = this;
    // 动画结束后隐藏面板并重置动画类
    this.settingAniTimeout = setTimeout(function () {
      self.els.settingPanel.classList.toggle('animate__slideOutDown', false); // 移除出场动画
      self.els.settingPanel.classList.toggle('animate__slideInUp', true); // 添加入场动画（为下次打开准备）
      self.els.settingPanel.style.display = 'none'; // 隐藏面板
    }, this.options.settingPanelAniDuration);

    e.stopPropagation(); // 阻止事件冒泡
  };

  PokemonFlash.prototype.getImgWrapper = function() {
    if (this.flashMode === 'static') {
      return this.els.imgWrapper;
    } else if (this.flashMode === 'horizontal') {
      return this.els.horizontalImgWrapper;
    } else if (this.flashMode === 'vertical') {
      return this.els.verticalImgWrapper;
    }
  }

  // 初始化设置面板中的滑块
  PokemonFlash.prototype.initSettingSliders = function () {
    var self = this;

    // 亮度滑块
    this.initSlider('setting-brightness-value', function (percent) {
      self.els.imgWrapper.style.setProperty('--brightness-value', String((100 - percent) / 100));
      self.els.horizontalImgWrapper.style.setProperty('--brightness-value', String((100 - percent) / 100));
      self.els.verticalImgWrapper.style.setProperty('--brightness-value', String((100 - percent) / 100));
      self.els.imgWrapper.classList.toggle('result', false); // 移除结果样式
      self.els.horizontalImgWrapper.classList.toggle('result', false); // 移除结果样式
      self.els.verticalImgWrapper.classList.toggle('result', false); // 移除结果样式
    });

    // 灰度滑块
    this.initSlider('setting-gray-value', function (percent) {
      self.els.imgWrapper.style.setProperty('--grayscale-value', String(percent / 100));
      self.els.horizontalImgWrapper.style.setProperty('--grayscale-value', String(percent / 100));
      self.els.verticalImgWrapper.style.setProperty('--grayscale-value', String(percent / 100));
      self.els.imgWrapper.classList.toggle('result', false); // 移除结果样式
      self.els.horizontalImgWrapper.classList.toggle('result', false); // 移除结果样式
      self.els.verticalImgWrapper.classList.toggle('result', false); // 移除结果样式
    });

    // 模糊滑块
    this.initSlider('setting-blur-value', function (percent) {
      self.els.imgWrapper.style.setProperty(
        '--blur-value',
        String((percent / 100) * 5 / 100) + 'rem'
      );
      self.els.horizontalImgWrapper.style.setProperty(
        '--blur-value',
        String((percent / 100) * 5 / 100) + 'rem'
      );
      self.els.verticalImgWrapper.style.setProperty(
        '--blur-value',
        String((percent / 100) * 5 / 100) + 'rem'
      );
      self.els.imgWrapper.classList.toggle('result', false); // 移除结果样式
      self.els.horizontalImgWrapper.classList.toggle('result', false); // 移除结果样式
      self.els.verticalImgWrapper.classList.toggle('result', false); // 移除结果样式
    });

    // 帧率滑块
    this.initSlider(
      'setting-frame-value',
      function (percent) {
        self.FPS = 10 + Math.floor((50 * percent) / 100); // 10-60 FPS
        self.FRAME_TIME = 1000 / self.FPS; // 更新每帧时间
      },
      function () {
        return String(self.FPS) + ' FPS'; // 显示当前帧率
      }
    );
  };

  // 初始化滑块组件
  PokemonFlash.prototype.initSlider = function (id, onValueChange, valueFormatter) {
    var self = this;
    var sliderTrack = document.querySelector('#' + id + ' .weui-slider__track'); // 滑块轨道
    var sliderHandler = document.querySelector('#' + id + ' .weui-slider__handler'); // 滑块手柄
    var sliderValue = document.querySelector('#' + id + ' .weui-slider-box__value'); // 数值显示
    var sliderInner = document.querySelector('#' + id + ' .weui-slider__inner'); // 滑块容器

    var totalLen = sliderInner.getBoundingClientRect().width; // 滑块总长度
    var startLeft = 100; // 触摸起始位置（百分比）
    var startX = 0; // 触摸起始 X 坐标

    // 点击滑块轨道：直接跳转到点击位置
    sliderInner.addEventListener('click', function (e) {
      var dist = e.clientX - this.getBoundingClientRect().left; // 计算点击距离
      var percent;
      dist = dist < 0 ? 0 : dist > totalLen ? totalLen : dist; // 限制范围
      percent = parseInt((dist / totalLen) * 100, 10); // 计算百分比
      onValueChange(percent); // 调用回调
      sliderTrack.style.width = percent + '%'; // 更新轨道宽度
      sliderHandler.style.left = percent + '%'; // 更新手柄位置
      sliderValue.textContent = typeof valueFormatter === 'function' ? valueFormatter(percent) : percent; // 更新显示
      self.musicClick.play(); // 播放点击音效
    });

    // 触摸滑块手柄开始：记录起始位置
    sliderHandler.addEventListener('touchstart', function (e) {
      startLeft = parseInt(sliderHandler.style.left, 10) * totalLen / 100; // 当前手柄位置（像素）
      startX = e.changedTouches[0].clientX; // 触摸点 X 坐标
    });

    // 触摸滑块手柄移动：计算新位置
    sliderHandler.addEventListener('touchmove', function (e) {
      var dist = startLeft + e.changedTouches[0].clientX - startX; // 计算移动距离
      var percent;
      dist = dist < 0 ? 0 : dist > totalLen ? totalLen : dist; // 限制范围
      percent = parseInt((dist / totalLen) * 100, 10); // 计算百分比
      onValueChange(percent); // 调用回调
      sliderTrack.style.width = percent + '%'; // 更新轨道宽度
      sliderHandler.style.left = percent + '%'; // 更新手柄位置
      sliderValue.textContent = typeof valueFormatter === 'function' ? valueFormatter(percent) : percent; // 更新显示
      e.preventDefault(); // 阻止默认滚动
    });
  };

  // 初始化单选按钮组
  PokemonFlash.prototype.initRadioGroup = function (id, onValueChange) {
    var radioGroup = document.querySelector('#' + id); // 单选组容器
    if (!radioGroup) return; // 不存在则返回
    var radios = radioGroup.querySelectorAll('input[type="radio"]'); // 所有单选按钮
    for (var i = 0; i < radios.length; i += 1) {
      radios[i].addEventListener('change', function (e) {
        onValueChange(e.target.value); // 调用回调
      });
    }
  };

  // 暴露到全局
  window.PokemonFlash = PokemonFlash;
})();
