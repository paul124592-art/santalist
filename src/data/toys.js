// Toy catalog — every toy has a picture (emoji) kids can tap to add it to their list.
export const CATEGORIES = [
  { id: 'all', label: 'All toys' },
  { id: 'plush', label: 'Plush & Dolls' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'games', label: 'Games' },
  { id: 'creative', label: 'Creative' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'tech', label: 'Tech' },
  { id: 'music', label: 'Music' },
  { id: 'learning', label: 'Books & Learning' },
]

export const TOYS = [
  // Plush & Dolls
  { id: 'teddy', name: 'Teddy Bear', emoji: '🧸', category: 'plush' },
  { id: 'doll', name: 'Doll', emoji: '🪆', category: 'plush' },
  { id: 'unicorn', name: 'Unicorn Plush', emoji: '🦄', category: 'plush' },
  { id: 'puppy', name: 'Puppy Plush', emoji: '🐶', category: 'plush' },
  { id: 'dino', name: 'Dinosaur Plush', emoji: '🦖', category: 'plush' },
  { id: 'bunny', name: 'Bunny Plush', emoji: '🐰', category: 'plush' },
  // Vehicles
  { id: 'train', name: 'Train Set', emoji: '🚂', category: 'vehicles' },
  { id: 'racecar', name: 'Race Car', emoji: '🏎️', category: 'vehicles' },
  { id: 'rccar', name: 'Remote Control Car', emoji: '🚗', category: 'vehicles' },
  { id: 'plane', name: 'Toy Airplane', emoji: '✈️', category: 'vehicles' },
  { id: 'rocket', name: 'Rocket Ship', emoji: '🚀', category: 'vehicles' },
  { id: 'truck', name: 'Toy Truck', emoji: '🛻', category: 'vehicles' },
  { id: 'bus', name: 'School Bus', emoji: '🚌', category: 'vehicles' },
  // Games
  { id: 'boardgame', name: 'Board Game', emoji: '🎲', category: 'games' },
  { id: 'puzzle', name: 'Puzzle', emoji: '🧩', category: 'games' },
  { id: 'cards', name: 'Card Game', emoji: '🃏', category: 'games' },
  { id: 'console', name: 'Video Game Console', emoji: '🎮', category: 'games' },
  { id: 'arcade', name: 'Arcade Game', emoji: '🕹️', category: 'games' },
  { id: 'dart', name: 'Dart Board', emoji: '🎯', category: 'games' },
  // Creative
  { id: 'artset', name: 'Art Set', emoji: '🎨', category: 'creative' },
  { id: 'crayons', name: 'Crayons', emoji: '🖍️', category: 'creative' },
  { id: 'blocks', name: 'Building Blocks', emoji: '🧱', category: 'creative' },
  { id: 'yoyo', name: 'Yo-Yo', emoji: '🪀', category: 'creative' },
  { id: 'bubbles', name: 'Bubble Kit', emoji: '🫧', category: 'creative' },
  { id: 'slime', name: 'Slime Kit', emoji: '🟢', category: 'creative' },
  // Outdoor
  { id: 'soccer', name: 'Soccer Ball', emoji: '⚽', category: 'outdoor' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', category: 'outdoor' },
  { id: 'skateboard', name: 'Skateboard', emoji: '🛹', category: 'outdoor' },
  { id: 'scooter', name: 'Scooter', emoji: '🛴', category: 'outdoor' },
  { id: 'bike', name: 'Bike', emoji: '🚲', category: 'outdoor' },
  { id: 'kite', name: 'Kite', emoji: '🪁', category: 'outdoor' },
  // Tech
  { id: 'tablet', name: 'Kids Tablet', emoji: '📱', category: 'tech' },
  { id: 'robot', name: 'Robot Toy', emoji: '🤖', category: 'tech' },
  { id: 'headphones', name: 'Headphones', emoji: '🎧', category: 'tech' },
  { id: 'watch', name: 'Kids Watch', emoji: '⌚', category: 'tech' },
  { id: 'camera', name: 'Kids Camera', emoji: '📷', category: 'tech' },
  // Music
  { id: 'guitar', name: 'Toy Guitar', emoji: '🎸', category: 'music' },
  { id: 'drums', name: 'Drum Set', emoji: '🥁', category: 'music' },
  { id: 'piano', name: 'Keyboard Piano', emoji: '🎹', category: 'music' },
  { id: 'mic', name: 'Karaoke Microphone', emoji: '🎤', category: 'music' },
  // Books & Learning
  { id: 'storybook', name: 'Story Book', emoji: '📚', category: 'learning' },
  { id: 'telescope', name: 'Telescope', emoji: '🔭', category: 'learning' },
  { id: 'science', name: 'Science Kit', emoji: '🔬', category: 'learning' },
  { id: 'globe', name: 'Globe', emoji: '🌍', category: 'learning' },
]

export const CHRISTMAS_DATE = { month: 11, day: 25 } // December 25 (0-based month)

export function daysUntilChristmas(now = new Date()) {
  const year = now.getMonth() === 11 && now.getDate() > 25 ? now.getFullYear() + 1 : now.getFullYear()
  const christmas = new Date(year, CHRISTMAS_DATE.month, CHRISTMAS_DATE.day)
  const diff = christmas - new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round(diff / 86400000)
  return days
}
