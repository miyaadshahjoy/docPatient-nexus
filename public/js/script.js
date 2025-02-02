document.addEventListener('DOMContentLoaded', () => {
  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth',
      });
    });
  });

  // Header scroll effect
  const header = document.querySelector('header');
  const heroSection = document.querySelector('#hero');

  window.addEventListener('scroll', () => {
    if (window.scrollY > heroSection.offsetHeight - header.offsetHeight) {
      header.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    } else {
      header.style.backgroundColor = 'var(--white)';
    }
  });

  // Service item hover effect
  const serviceItems = document.querySelectorAll('.service-item');

  serviceItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'translateY(-10px)';
    });

    item.addEventListener('mouseleave', () => {
      item.style.transform = 'translateY(0)';
    });
  });
});
