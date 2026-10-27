// Show one screen and hide the rest
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

// Any button with data-goto="screen-x" switches to that screen
document.querySelectorAll("[data-goto]").forEach((btn) => {
  btn.addEventListener("click", () => showScreen(btn.dataset.goto));
});