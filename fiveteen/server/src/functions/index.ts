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
    teamColor: teamHexColor, // Store base team color
    wetnessLevel: 0,
    wetnessColor: teamHexColor, // Use passed team color
    isGrounded: true,
    prevJump: false,
    jumpsRemaining: constants.MAX_JUMPS_CONST,
    prevTrigger: false,
    triggerStart: null,
    buttons: Array(16).fill(false),
    axes: Array(4).fill(0), // Initialize axes
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
  buttons: boolean[], // Button pressed states
  axes: number[],
  deltaTime: number,
  constants: GameConstants,
  newBalloonsLaunchedThisFrame: GameObject[] // Added for launching balloons
): Player {
  const newPlayer = { ...player };
  // Build a set of pressed button indices from boolean array
  const pressedSet = new Set<number>();
  buttons.forEach((pressed, idx) => {
    if (pressed) pressedSet.add(idx);
  });

  // Umbrella open on left trigger (button index 6)
  newPlayer.isUmbrellaOpen = pressedSet.has(6);

  // Jump logic on X button (button index 2)
  const jumpButtonPressed = pressedSet.has(2);
  if (
    jumpButtonPressed &&
    !newPlayer.prevJump &&
    newPlayer.jumpsRemaining > 0
  ) {
    newPlayer.vy = constants.JUMP_VELOCITY * constants.JUMP_MULTIPLIER;
    newPlayer.jumpsRemaining--;
    newPlayer.isGrounded = false;
  }
  newPlayer.prevJump = jumpButtonPressed;

  // Horizontal movement based on axes[0]
  const moveInput = axes[0] || 0;
  if (Math.abs(moveInput) > constants.DEAD_ZONE) {
    newPlayer.vx = (moveInput * constants.MOVE_SPEED) / constants.HALF_W;
  } else {
    newPlayer.vx = 0;
  }

  // Apply gravity
  newPlayer.vy += constants.GRAVITY * deltaTime;

  // Apply terminal velocity
  const currentTerminalVelocity = newPlayer.isUmbrellaOpen
    ? constants.UMBRELLA_TERMINAL_VELOCITY
    : constants.TERMINAL_VELOCITY_CONST;
  newPlayer.vy = Math.min(newPlayer.vy, currentTerminalVelocity);
  if (newPlayer.isUmbrellaOpen && newPlayer.vy < 0) {
    newPlayer.vy *= constants.UMBRELLA_GRAVITY_MULTIPLIER;
  }

  // Apply horizontal movement speed reduction if umbrella is open
  if (newPlayer.isUmbrellaOpen) {
    newPlayer.vx *= constants.UMBRELLA_HORIZONTAL_SPEED_MULTIPLIER;
  }

  // Update position
  newPlayer.ratioX += newPlayer.vx * deltaTime;
  newPlayer.ratioY += newPlayer.vy * deltaTime;

  // Floor collision
  if (
    newPlayer.ratioY >=
    constants.MAX_RATIO_Y - constants.PLAYER_HEIGHT_RATIO
  ) {
    newPlayer.ratioY = constants.MAX_RATIO_Y - constants.PLAYER_HEIGHT_RATIO;
    newPlayer.vy = 0;
    if (!newPlayer.isGrounded) {
      newPlayer.jumpsRemaining = constants.MAX_JUMPS_CONST;
    }
    newPlayer.isGrounded = true;
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

  // Throw balloon logic (right trigger button index 7) or B button (1)
  const throwButtonPressed = pressedSet.has(7) || pressedSet.has(1);
  // Start charging on trigger press
  if (throwButtonPressed && !newPlayer.prevTrigger) {
    newPlayer.triggerStart = Date.now();
  }
  // Release trigger to throw balloon with power based on charge time
  if (
    !throwButtonPressed &&
    newPlayer.prevTrigger &&
    newPlayer.triggerStart !== null
  ) {
    const holdTime = Date.now() - newPlayer.triggerStart;
    // Calculate normalized charge time (t)
    const normalizedChargeTime = Math.min(holdTime / constants.MAX_CHARGE_TIME, 1);
    // Apply quadratic ease-out function: t * (2 - t)
    const powerFactor = normalizedChargeTime * (2 - normalizedChargeTime);

    const aimMagnitude = Math.sqrt(
      newPlayer.aimX * newPlayer.aimX + newPlayer.aimY * newPlayer.aimY
    );
    // Determine throw direction (normalized) for velocity
    let throwDirX = 0;
    let throwDirY = -1;
    if (aimMagnitude > constants.DEAD_ZONE) {
      throwDirX = newPlayer.aimX / aimMagnitude;
      throwDirY = newPlayer.aimY / aimMagnitude;
    }
    // Scale offset to match client reticule positioning using raw aim axes
    const aimOffsetXScaled = constants.AIM_OFFSET_PX_CONST / constants.HALF_W;
    const aimOffsetYScaled = constants.AIM_OFFSET_PX_CONST / constants.HALF_H; // Corrected to use HALF_H for Y scaling
    // Use raw axis for placement so reticule and balloon share origin
    const offsetX = newPlayer.aimX;
    const offsetY = newPlayer.aimY;
    const balloonStartX = newPlayer.ratioX + offsetX * aimOffsetXScaled;
    const balloonStartY = newPlayer.ratioY + offsetY * aimOffsetYScaled;
    const newBalloon: GameObject = {
      id: `balloon_${newPlayer.id}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      ownerId: newPlayer.id,
      team: newPlayer.team,
      x: balloonStartX,
      y: balloonStartY,
      vx: throwDirX * constants.THROW_SPEED * powerFactor + newPlayer.vx, // Added player's horizontal velocity
      vy: throwDirY * constants.THROW_SPEED * powerFactor,
      radius: constants.BALLOON_RADIUS_RATIO,
      teamColor: newPlayer.teamColor,
      power: powerFactor,
    };
    newBalloonsLaunchedThisFrame.push(newBalloon);
  }
  // Reset trigger state
  newPlayer.prevTrigger = throwButtonPressed;
  if (!throwButtonPressed) {
    newPlayer.triggerStart = null;
  }

  // Update umbrella orientation: compute angle from aim vector when open
  if (newPlayer.isUmbrellaOpen) {
    if (newPlayer.aimX === 0 && newPlayer.aimY === 0) {
      // Default to pointing straight up if aim is neutral
      newPlayer.umbrellaAngle = -Math.PI / 2;
    } else {
      // Aim direction
      newPlayer.umbrellaAngle = Math.atan2(newPlayer.aimY, newPlayer.aimX);
    }
  } else {
    newPlayer.umbrellaAngle = constants.UMBRELLA_DEFAULT_ANGLE;
  }

  // Always send the updated player state before returning
  console.log(
    `[PHYSICS] Player ${
      newPlayer.playerName
    } updated: pos(${newPlayer.ratioX.toFixed(2)},${newPlayer.ratioY.toFixed(
      2
    )}), vel(${newPlayer.vx.toFixed(2)},${newPlayer.vy.toFixed(2)}), umbrella:${
      newPlayer.isUmbrellaOpen
    }, btns:${buttons.filter((b) => b).length}`
  );
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
    if (balloonsToRemove.has(balloon.id)) continue; // Balloon already handled in a previous interaction this frame

    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const playerCenterX = player.ratioX;
      // Calculate player center Y using half of the player's height
      const playerCenterY = player.ratioY + constants.PLAYER_HEIGHT_RATIO / 2;

      // --- Umbrella Collision Check ---
      if (player.isUmbrellaOpen) {
        // Skip blocking own balloons
        if (balloon.ownerId === player.id) continue;
        const dxUmbrella = balloon.x - playerCenterX;
        const dyUmbrella = balloon.y - playerCenterY;
        const distToPlayerCenter = Math.sqrt(
          dxUmbrella * dxUmbrella + dyUmbrella * dyUmbrella
        );

        // Use full umbrella reach multiplier
        const umbrellaEffectiveRadius =
          constants.BASE_UMBRELLA_DISTANCE_RATIO * constants.UMBRELLA_MAX_REACH_MULTIPLIER;

        if (
          distToPlayerCenter < umbrellaEffectiveRadius + balloon.radius &&
          distToPlayerCenter > constants.PLAYER_RADIUS_RATIO_X // Avoid blocking if balloon is inside player's body radius
        ) {
          const angleToBalloon = Math.atan2(dyUmbrella, dxUmbrella);
          let angularDiff = angleToBalloon - player.umbrellaAngle;
          while (angularDiff > Math.PI) angularDiff -= 2 * Math.PI;
          while (angularDiff < -Math.PI) angularDiff += 2 * Math.PI;

          if (Math.abs(angularDiff) < constants.UMBRELLA_SPREAD_ANGLE / 2) {
            balloonsToRemove.add(balloon.id);
            console.log(
              `[UMBRELLA BLOCK] Balloon ${balloon.id} blocked by player ${player.playerName}'s umbrella.`
            );
            break; // Balloon is handled (blocked), move to the next balloon
          }
        }
      }

      if (balloonsToRemove.has(balloon.id)) continue;

      // --- Player Body Collision Check (rectangle AABB) ---
      const halfWidth = constants.PLAYER_RADIUS_RATIO_X;
      const playerTop = player.ratioY;
      const playerBottom = player.ratioY + constants.PLAYER_HEIGHT_RATIO;
      // Check horizontal overlap
      const withinX =
        balloon.x + balloon.radius >= playerCenterX - halfWidth &&
        balloon.x - balloon.radius <= playerCenterX + halfWidth;
      // Check vertical overlap
      const withinY =
        balloon.y + balloon.radius >= playerTop &&
        balloon.y - balloon.radius <= playerBottom;
      if (withinX && withinY) {
        const sameTeam = player.team === balloon.team;
        if (sameTeam && !gameSettings.friendlyFireEnabled) {
          continue; // Friendly balloon, no effect if FF is off
        }

        balloonsToRemove.add(balloon.id);
        const damage = constants.WETNESS_PER_HIT * (balloon.power || 1);
        player.wetnessLevel = Math.min(constants.MAX_WETNESS, player.wetnessLevel + damage);

        if (!sameTeam) {
          player.wetnessColor = balloon.teamColor;
        }

        console.log(
          `[PLAYER HIT] ${player.playerName} (ID: ${player.id}) hit by balloon ${balloon.id}. Damage: ${damage.toFixed(2)}, Wetness: ${player.wetnessLevel.toFixed(2)}, Color: ${player.wetnessColor}`
        );

        // Scoring and Team Change Logic when wetness maxed
        if (player.wetnessLevel >= constants.MAX_WETNESS) {
          // Determine scoring for max wetness
          const ownerPlayer = currentPlayers.find((p) => p.id === balloon.ownerId);
          const ownerStats = persistentStats.find(
            (s) => ownerPlayer && s.playerName === ownerPlayer.playerName
          );
          const scoringTeam = ownerPlayer ? ownerPlayer.team : -1;
          if (
            scoringTeam !== -1 &&
            (player.team !== scoringTeam || gameSettings.friendlyFireEnabled)
          ) {
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
          // Change player's team to the balloon's team
          player.team = balloon.team;
          console.log(
            `[TEAM CHANGE] Player ${player.playerName} switched to team ${player.team}`
          );
          // Reset wetness without moving player
          player.wetnessLevel = 0;
          player.wetnessColor = '#FFFFFF'; // Reset wetness color to white
        }
        break; // Balloon handled, move to next balloon
      }
    }
  }

  // Remove marked balloons
  balloons = balloons.filter((b) => !balloonsToRemove.has(b.id));

  // Check for end of round: if all active players (>=2) are on the same team
  const activeTeams = new Set(players.map((p) => p.team));
  if (players.length >= 2 && activeTeams.size === 1) {
    const winningTeam = players[0].team;
    console.log(`[ROUND OVER] Team ${winningTeam} wins the round.`);
    gameSettings.gameOver = true;
    gameSettings.winningTeam = winningTeam;
    // Increment session wins for winning team
    if (
      gameSettings.teamSessionWins &&
      winningTeam >= 0 &&
      winningTeam < gameSettings.teamSessionWins.length
    ) {
      gameSettings.teamSessionWins[winningTeam]++;
    }
  }

  return {
    updatedPlayers: players,
    updatedBalloons: balloons,
    updatedGameSettings: gameSettings,
    updatedStats: persistentStats,
  };
}
