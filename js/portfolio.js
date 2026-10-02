// Toggle del índice en mobile
const navToggle = document.getElementById('navToggle');
const index = document.getElementById('index');

navToggle.addEventListener('click', () => {
  const isOpen = index.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(isOpen));
  navToggle.setAttribute('aria-label', isOpen ? 'Cerrar índice' : 'Abrir índice');
});

// Cierra el índice al elegir una sección (mobile)
index.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    index.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir índice');
  });
});

// Resalta la sección visible en el índice
const links = index.querySelectorAll('a');
const sections = document.querySelectorAll('main .sheet');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.getAttribute('id');
      links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(section => observer.observe(section));

document.addEventListener('keydown', event => {
  if (event.ctrlKey && event.altKey && !event.shiftKey && !event.metaKey && event.key.toLowerCase() === 'u') {
    event.preventDefault();
    document.getElementById('adminUsersShortcut').click();
  }
});
