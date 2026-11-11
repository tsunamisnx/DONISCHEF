'use strict';

(() => {
  const hero = document.querySelector('.hero');
  const slides = [...hero.querySelectorAll('.hero-slide')];
  const controls = document.querySelector('#hero-controls');
  const dots = [...controls.querySelectorAll('[data-slide]')];
  const pauseButton = document.querySelector('#hero-pause');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let userPaused = null;
  let inView = true;
  let timer;
  const isPaused = () => userPaused ?? reducedMotion.matches;

  function selectSlide(index) {
    if (!slides[index].complete || slides[index].naturalWidth === 0) return;
    current = index;
    slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => dot.setAttribute('aria-pressed', String(i === index)));
  }

  function schedule() {
    clearTimeout(timer);
    const paused = isPaused();
    pauseButton.setAttribute('aria-label', paused ? 'Продолжить смену фотографий' : 'Остановить смену фотографий');
    pauseButton.querySelector('span').textContent = paused ? '▶' : 'Ⅱ';
    if (paused || document.hidden || !inView) return;
    timer = setTimeout(() => {
      for (let step = 1; step < slides.length; step++) {
        const next = (current + step) % slides.length;
        if (slides[next].complete && slides[next].naturalWidth > 0) {
          selectSlide(next);
          break;
        }
      }
      schedule();
    }, 6000);
  }

  dots.forEach((dot, index) => dot.addEventListener('click', () => {
    if (!slides[index].complete) {
      slides[index].addEventListener('load', () => { selectSlide(index); schedule(); }, { once: true });
    } else selectSlide(index);
    schedule();
  }));
  pauseButton.addEventListener('click', () => { userPaused = !isPaused(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    schedule();
  }).observe(hero);
  controls.hidden = false;
  schedule();
})();

