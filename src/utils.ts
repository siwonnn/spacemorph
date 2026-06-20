export function getRandomInt(min: number, max: number): number {
  const minInt = Math.ceil(min)
  const maxInt = Math.floor(max)
  return Math.floor(Math.random() * (maxInt - minInt + 1) + minInt)
}

export function getRandomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}