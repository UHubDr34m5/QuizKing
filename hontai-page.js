/* Integrate the book quiz with the current static dashboard. */
(() => {
  const home = document.getElementById('home-view');
  const quiz = document.getElementById('hontai-view');
  const homeButton = document.querySelector('.rail [aria-label="ホーム"]');
  const quizButton = document.querySelector('.rail [data-open-hontai]');
  function showView() {
    const playing = location.hash === '#hontai';
    home.hidden = playing;
    quiz.hidden = !playing;
    document.body.classList.toggle('hontai-active', playing);
    homeButton.toggleAttribute('aria-current', !playing);
    quizButton.toggleAttribute('aria-current', playing);
    (playing ? quizButton : homeButton).setAttribute('aria-current', 'page');
    if (playing) {
      quiz.innerHTML = window.HontaiQuiz.markup();
      window.HontaiQuiz.refresh();
      const title = document.getElementById('hq-title');
      title.tabIndex = -1;
      title.focus({preventScroll:true});
    } else {
      quiz.innerHTML = '';
    }
    window.scrollTo(0,0);
  }
  document.addEventListener('click', event => {
    if (event.target.closest('[data-open-hontai]')) {
      if (location.hash === '#hontai') showView();
      else location.hash = 'hontai';
    }
    if (event.target.closest('.hq-page [data-action="navigate"][data-view="home"]') || homeButton.contains(event.target)) {
      history.pushState(null,'',location.pathname+location.search);
      showView();
      document.querySelector('.start-button')?.focus({preventScroll:true});
    }
  });
  window.addEventListener('hashchange', showView);
  showView();
})();
