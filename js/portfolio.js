// Toggle del índice en mobile
const navToggle = document.getElementById('navToggle');
const index = document.getElementById('index');

navToggle.addEventListener('click', () => {
  index.classList.toggle('open');
});

// Cierra el índice al elegir una sección (mobile)
index.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => index.classList.remove('open'));
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