(() => {
  const menu = window.DONI_MENU;
  const filters = document.querySelector('#category-filters');
  const search = document.querySelector('#menu-search');
  const list = document.querySelector('#menu-items');
  const title = document.querySelector('#category-title');
  const count = document.querySelector('#result-count');
  const empty = document.querySelector('#empty-state');
  const feature = document.querySelector('#menu-feature-image');
  let category = 'signature';

  const normalize = text => text.toLocaleLowerCase('ru').replaceAll('ё', 'е').replace(/[^а-яa-z0-9]+/g, ' ').trim();
  const categories = [...menu.categories, { id: 'all', label: 'Всё меню' }];
  const priceFormat = new Intl.NumberFormat('ru-RU');
  const plural = n => (n % 10 === 1 && n % 100 !== 11 ? 'блюдо' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'блюда' : 'блюд');

  categories.forEach(item => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.category = item.id;
    button.textContent = item.label;
    button.setAttribute('aria-pressed', String(item.id === category));
    button.addEventListener('click', () => { category = item.id; render(); });
    filters.append(button);
  });

  function render() {
    const words = normalize(search.value).split(' ').filter(Boolean);
    const results = menu.items.filter(item => (category === 'all' || item.category === category) && words.every(word => normalize(`${item.name} ${item.detail || ''}`).includes(word)));
    const current = categories.find(item => item.id === category);
    title.textContent = current.label;
    count.textContent = `${results.length} ${plural(results.length)}`;
    filters.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
    const photo = category === 'all' ? menu.categories[0] : current;
    if (feature.getAttribute('src') !== photo.image) { feature.src = photo.image; feature.alt = photo.alt; }
    const fragment = document.createDocumentFragment();
    results.forEach((item, index) => {
      const article = document.createElement('article');
      article.className = 'menu-item';
      const number = document.createElement('span');
      number.className = 'item-number';
      number.setAttribute('aria-hidden', 'true');
      number.textContent = String(index + 1).padStart(2, '0');
      const content = document.createElement('div');
      content.className = 'item-content';
      const heading = document.createElement('h4');
      heading.textContent = item.name;
      content.append(heading);
      if (item.detail) { const detail = document.createElement('p'); detail.textContent = item.detail; content.append(detail); }
      if (category === 'all') { const sub = document.createElement('span'); sub.className = 'item-category'; sub.textContent = menu.categories.find(c => c.id === item.category).label; content.append(sub); }
      const price = document.createElement('span');
      price.className = 'item-price';
      price.textContent = `${priceFormat.format(item.price)} ₽`;
      article.append(number, content, price);
      fragment.append(article);
    });
    list.replaceChildren(fragment);
    empty.hidden = results.length > 0;
    list.hidden = results.length === 0;
  }

  search.addEventListener('input', () => { if (search.value.trim()) category = 'all'; render(); });
  document.querySelector('#reset-search').addEventListener('click', () => { search.value = ''; category = 'all'; render(); search.focus(); });
  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.ctrlKey && !event.metaKey && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName) && !document.activeElement.isContentEditable && !dialog.open) {
      event.preventDefault(); search.focus(); search.scrollIntoView({ block: 'center' });
    }
  });
  render();

  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  function closeNav() { navToggle.setAttribute('aria-expanded', 'false'); navToggle.setAttribute('aria-label', 'Открыть навигацию'); mobileNav.hidden = true; }
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Закрыть навигацию' : 'Открыть навигацию');
    mobileNav.hidden = !open;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !mobileNav.hidden) { closeNav(); navToggle.focus(); } });
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeNav(); });
  matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) closeNav(); });

  const dialog = document.querySelector('#image-dialog');
  const dialogImage = document.querySelector('#dialog-image');
  const imageArea = document.querySelector('#dialog-image-area');
  const zoomButton = document.querySelector('#zoom-image');
  const previous = document.querySelector('#prev-image');
  const next = document.querySelector('#next-image');
  let pages = [];
  let page = 0;
  let returnFocus = null;
  const menuLabels = ['Обложка · Ленина, 30', 'Ассорти шашлыков', 'Первые блюда', 'Вторые блюда', 'Фирменные блюда', 'Гарниры и чай'];
  const gallery = [
    { src: 'assets/images/shashlik.webp', alt: 'Шашлык с овощами и соусом в ДониШеф', source: 'https://t.me/donishef_ufa/885' },
    { src: 'assets/images/hall.webp', alt: 'Зал чайханы ДониШеф', source: 'https://t.me/donishef_ufa/837' },
    { src: 'assets/images/kazan.webp', alt: 'Самаркандский плов в казане на кухне ДониШеф', source: 'https://t.me/donishef_ufa/826' }
  ];
  function setZoom(value) {
    imageArea.classList.toggle('is-zoomed', value);
    zoomButton.setAttribute('aria-pressed', String(value));
    zoomButton.textContent = value ? 'Уменьшить −' : 'Увеличить +';
  }
  function showImage() {
    const image = pages[page];
    dialogImage.src = image.src;
    dialogImage.alt = image.alt;
    document.querySelector('#image-counter').textContent = `${page + 1} / ${pages.length}`;
    document.querySelector('#dialog-caption').textContent = image.alt;
    document.querySelector('#dialog-source').href = image.source;
    previous.disabled = page === 0;
    next.disabled = page === pages.length - 1;
    setZoom(false);
    imageArea.scrollTop = 0;
    imageArea.scrollLeft = 0;
  }
  function openImages(images, index, isMenu, trigger) {
    pages = images; page = index; returnFocus = trigger;
    document.querySelector('#dialog-eyebrow').textContent = isMenu ? 'МЕНЮ ОТ 10 СЕНТЯБРЯ 2026' : 'ФОТОГРАФИИ ЧАЙХАНЫ';
    document.querySelector('#dialog-title').textContent = isMenu ? 'Оригинальное меню' : 'В гостях у «ДониШеф»';
    showImage();
    document.body.classList.add('dialog-open');
    dialog.showModal();
    document.querySelector('#close-dialog').focus();
  }
  document.querySelector('#open-menu').addEventListener('click', event => openImages(menuLabels.map((label, i) => ({ src: `assets/menu/page-${i + 1}.jpg`, alt: label, source: menu.source })), 0, true, event.currentTarget));
  document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => openImages(gallery, Number(button.dataset.gallery), false, button)));
  document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); if (returnFocus) returnFocus.focus({ preventScroll: true }); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  previous.addEventListener('click', () => { if (page > 0) { page--; showImage(); } });
  next.addEventListener('click', () => { if (page < pages.length - 1) { page++; showImage(); } });
  zoomButton.addEventListener('click', () => setZoom(zoomButton.getAttribute('aria-pressed') !== 'true'));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' && page > 0) { event.preventDefault(); page--; showImage(); }
    if (event.key === 'ArrowRight' && page < pages.length - 1) { event.preventDefault(); page++; showImage(); }
  });
})();
