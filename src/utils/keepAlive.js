const BACKEND_URL = 'https://iglesia-api-g1ux.onrender.com'

export const iniciarKeepAlive = () => {
  const ping = () => {
    fetch(`${BACKEND_URL}/health`).catch(() => {})
  }
  ping()
  setInterval(ping, 10 * 60 * 1000)
}
