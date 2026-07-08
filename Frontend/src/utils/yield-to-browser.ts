
export const yieldToBrowser = () => {
  return new Promise(resolve => requestAnimationFrame(resolve));
}
