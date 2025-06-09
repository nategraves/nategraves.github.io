import type {
  Player,
  GameObject,
  GameSettings, // Now correctly imported
  PlayerPersistentStats,
  GameConstants,
  TeamInfo, // Now correctly imported
} from '../types/index';

export function initializePlayer(
  controllerId: string,
  playerName: string,
  teamIdx: number,
  ratioX: number,
  ratioY: number,
  constants: GameConstants,
  teamHexColor: string
): Player {
  return {
    id: controllerId,
    playerName,
    ratioX,
    ratioY,
    vx: 0,
    vy: 0,
    aimX: 0,
    aimY: 0,
    score: 0, // Score within the current game, might be redundant if using teamScores primarily
    team: teamIdx,
    wetnessLevel: 0,
    wetnessColor: teamHexColor, // Use passed team color
    isGrounded: true,
    prevJump: false,
    jumpsRemaining: constants.MAX_JUMPS_CONST,
    prevTrigger: false,
    triggerStart: null,
    buttons: Array(16).fill(false),
    isUmbrellaOpen: false,
    umbrellaAngle: constants.UMBRELLA_DEFAULT_ANGLE,
  };
}

export function randomFloorPosition(constants: GameConstants): {
  ratioX: number;
  ratioY: number;
} {
  const minX = -constants.MAX_RATIO_X;
  const maxX = constants.MAX_RATIO_X;
  const randomX = Math.random() * (maxX - minX) + minX;
  // Ensure player spawns on the floor, considering their height
  return {
    ratioX: randomX,
    ratioY: constants.MAX_RATIO_Y - constants.PLAYER_HEIGHT_RATIO,
  };
}

export function updateSinglePlayerPhysics(
  player: Player,
  deltaTime: number,
  constants: GameConstants
): Player {
  const newPlayer = { ...player };

  // Apply gravity
  newPlayer.vy += constants.GRAVITY * deltaTime;

  // Apply terminal velocity
  const currentTerminalVelocity = newPlayer.isUmbrellaOpen
    ? constants.UMBRELLA_TERMINAL_VELOCITY
    : constants.TERMINAL_VELOCITY_CONST;
  newPlayer.vy = Math.min(newPlayer.vy, currentTerminalVelocity);
  if (newPlayer.isUmbrellaOpen && newPlayer.vy < 0) {
    // Slower ascent with umbrella
    newPlayer.vy *= constants.UMBRELLA_GRAVITY_MULTIPLIER;
  }

  // Apply horizontal movement speed reduction if umbrella is open
  if (newPlayer.isUmbrellaOpen) {
    newPlayer.vx *= constants.UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER;
  }

  // Update position
  newPlayer.ratioX += newPlayer.vx * deltaTime;
  newPlayer.ratioY += newPlayer.vy * deltaTime;

  // Boundary checks and ground collision
  newPlayer.isGrounded = false; // Assume not grounded unless collision detected

  // Floor collision
  if (
    newPlayer.ratioY >=
    constants.MAX_RATIO_Y - constants.PLAYER_HEIGHT_RATIO
  ) {
    newPlayer.ratioY = constants.MAX_RATIO_Y - constants.PLAYER_HEIGHT_RATIO;
    newPlayer.vy = 0;
    newPlayer.isGrounded = true;
    newPlayer.jumpsRemaining = constants.MAX_JUMPS_CONST;
  }

  // Ceiling collision
  if (
    newPlayer.ratioY <=
    -constants.MAX_RATIO_Y + constants.PLAYER_HEIGHT_RATIO
  ) {
    newPlayer.ratioY = -constants.MAX_RATIO_Y + constants.PLAYER_HEIGHT_RATIO;
    newPlayer.vy = 0;
  }

  // Wall collisions
  if (newPlayer.ratioX >= constants.MAX_RATIO_X) {
    newPlayer.ratioX = constants.MAX_RATIO_X;
    newPlayer.vx = 0;
  }
  if (newPlayer.ratioX <= -constants.MAX_RATIO_X) {
    newPlayer.ratioX = -constants.MAX_RATIO_X;
    newPlayer.vx = 0;
  }

  // Player drying
  if (newPlayer.wetnessLevel > 0) {
    newPlayer.wetnessLevel -= constants.PLAYER_DRYING_RATE_CONST * deltaTime;
    newPlayer.wetnessLevel = Math.max(0, newPlayer.wetnessLevel);
  }

  return newPlayer;
}

export function updateBalloons(
  balloons: GameObject[],
  deltaTime: number,
  constants: GameConstants
): GameObject[] {
  const updatedBalloons = balloons
    .map((balloon) => {
      const newBalloon = { ...balloon };
      // Apply gravity
      newBalloon.vy += constants.GRAVITY * deltaTime;
      // Apply terminal velocity (optional for balloons, but can prevent extreme speeds)
      newBalloon.vy = Math.min(
        newBalloon.vy,
        constants.TERMINAL_VELOCITY_CONST * 1.5
      ); // Balloons might fall faster

      // Update position
      newBalloon.x += newBalloon.vx * deltaTime;
      newBalloon.y += newBalloon.vy * deltaTime;

      // Boundary checks
      // Wall collisions (bounce)
      if (
        newBalloon.x + newBalloon.radius >= constants.MAX_RATIO_X ||
        newBalloon.x - newBalloon.radius <= -constants.MAX_RATIO_X
      ) {
        newBalloon.vx *= -0.8; // Invert and dampen velocity
        newBalloon.x = Math.max(
          -constants.MAX_RATIO_X + newBalloon.radius,
          Math.min(constants.MAX_RATIO_X - newBalloon.radius, newBalloon.x)
        );
      }
      // Ceiling collision (bounce)
      if (newBalloon.y - newBalloon.radius <= -constants.MAX_RATIO_Y) {
        newBalloon.vy *= -0.8; // Invert and dampen velocity
        newBalloon.y = -constants.MAX_RATIO_Y + newBalloon.radius;
      }

      // Ground collision (remove balloon) - check if it's past the ground + its radius
      if (newBalloon.y + newBalloon.radius >= constants.MAX_RATIO_Y) {
        return null; // Mark for removal
      }
      return newBalloon;
    })
    .filter((b) => b !== null) as GameObject[]; // Filter out removed balloons

  return updatedBalloons;
}

