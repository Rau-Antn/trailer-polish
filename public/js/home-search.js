(() => {
  const search = document.getElementById('homeHeaderSearch');
  const form = document.getElementById('homeHeaderSearchForm');
  const button = document.getElementById('homeHeaderSearchButton');
  const input = document.getElementById('homeHeaderSearchInput');

  if (!search || !form || !button || !input) return;

  const openSearch = () => {
    search.classList.add('is-open');
    window.requestAnimationFrame(() => input.focus());
  };

  const closeSearch = () => {
    if (!input.value.trim()) search.classList.remove('is-open');
  };

  button.addEventListener('click', event => {
    if (!search.classList.contains('is-open')) {
      event.preventDefault();
      openSearch();
    }
  });

  input.addEventListener('focus', () => search.classList.add('is-open'));
  input.addEventListener('blur', () => window.setTimeout(closeSearch, 120));

  form.addEventListener('submit', event => {
    event.preventDefault();
    const q = input.value.trim();
    if (!q) {
      openSearch();
      return;
    }
    window.location.href = `catalog.html?q=${encodeURIComponent(q)}`;
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.activeElement === input) {
      input.blur();
      closeSearch();
    }
  });
})();
