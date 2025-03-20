const readline = require('readline/promises');
const { stdin: input, stdout: output } = require('process');

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

async function main() {
  // Shuffle first
  await fetch("http://localhost:9090/shuffle");

  const dealerHand = [await getCard(), await getCard()]
  const playerHand = [await getCard(), await getCard()]

  const rl = readline.createInterface({ input, output });
  
  while (true) {
    const answer = await rl.question(`Player: Your current score is ${getScoreForHand(playerHand)} would you like to Hit or Stand? (H/S)`);
    console.log(answer)
    if (answer.toLowerCase() === 'h') {
      playerHand.push(await getCard())

      if (getScoreForHand(playerHand) > 21) {
        // Bust
        console.log("Player busted! - You lose")
        process.exit(0)
      }
    } else {
      // Stand
      console.log("Player stood!")
      break
    }
  }

  if (getScoreForHand(dealerHand) === 16) {
    dealerHand.push(await getCard())
  }

  const finalDealerScore = getScoreForHand(dealerHand)
  const finalPlayerScore = getScoreForHand(playerHand)

  console.log(`Dealer: ${finalDealerScore}. Player: ${finalPlayerScore}`)

  if (finalDealerScore > 21) {
    console.log("Dealer busted! - Player Wins!")
  } else if (finalPlayerScore > finalDealerScore && finalPlayerScore < 22) {
    console.log("Player won!")
  } else if (finalPlayerScore < finalDealerScore && finalDealerScore < 22) {
    console.log("Dealer won!")
  } else {
    console.log("It's a tie!")
  }

  rl.close()
}

async function getCard() {
  const res = await fetch("http://localhost:9090/get-card")
  const json = await res.json()
  return json.card.substring(0, 1)
}

main()
