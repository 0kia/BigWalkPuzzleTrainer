// Handles switching between the top-level pages (tabs)
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.page;

      // Update tab button active states
      tabButtons.forEach(b => b.classList.toggle('active', b === btn));

      // Update page visibility
      document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === targetId);
      });
    });
  });
});