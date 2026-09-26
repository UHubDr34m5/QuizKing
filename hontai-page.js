/* Hash routes keep the browser Back button aligned with the mode picker. */
(() => {
  const home = document.getElementById('home-view');
  const quiz = document.getElementById('hontai-view');
  const homeButton = document.querySelector('.rail [aria-label="ホーム"]');
  const quizButton = document.querySelector('.rail [data-open-hontai]');
  const routes = Object.fromEntries(['hontai','elements'].flatMap(subject => ['', '/perfect', '/memory'].map(path => [`#${subject}${path}`, {subject, mode:path.slice(1) || 'menu'}])));
  function showView() {
    const route = routes[location.hash], playing = Boolean(route);
    const activeQuiz = route?.subject === 'elements' ? window.ElementsQuiz : window.HontaiQuiz;
    window.HontaiQuiz.leave(); window.ElementsQuiz.leave();
    home.hidden = playing; quiz.hidden = !playing;
    document.body.classList.toggle('hontai-active', playing);
    homeButton.removeAttribute('aria-current'); quizButton.removeAttribute('aria-current');
    (playing ? quizButton : homeButton).setAttribute('aria-current', 'page');
    if (playing) {
      activeQuiz.enter(route.mode);
      quiz.innerHTML = activeQuiz.markup();
      activeQuiz.refresh();
      document.getElementById('hq-title').focus({ preventScroll: true });
    } else quiz.innerHTML = '';
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-elements]')) {
      if (location.hash === '#elements') showView(); else location.hash = 'elements';
    }
    if (event.target.closest('[data-open-hontai]')) {
      if (location.hash === '#hontai') showView();
      else location.hash = 'hontai';
    }
    if (homeButton.contains(event.target)) {
      if (!location.hash) return;
      location.hash = '';
    }
  });
  window.addEventListener('hashchange', showView);
  showView();
})();
