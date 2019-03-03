export default function disableRightClickMenu(selector) {
  document.querySelector(selector).addEventListener("contextmenu", e => {
    e.preventDefault();
    return false;
  });
}
