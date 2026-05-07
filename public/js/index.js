// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const navbarHeight = document.querySelector('.navbar').offsetHeight;
      const targetPosition = target.offsetTop - navbarHeight;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// Check if user is already logged in and update navbar
document.addEventListener('DOMContentLoaded', async () => {
  const userData = await MedFamily.checkAuth();
  if (userData) {
    const ctaButtons = document.querySelectorAll('a[href="/pages/register.html"]');
    ctaButtons.forEach(btn => {
      btn.href = '#';
      btn.textContent = 'Go to Dashboard';
      btn.onclick = (e) => {
        e.preventDefault();
        MedFamily.redirectByRole(userData);
      };
    });
  }
});