export function handleCollisions(
  currentPlayers: Player[],
  currentBalloons: GameObject[],
  currentGameSettings: GameSettings,
  currentPlayerPersistentStats: PlayerPersistentStats[],
  constants: GameConstants,
  teamInfoArray: TeamInfo[]
): {
  updatedPlayers: Player[];
  updatedBalloons: GameObject[];
  updatedGameSettings: GameSettings;
  updatedStats: PlayerPersistentStats[];
} {
  const players = currentPlayers.map((p) => ({ ...p }));
  let balloons = [...currentBalloons];
  const gameSettings = { ...currentGameSettings };
  const persistentStats = currentPlayerPersistentStats.map((s) => ({ ...s }));

  const balloonsToRemove: Set<string> = new Set();

  for (const balloon of balloons) {
    if (balloonsToRemove.has(balloon.id)) continue;

    for (const player of players) {
      // Simplified self-collision skip: if the player is the owner.
      // This might need refinement if players can interact with their own balloons in some way later.
      if (player.id === balloon.ownerId) {
        // continue; // Allowing self-hit for now, can be refined by game design.
      }

      // Player's hitbox center y is roughly player.ratioY - PLAYER_HEIGHT_RATIO / 2 + PLAYER_RADIUS_RATIO_Y
      // For simplicity, using player.ratioY as the center for now, can be refined.
      const playerEffectiveY = player.ratioY; // player.ratioY - constants.PLAYER_HEIGHT_RATIO / 2 + constants.PLAYER_RADIUS_RATIO_Y;
      const dx = player.ratioX - balloon.x;
      const dy = playerEffectiveY - balloon.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const collisionThreshold =
        constants.PLAYER_RADIUS_RATIO_X + balloon.radius; // Assuming PLAYER_RADIUS_RATIO_X is appropriate for width

      if (distance < collisionThreshold) {
        if (!gameSettings.friendlyFireEnabled && player.team === balloon.team) {
          continue;
        }

        balloonsToRemove.add(balloon.id);
        player.wetnessLevel += constants.WETNESS_PER_HIT * balloon.power;
        player.wetnessLevel = Math.min(
          constants.MAX_WETNESS,
          player.wetnessLevel
        );

        const ownerPlayer = currentPlayers.find(
          (p) => p.id === balloon.ownerId
        );
        const ownerStats = persistentStats.find(
          (s) => ownerPlayer && s.playerName === ownerPlayer.playerName
        );
        const hitPlayerStats = persistentStats.find(
          (s) => s.playerName === player.playerName
        );

        if (player.wetnessLevel >= constants.MAX_WETNESS) {
          const scoringTeam = ownerPlayer ? ownerPlayer.team : -1;

          if (
            scoringTeam !== -1 &&
            (player.team !== scoringTeam || gameSettings.friendlyFireEnabled)
          ) {
            // Ensure scoringTeam is a valid index for teamScores
            if (
              scoringTeam >= 0 &&
              scoringTeam < gameSettings.teamScores.length
            ) {
              gameSettings.teamScores[scoringTeam]++;
            }
            if (ownerStats) {
              ownerStats.conversions++;
            }
          }

          if (hitPlayerStats) {
            hitPlayerStats.deathsByConversion++;
          }

          const { ratioX, ratioY } = randomFloorPosition(constants);
          player.ratioX = ratioX;
          player.ratioY = ratioY;
          player.vx = 0;
          player.vy = 0;
          player.wetnessLevel = 0;
          player.isGrounded = true;
          player.jumpsRemaining = constants.MAX_JUMPS_CONST;

          if (
            !gameSettings.gameOver &&
            scoringTeam !== -1 &&
            scoringTeam >= 0 &&
            scoringTeam < gameSettings.teamScores.length && // Check again before accessing
            gameSettings.teamScores[scoringTeam] >= constants.POINTS_TO_WIN
          ) {
            gameSettings.gameOver = true;
            gameSettings.winningTeam = scoringTeam;
            // Ensure scoringTeam is a valid index for teamSessionWins
            if (
              scoringTeam >= 0 &&
              scoringTeam < gameSettings.teamSessionWins.length
            ) {
              gameSettings.teamSessionWins[scoringTeam]++;
            }

            players.forEach((p) => {
              if (p.team === gameSettings.winningTeam) {
                const pStats = persistentStats.find(
                  (s) => s.playerName === p.playerName
                );
                if (pStats) {
                  pStats.gamesWon++;
                }
              }
            });
          }
        }
        break; // Balloon is used up
      }
    }
  }

  const finalBalloons = balloons.filter((b) => !balloonsToRemove.has(b.id));

  return {
    updatedPlayers: players,
    updatedBalloons: finalBalloons,
    updatedGameSettings: gameSettings,
    updatedStats: persistentStats,
  };
}
