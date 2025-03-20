const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');
const rl = readline.createInterface({ input, output });

function getScoreForHand(hand) {
  // Sort such that A is last
  hand.sort((a, b) => {
    if (a === 'A') {
      return 1
    }
    return b === 'A' ? -1 : 0
  })

  const score = hand.reduce((acc, obj) => {
    if (obj === 'J' || obj === 'Q' || obj === 'K') {
      return acc + 10
    }

    if (obj === 'A') {
      if (acc > 10) {
        // Must be 1 because adding 11 to (11 or higher) results in 22+ (bust)
        return acc + 1
      }
      return acc + 11
    }

    return acc + Number(obj)
  }, 0)

  // console.log(`Hand is ${hand.join(', ')}. Score is ${score}`)
  return score
}

async function getPlayerCount() {
  while (true) {
    const answer = await rl.question(`How many players are playing? (1-5)`);
    console.log(answer)

    const numAnswer = Number(answer)

    if (numAnswer < 1 || numAnswer > 5 || Number.isNaN(numAnswer)) {
      console.log("Invalid number of players")
      continue
    }

    return numAnswer
  }
}

async function createPlayer(i) {
  const player = {
    name: await getName(i),
    hand: [],
    score: 0,
    busted: false
  }

  return player
}

async function getName(i) {
  while (true) {
    const answer = await rl.question(`Player ${i + 1}: What is your name?`);
    if (answer.length > 0 && answer.length < 13) {
      return answer
    }

    console.log(`Invalid name - please enter between 1 and 12 characters`)
  }
}

async function getRounds(playerCount = 1) {
  const maxRounds = Math.floor(52 / (playerCount + 1) / 2)
  while (true) {
    const answer = await rl.question(`How many rounds? (max ${maxRounds})`);
    if (answer.length > 0 && answer.length < 13) {
      return answer
    }

    console.log(`Invalid number - please enter between 1 and 12`)
  }
}


async function main() {
  // Shuffle first
  await fetch("http://localhost:9090/shuffle");

  const numPlayers = await getPlayerCount()
  const players = []

  for (let i = 0; i < numPlayers; i++) {
    const player = await createPlayer(i)
    players.push(player)
  }

  const roundCount = await getRounds(numPlayers)

  for (let x = 0; x < roundCount; x++) {
    console.log(`Round ${x + 1} of ${roundCount}`)
    for (let y = 0; y < numPlayers; y++) {
      const player = players[y]
      player.busted = false
      player.hand = []
      player.score = 0

      await givePlayerCard(player)
      await givePlayerCard(player)
    }

    const dealerHand = [await getCard(), await getCard()]

    for (let i = 0; i < numPlayers; i++) {
      const player = players[i]
      while (true) {
        const answer = await rl.question(`Player ${player.name}: Your current score is ${getScoreForHand(player.hand)} (${player.hand.join(', ')}) would you like to Hit or Stand? (H/S)`);

        if (answer.toLowerCase() === 'h') {
          await givePlayerCard(player)

          if (player.busted) {
            // Bust
            console.log(`Player ${player.name} busted with hand ${player.hand.join(', ')}`)
            break
          }
        } else {
          // Stand
          console.log(`Player ${player.name}`)
          break
        }
      }
    }

    while (true) {
      if (getScoreForHand(dealerHand) < 17) {
        dealerHand.push(await getCard())
      } else {
        break
      }
    }

    const finalDealerScore = getScoreForHand(dealerHand)
    console.log(`Dealer's hand is ${dealerHand.join(', ')}. Final dealer score is ${finalDealerScore}`)

    const dealerBusted = finalDealerScore > 21

    for (let i = 0; i < numPlayers; i++) {
      const player = players[i]
      if ((player.score > finalDealerScore || dealerBusted) && !player.busted) {
        console.log(`Player ${player.name} WINS against the dealer with a score of ${player.score}`)
      } else if (player.score === finalDealerScore && !player.busted) {
        console.log(`Player ${player.name} TIES against the dealer with a score of ${player.score}`)
      } else {
        console.log(`Player ${player.name} LOSES against the dealer with a score of ${player.score}`)
      }
    }
  }

  rl.close()
}

async function givePlayerCard(player) {
  const card = await getCard()
  player.hand.push(card)
  player.score = getScoreForHand(player.hand)
  player.busted = player.score > 21
}

async function getCard() {
  try {
    const res = await fetch("http://localhost:9090/get-card")
    const json = await res.json()
    return json.card.substring(0, 1)
  }
  catch (e) {
    console.log("No cards left in deck")
    process.exit()
  }
}

main()
