import "./style.css";
import "./notfound.css";
import { drawScene } from "./scene.ts";

drawScene();

// Either verdict, at random.
const busted = Math.random() < 0.35;
if (busted) {
  document.documentElement.classList.add("is-busted");
  document.title = "Busted — Mark Eriksson";
  document.querySelector("[data-dead-word]")!.textContent = "Busted";
  document.querySelector("[data-dead-sub]")!.textContent = "404 · You took a wrong turn. This page doesn’t exist.";
}
