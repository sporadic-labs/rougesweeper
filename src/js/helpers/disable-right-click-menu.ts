export default function disableRightClickMenu(selector: string) {
  document.querySelector(selector).addEventListener("contextmenu", (e) => {
    e.preventDefault();
    return false;
  });
}
