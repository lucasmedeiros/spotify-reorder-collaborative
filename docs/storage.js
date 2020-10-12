export function getFromLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key))
}

export function saveInLocalStorage(key, value) {
  if (!key || !value)
    return false

  const storageValue = JSON.stringify(value)
  localStorage.setItem(key, storageValue)
  return true
}

export function removeFromLocalStorage(key) {
  localStorage.removeItem(key)
}
