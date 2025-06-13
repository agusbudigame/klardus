// PWA Installation Script
// Catatan: Script ini hanya berjalan di browser, bukan di Node.js

// Cek apakah kode dijalankan di browser
if (typeof window !== "undefined") {
  let deferredPrompt

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault()
    // Stash the event so it can be triggered later
    deferredPrompt = e

    // Show install button
    const installButton = document.getElementById("install-button")
    if (installButton) {
      installButton.style.display = "block"

      installButton.addEventListener("click", () => {
        // Hide the install button
        installButton.style.display = "none"
        // Show the prompt
        deferredPrompt.prompt()
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            console.log("User accepted the install prompt")
          } else {
            console.log("User dismissed the install prompt")
          }
          deferredPrompt = null
        })
      })
    }
  })

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    })
  }

  // Handle app installation
  window.addEventListener("appinstalled", () => {
    console.log("PWA was installed")
  })
}

// Untuk kompatibilitas dengan Node.js
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    // Export dummy function untuk Node.js
    setupPWA: () => console.log("PWA setup function - only works in browser environment"),
  }
}
