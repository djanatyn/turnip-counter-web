import {decode} from "/-/@shelacek/ubjson@v1.1.1-WuAw0ADjDhdVdhldnNOT/dist=es2019,mode=imports/optimized/@shelacek/ubjson.js";
const allVersions = "0.0.0.0";
class Game {
  constructor(fileBuffer) {
    this.frames = [];
    const baseJson = decode(fileBuffer, {useTypedArrays: true});
    this.metadata = baseJson.metadata;
    this.raw = new DataView(baseJson.raw.buffer, baseJson.raw.byteOffset, baseJson.raw.byteLength);
    let commandPayloadSizes = this.parseEventPayloadsEvent(0);
    this.gameStart = this.parseGameStartEvent(1 + commandPayloadSizes[53]);
    this.formatVersion = this.gameStart.replayFormatVersion;
    let offset = 0 + commandPayloadSizes[53] + 1 + commandPayloadSizes[54] + 1;
    while (offset < this.raw.byteLength) {
      const command = this.getUint(8, allVersions, offset);
      let event;
      switch (command) {
        case 55:
          event = this.parsePreFrameUpdateEvent(offset);
          this.initFrameIfNeeded(event.frameNumber);
          this.initPlayerIfNeeded(event.frameNumber, event.playerIndex);
          this.frames[event.frameNumber].players[event.playerIndex].pre.push(event);
          break;
        case 56:
          event = this.parsePostFrameUpdateEvent(offset);
          this.frames[event.frameNumber].players[event.playerIndex].post.push(event);
          break;
        case 57:
          this.gameEnd = this.parseGameEndEvent(offset);
          break;
        case 58:
          event = this.parseFrameStartEvent(offset);
          this.initFrameIfNeeded(event.frameNumber);
          this.frames[event.frameNumber].start = event;
          break;
        case 59:
          event = this.parseItemUpdateEvent(offset);
          this.frames[event.frameNumber].items.push(event);
          break;
        case 60:
          event = this.parseFrameBookendEvent(offset);
          this.frames[event.frameNumber].end = event;
          break;
      }
      offset = offset + commandPayloadSizes[command] + 1;
    }
  }
  initFrameIfNeeded(frameNumber) {
    if (!this.frames[frameNumber]) {
      this.frames[frameNumber] = {
        frameNumber,
        start: void 0,
        end: void 0,
        players: [],
        items: []
      };
    }
  }
  initPlayerIfNeeded(frameNumber, playerIndex) {
    if (!this.frames[frameNumber].players[playerIndex]) {
      this.frames[frameNumber].players[playerIndex] = {
        pre: [],
        post: []
      };
    }
  }
  parseEventPayloadsEvent(offset) {
    const commandByte = this.getUint(8, allVersions, offset + 0);
    const commandPayloadSizes = {};
    const eventPayloadsPayloadSize = this.getUint(8, allVersions, offset + 1);
    commandPayloadSizes[commandByte] = eventPayloadsPayloadSize;
    const listOffset = offset + 2;
    for (let i = listOffset; i < eventPayloadsPayloadSize + listOffset - 1; i += 3) {
      const commandByte2 = this.getUint(8, allVersions, i + 0);
      const payloadSize = this.getUint(16, allVersions, i + 1);
      commandPayloadSizes[commandByte2] = payloadSize;
    }
    return commandPayloadSizes;
  }
  parseGameStartEvent(offset) {
    const event = {
      isTeams: Boolean(this.getUint(8, allVersions, offset + 13)),
      playerSettings: [],
      replayFormatVersion: [
        this.getUint(8, allVersions, offset + 1),
        this.getUint(8, allVersions, offset + 2),
        this.getUint(8, allVersions, offset + 3),
        this.getUint(8, allVersions, offset + 4)
      ].join("."),
      stageId: this.getUint(16, allVersions, offset + 19)
    };
    for (let playerIndex = 0; playerIndex < 4; playerIndex++) {
      const playerType = this.getUint(8, allVersions, offset + 102 + 36 * playerIndex);
      if (playerType === 3)
        continue;
      const dashbackFix = this.getUint(32, allVersions, offset + 321 + 8 * playerIndex);
      const shieldDropFix = this.getUint(32, allVersions, offset + 325 + 8 * playerIndex);
      event.playerSettings[playerIndex] = {
        playerIndex,
        port: playerIndex + 1,
        externalCharacterId: this.getUint(8, allVersions, offset + 101 + 36 * playerIndex),
        playerType,
        startStocks: this.getUint(8, allVersions, offset + 103 + 36 * playerIndex),
        costumeIndex: this.getUint(8, allVersions, offset + 104 + 36 * playerIndex),
        teamShade: this.getUint(8, allVersions, offset + 108 + 36 * playerIndex),
        handicap: this.getUint(8, allVersions, offset + 109 + 36 * playerIndex),
        teamId: this.getUint(8, allVersions, offset + 110 + 36 * playerIndex),
        playerBitfield: this.getUint(8, allVersions, offset + 113 + 36 * playerIndex),
        cpuLevel: this.getUint(8, allVersions, offset + 116 + 36 * playerIndex),
        offenseRatio: this.getFloat(32, allVersions, offset + 125 + 36 * playerIndex),
        defenseRatio: this.getFloat(32, allVersions, offset + 129 + 36 * playerIndex),
        modelScale: this.getFloat(32, allVersions, offset + 133 + 36 * playerIndex),
        controllerFix: dashbackFix === shieldDropFix ? dashbackFix === 1 ? "UCF" : dashbackFix === 2 ? "Dween" : "None" : "Mixed",
        nametag: this.readShiftJisString("1.3.0.0", offset + 353 + 16 * playerIndex, 9),
        displayName: this.readShiftJisString("3.9.0.0", offset + 421 + 31 * playerIndex, 16),
        connectCode: this.readShiftJisString("3.9.0.0", offset + 545 + 10 * playerIndex, 10)
      };
    }
    return event;
  }
  parseFrameStartEvent(offset) {
    return {
      frameNumber: this.getInt(32, "2.2.0.0", offset + 1),
      randomSeed: this.getUint(32, "2.2.0.0", offset + 5)
    };
  }
  parsePreFrameUpdateEvent(offset) {
    return {
      frameNumber: this.getInt(32, "0.1.0.0", offset + 1),
      playerIndex: this.getUint(8, "0.1.0.0", offset + 5),
      isFollower: Boolean(this.getUint(8, "0.1.0.0", offset + 6)),
      actionStateId: this.getUint(16, "0.1.0.0", offset + 11),
      xPosition: this.getFloat(32, "0.1.0.0", offset + 13),
      yPosition: this.getFloat(32, "0.1.0.0", offset + 17),
      facingDirection: this.getFloat(32, "0.1.0.0", offset + 21),
      joystickX: this.getFloat(32, "0.1.0.0", offset + 25),
      joystickY: this.getFloat(32, "0.1.0.0", offset + 29),
      cStickX: this.getFloat(32, "0.1.0.0", offset + 33),
      cStickY: this.getFloat(32, "0.1.0.0", offset + 37),
      trigger: this.getFloat(32, "0.1.0.0", offset + 41),
      processedButtons: this.getUint(32, "0.1.0.0", offset + 45),
      physicalButtons: this.getUint(16, "0.1.0.0", offset + 49),
      physicalLTrigger: this.getFloat(32, "0.1.0.0", offset + 51),
      physicalRTrigger: this.getFloat(32, "0.1.0.0", offset + 55),
      percent: this.getFloat(32, "1.4.0.0", offset + 60)
    };
  }
  parsePostFrameUpdateEvent(offset) {
    return {
      frameNumber: this.getInt(32, "0.1.0.0", offset + 1),
      playerIndex: this.getUint(8, "0.1.0.0", offset + 5),
      isFollower: Boolean(this.getUint(8, "0.1.0.0", offset + 6)),
      internalCharacterId: this.getUint(8, "0.1.0.0", offset + 7),
      actionStateId: this.getUint(16, "0.1.0.0", offset + 8),
      xPosition: this.getFloat(32, "0.1.0.0", offset + 10),
      yPosition: this.getFloat(32, "0.1.0.0", offset + 14),
      facingDirection: this.getFloat(32, "0.1.0.0", offset + 18),
      percent: this.getFloat(32, "0.1.0.0", offset + 22),
      shieldSize: this.getFloat(32, "0.1.0.0", offset + 26),
      lastHittingAttackId: this.getUint(8, "0.1.0.0", offset + 30),
      currentComboCount: this.getUint(8, "0.1.0.0", offset + 31),
      lastHitBy: this.getUint(8, "0.1.0.0", offset + 32),
      stocksRemaining: this.getUint(8, "0.1.0.0", offset + 33),
      actionStateFrameCounter: this.getFloat(32, "0.2.0.0", offset + 34),
      isGrounded: !Boolean(this.getUint(8, "2.0.0.0", offset + 47)),
      lastGroundId: this.getUint(8, "2.0.0.0", offset + 48),
      jumpsRemaining: this.getUint(8, "2.0.0.0", offset + 50),
      lCancelStatus: this.getUint(8, "2.0.0.0", offset + 51),
      hurtboxCollisionState: this.getUint(8, "2.1.0.0", offset + 52),
      selfInducedAirXSpeed: this.getFloat(32, "3.5.0.0", offset + 53),
      selfInducedAirYSpeed: this.getFloat(32, "3.5.0.0", offset + 57),
      attackBasedXSpeed: this.getFloat(32, "3.5.0.0", offset + 61),
      attackBasedYSpeed: this.getFloat(32, "3.5.0.0", offset + 65),
      selfInducedGroundXSpeed: this.getFloat(32, "3.5.0.0", offset + 69),
      hitlagRemaining: this.getFloat(32, "3.8.0.0", offset + 73)
    };
  }
  parseItemUpdateEvent(offset) {
    return {
      frameNumber: this.getInt(32, "3.0.0.0", offset + 1),
      typeId: this.getUint(16, "3.0.0.0", offset + 5),
      state: this.getUint(8, "3.0.0.0", offset + 7),
      facingDirection: this.getFloat(32, "3.0.0.0", offset + 8),
      xVelocity: this.getFloat(32, "3.0.0.0", offset + 12),
      yVelocity: this.getFloat(32, "3.0.0.0", offset + 16),
      xPosition: this.getFloat(32, "3.0.0.0", offset + 20),
      yPosition: this.getFloat(32, "3.0.0.0", offset + 24),
      damageTaken: this.getUint(16, "3.0.0.0", offset + 28),
      expirationTimer: this.getFloat(32, "3.0.0.0", offset + 30),
      spawnId: this.getUint(32, "3.0.0.0", offset + 34),
      samusMissileType: this.getUint(8, "3.2.0.0", offset + 38),
      peachTurnipFace: this.getUint(8, "3.2.0.0", offset + 39),
      owner: this.getInt(8, "3.6.0.0", offset + 42)
    };
  }
  parseFrameBookendEvent(offset) {
    return {
      frameNumber: this.getInt(32, "3.0.0.0", offset + 1),
      latestFinalizedFrame: this.getInt(32, "3.7.0.0", offset + 5)
    };
  }
  parseGameEndEvent(offset) {
    return {
      gameEndMethod: this.getUint(8, "0.1.0.0", offset + 1),
      quitInitiator: this.getInt(8, "2.0.0.0", offset + 2)
    };
  }
  getUint(size, firstVersion, offset) {
    if ([this.formatVersion, firstVersion].sort()[0] !== firstVersion) {
      return void 0;
    }
    switch (size) {
      case 8:
        return this.raw.getUint8(offset);
      case 16:
        return this.raw.getUint16(offset);
      case 32:
        return this.raw.getUint32(offset);
    }
  }
  getFloat(size, firstVersion, offset) {
    if ([this.formatVersion, firstVersion].sort()[0] !== firstVersion) {
      return void 0;
    }
    switch (size) {
      case 32:
        return this.raw.getFloat32(offset);
      case 64:
        return this.raw.getFloat64(offset);
    }
  }
  getInt(size, firstVersion, offset) {
    if ([this.formatVersion, firstVersion].sort()[0] !== firstVersion) {
      return void 0;
    }
    switch (size) {
      case 8:
        return this.raw.getInt8(offset);
      case 16:
        return this.raw.getInt16(offset);
      case 32:
        return this.raw.getInt32(offset);
    }
  }
  readShiftJisString(firstVersion, offset, maxLength) {
    if ([this.formatVersion, firstVersion].sort()[0] !== firstVersion) {
      return void 0;
    }
    const shiftJisBytes = new Uint8Array(maxLength);
    let charNum = 0;
    do {
      shiftJisBytes[charNum] = this.raw.getUint8(offset + charNum * 1);
      charNum++;
    } while (charNum < maxLength && shiftJisBytes[charNum - 1] !== 0);
    if (shiftJisBytes[0] !== 0) {
      const decoder = new TextDecoder("shift-jis");
      return decoder.decode(shiftJisBytes.subarray(0, charNum - 1)).replaceAll("\uFF03", "#");
    }
    return "";
  }
}
export {Game};
export default null;
