/**
 * Progressive enhancement for Shiki code blocks inside an article: wraps each
 * `<pre class="shiki">` and adds a language label + copy-to-clipboard button.
 * No-JS readers still get the (styled) code block; this only adds the controls.
 */
export function enhanceCode(node: HTMLElement) {
  const blocks = node.querySelectorAll<HTMLElement>("pre.shiki");

  for (const pre of blocks) {
    if (pre.dataset.enhanced) continue;
    pre.dataset.enhanced = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";
    pre.replaceWith(wrapper);
    wrapper.appendChild(pre);

    const bar = document.createElement("div");
    bar.className = "code-bar";

    const lang = pre.dataset.language;
    if (lang && lang !== "text") {
      const label = document.createElement("span");
      label.className = "code-lang";
      label.textContent = lang;
      bar.appendChild(label);
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = "code-copy";
    button.textContent = "Copy";
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(pre.innerText);
        button.textContent = "Copied";
        setTimeout(() => (button.textContent = "Copy"), 1500);
      } catch {
        button.textContent = "Failed";
        setTimeout(() => (button.textContent = "Copy"), 1500);
      }
    });
    bar.appendChild(button);
    wrapper.appendChild(bar);
  }
}
