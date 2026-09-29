(() => {
  const host = window.location.hostname;
  const path = window.location.pathname;
  const base = document.querySelector("#app-base");
  if (!(base instanceof HTMLBaseElement)) return;

  if (host.endsWith("github.io")) {
    const project = path.split("/").filter(Boolean)[0];
    base.href = project ? `/${project}/` : "/";
  } else if (host === "raw.githack.com" || host === "rawgit.com") {
    base.href = path.slice(0, path.lastIndexOf("/") + 1);
  }
})();
