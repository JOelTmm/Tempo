(function () {
  const cfg = window.TEMPO_DOWNLOAD_CONFIG || { githubRepo: "VOTRE-UTILISATEUR/Tempo" };
  const repo = cfg.githubRepo.replace(/\/$/, "");
  const base = `https://github.com/${repo}/releases/latest/download`;

  const btnSetup = document.getElementById("btn-setup");
  const btnPortable = document.getElementById("btn-portable");
  const repoLink = document.getElementById("repo-link");
  const hint = document.getElementById("release-hint");

  if (btnSetup && cfg.setupFile) {
    btnSetup.href = `${base}/${cfg.setupFile}`;
  }
  if (btnPortable && cfg.portableFile) {
    btnPortable.href = `${base}/${cfg.portableFile}`;
  }
  if (repoLink) {
    repoLink.href = `https://github.com/${repo}`;
    repoLink.textContent = repo;
  }
  if (hint) {
    hint.textContent = `Liens : github.com/${repo}/releases/latest`;
  }

  const mobileWarn = document.getElementById("mobile-warning");
  if (mobileWarn) {
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
    if (isMobile) {
      mobileWarn.hidden = false;
      if (btnSetup) btnSetup.setAttribute("aria-disabled", "true");
      if (btnPortable) btnPortable.setAttribute("aria-disabled", "true");
    }
  }
})();