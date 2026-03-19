import { GameConfig } from '../config/GameConfig.ts';
import { GamePhase, Position, Team, Unit, MapData } from '../core/Types.ts';
import { GameMap } from '../map/GameMap.ts';
import { MapRenderer } from '../map/MapRenderer.ts';
import { UnitManager } from '../units/UnitManager.ts';
import { UnitRenderer } from '../render/UnitRenderer.ts';
import { Camera } from '../render/Camera.ts';
import { Cursor } from '../input/Cursor.ts';
import { UnitMenu, MenuOption } from '../ui/UnitMenu.ts';
import { HUD } from '../ui/HUD.ts';
import { ShopMenu } from '../ui/ShopMenu.ts';
import { MainMenu } from '../ui/MainMenu.ts';
import { BattleResultScreen } from '../ui/BattleResultScreen.ts';
import { EnemyInfoPanel } from '../ui/EnemyInfoPanel.ts';
import { CombatLog } from '../ui/CombatLog.ts';
import { HighScoreScreen } from '../ui/HighScoreScreen.ts';
import { EconomySystem } from '../economy/EconomySystem.ts';
import { createUnit, resetUnitIdCounter } from '../factory/UnitFactory.ts';
import { MapGenerator } from '../map/MapGenerator.ts';
import { getReachableTiles, findPath, getAttackableTiles } from '../systems/Pathfinding.ts';
import { executeCombat, executeAbility } from '../systems/CombatSystem.ts';
import { grantAttackXP, grantKillXP, canLevelUp, applyLevelUp } from '../systems/ExperienceSystem.ts';
import { computeAIActions, AIAction } from '../systems/AISystem.ts';
import { NotificationRenderer } from '../ui/NotificationRenderer.ts';
import { SoundManager } from '../audio/SoundManager.ts';
import { ChallengeSelectScreen } from '../ui/ChallengeSelectScreen.ts';
import { ChallengeSystem, CHALLENGES } from '../systems/ChallengeSystem.ts';
import { rollDice } from '../systems/DiceSystem.ts';
import { getAbilityData } from '../database/AbilityDatabase.ts';
import { BattleManager } from '../systems/BattleManager.ts';
import { EnemyArmyGenerator } from '../systems/EnemyArmyGenerator.ts';
import { SpawnSystem } from '../systems/SpawnSystem.ts';
import { saveGame, loadGame, clearSave } from '../save/SaveSystem.ts';
import { addHighScore } from '../save/HighScoreSystem.ts';

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private map: GameMap | undefined;
  private mapData: MapData | undefined;
  private unitManager: UnitManager = new UnitManager();
  private economy: EconomySystem = new EconomySystem();
  private battleManager: BattleManager = new BattleManager();
  private camera: Camera = new Camera();
  private cursor: Cursor = new Cursor();
  private mapRenderer: MapRenderer;
  private unitRenderer: UnitRenderer;
  private unitMenu: UnitMenu = new UnitMenu();
  private hud: HUD;
  private shopMenu: ShopMenu = new ShopMenu();
  private mainMenu: MainMenu = new MainMenu();
  private battleResult: BattleResultScreen = new BattleResultScreen();
  private enemyInfoPanel: EnemyInfoPanel = new EnemyInfoPanel();
  private combatLog: CombatLog = new CombatLog();
  private highScoreScreen: HighScoreScreen = new HighScoreScreen();
  private challengeSelectScreen: ChallengeSelectScreen = new ChallengeSelectScreen();
  private notificationRenderer: NotificationRenderer = new NotificationRenderer();

  private phase: GamePhase = GamePhase.MAIN_MENU;
  private isPostMoveAction: boolean = false;
  private turnNumber: number = 1;
  private selectedUnit: Unit | null = null;
  private selectedAbilityId: string | null = null;
  private reachableTiles: Position[] = [];
  private attackableTiles: Position[] = [];
  private pathPreview: Position[] = [];
  private enemiesDefeatedThisBattle: number = 0;
  private initialEnemyCount: number = 0;
  private isChallengeMode: boolean = false;

  // Deployment
  private deployableTiles: Position[] = [];
  private unitsToPlace: Unit[] = [];
  private deployIndex: number = 0;

  // Empty tile menu
  private emptyTileMenuOptions: string[] = ['End Turn', 'Save Game', 'Load Game', 'Exit'];
  private emptyTileMenuIndex: number = 0;

  // AI
  private aiActions: AIAction[] = [];
  private aiActionIndex: number = 0;
  private aiTimer: number = 0;
  private aiMoving: boolean = false;
  private aiMovePathIndex: number = 0;
  private aiWaitingToAttack: boolean = false;

  // Animation
  private movePath: Position[] = [];
  private movePathIndex: number = 0;
  private moveTimer: number = 0;
  private combatAnimTimer: number = 0;
  private soundVolume: number = 50;
  private pendingCombatAttacker: Unit | null = null;
  private pendingCombatDefender: Unit | null = null;
  private damagePopups: { x: number; y: number; text: string; timer: number; color: string }[] = [];
  private inputCooldown: number = 0;
  private lastTime: number = 0;
  private currentChallengeId: string = '';

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    canvas.width = GameConfig.CANVAS_WIDTH;
    canvas.height = GameConfig.CANVAS_HEIGHT;
    this.ctx = canvas.getContext('2d')!;
    this.mapRenderer = new MapRenderer(this.ctx);
    this.unitRenderer = new UnitRenderer(this.ctx);
    this.hud = new HUD(this.ctx);
    this.unitManager = new UnitManager();
    this.camera = new Camera();
    this.cursor = new Cursor();
    this.economy = new EconomySystem();
    this.battleManager = new BattleManager();
    this.shopMenu = new ShopMenu();
    this.unitMenu = new UnitMenu();
    this.mainMenu = new MainMenu();
    this.battleResult = new BattleResultScreen();
    this.notificationRenderer = new NotificationRenderer();
    this.highScoreScreen = new HighScoreScreen();
    this.challengeSelectScreen = new ChallengeSelectScreen();
    this.setupInput();
  }

  async loadMap(url: string, challengeId: string = ''): Promise<void> {
    const resp = await fetch(url);
    const data: MapData = await resp.json();
    this.currentChallengeId = challengeId;
    this.mapData = data;
    
    if (this.isChallengeMode) {
      this.map = new GameMap(data);
      this.economy = new EconomySystem(1000);
      this.phase = GamePhase.SHOP;
      this.shopMenu.open();
      this.shopMenu.enablePurchase();
    } else {
      this.initMapData(data);
    }
  }

  private initMapData(data: MapData): void {
    this.map = new GameMap(data);
    this.mapData = data;
    this.startDeployment();
  }

  private startDeployment(): void {
    if (!this.map) return;
    const playerUnits = this.unitManager.getTeamUnits(Team.PLAYER);
    
    // Remove player units from map temporarily (they'll be placed during deployment)
    this.unitsToPlace = [...playerUnits];
    for (const u of this.unitsToPlace) {
      u.position = { x: -1, y: -1 };
      u.animX = -1;
      u.animY = -1;
    }
    
    // Clear enemies from previous battle
    const enemies = this.unitManager.getTeamUnits(Team.ENEMY);
    for (const e of enemies) this.unitManager.removeUnit(e.id);

    // Setup deployment rules
    const deployMaxX = Math.min(this.map.width, 5) - 1;

    // Generate enemies
    if (!this.isChallengeMode) {
      const enemyTemplates = EnemyArmyGenerator.generateArmy(this.battleManager.enemyGoldBudget);
      const enemySpawns = SpawnSystem.getEnemySpawnPositions(this.map, enemyTemplates.length, [], deployMaxX);
      for (let i = 0; i < enemyTemplates.length; i++) {
        const spawn = enemySpawns[i];
        if (!spawn) continue;
        const enemy = createUnit(enemyTemplates[i].id, Team.ENEMY, spawn);
        this.unitManager.addUnit(enemy);
      }
    } else if (this.mapData?.enemyUnits) {
       for (const eu of this.mapData.enemyUnits) {
          const enemy = createUnit(eu.id, Team.ENEMY, eu.position);
          this.unitManager.addUnit(enemy);
       }
    }

    this.initialEnemyCount = this.unitManager.getTeamUnits(Team.ENEMY).length;
    this.enemiesDefeatedThisBattle = 0;

    // Setup deployment tiles (left side of map)
    this.deployableTiles = [];
    for (let y = 0; y < Math.min(this.map.height, 6); y++) {
      for (let x = 0; x <= deployMaxX; x++) {
        if (this.map.isPassable(x, y) && !this.unitManager.isOccupied(x, y)) {
          this.deployableTiles.push({ x, y });
        }
      }
    }

    this.deployIndex = 0;

    this.cursor.setPosition(this.deployableTiles[0]?.x || 0, this.deployableTiles[0]?.y || 0);
    this.camera.follow(this.cursor.x, this.cursor.y, this.map.width, this.map.height);
    this.phase = GamePhase.DEPLOYMENT;
    this.hud.showPhaseBanner('DEPLOY UNITS');
  }

  private finishDeployment(): void {
    if (!this.map) return;
    this.deployableTiles = [];
    this.unitsToPlace = [];
    this.turnNumber = 1;
    this.phase = GamePhase.PLAYER_TURN;
    this.isPostMoveAction = false;

    // Disable shop purchasing during battle
    this.shopMenu.disablePurchase();

    if (this.isChallengeMode) {
       this.hud.showPhaseBanner('CHALLENGE START');
       this.combatLog.addMessage(`Challenge Selected!`);
    } else {
       this.hud.showPhaseBanner(`BATTLE ${this.battleManager.currentBattleNumber}`);
       this.combatLog.addMessage(`Battle ${this.battleManager.currentBattleNumber} Start!`);
    }
    SoundManager.getInstance().playRandomBattleMusic();
  }

  private generateNewMap(): void {
    const mapData = MapGenerator.generate();
    this.initMapData(mapData);
  }

  startMainMenu(): void {
    SoundManager.getInstance().stopMusic();
    this.phase = GamePhase.MAIN_MENU;
    this.mainMenu.reset();
    this.isChallengeMode = false;
    this.start();
  }

  startNewCampaign(): void {
    clearSave();
    this.unitManager = new UnitManager();
    resetUnitIdCounter();
    this.economy = new EconomySystem(GameConfig.STARTING_GOLD);
    this.battleManager = new BattleManager();
    this.isChallengeMode = false;
    this.phase = GamePhase.SHOP;
    this.shopMenu.open();
    if (!this.lastTime) this.start();
  }

  private continueSavedGame(): void {
    const data = loadGame();
    if (!data) { this.startNewCampaign(); return; }
    this.unitManager = new UnitManager();
    resetUnitIdCounter();
    for (const u of data.playerUnits) { u.hasActed = false; u.hasMoved = false; this.unitManager.addUnit(u); }
    for (const u of data.enemyUnits) { u.hasActed = false; u.hasMoved = false; this.unitManager.addUnit(u); }
    this.economy = new EconomySystem(data.gold);
    this.battleManager = new BattleManager();
    this.battleManager.currentBattleNumber = data.battleNumber || 1;
    this.battleManager.enemyGoldBudget = data.enemyGoldBudget || 300;
    this.turnNumber = data.turnNumber || 1;
    if (data.mapData) {
      this.map = new GameMap(data.mapData);
      this.mapData = data.mapData;
      this.phase = GamePhase.PLAYER_TURN;
      this.shopMenu.showPanel();
      this.shopMenu.disablePurchase();
      const p = this.unitManager.getTeamUnits(Team.PLAYER)[0];
      if (p) this.cursor.setPosition(p.position.x, p.position.y);
    } else {
      this.phase = GamePhase.SHOP;
      this.shopMenu.open();
    }
    if (!this.lastTime) this.start();
  }

  private start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private gameLoop(time: number): void {
    const dt = time - this.lastTime;
    this.lastTime = time;
    this.update(dt, time);
    this.render(time);
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  private update(dt: number, time: number): void {
    if (this.inputCooldown > 0) this.inputCooldown -= dt;
    this.cursor.update(dt);
    this.hud.update(dt);
    this.shopMenu.update(dt);
    this.combatLog.update(time);
    this.notificationRenderer.update(dt);
    this.updateDamagePopups(dt);
    this.updateDeathAnimations(dt);
    this.updateUnitOffsets(dt);
    if (this.phase === GamePhase.ANIMATION) this.updateMoveAnimation(dt);
    if (this.phase === GamePhase.COMBAT_ANIMATION) this.updateCombatAnimation(dt);
    if (this.phase === GamePhase.ENEMY_TURN) this.updateAITurn(dt);
  }
// Game.ts Part 2 - Animation, Combat, AI, Input handlers

  // â”€â”€â”€ Move Animation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  private updateMoveAnimation(dt: number): void {
    if (!this.selectedUnit || this.movePath.length === 0) return;
    this.moveTimer += dt;
    const moveInterval = 1000 / GameConfig.MOVE_SPEED;
    if (this.moveTimer >= moveInterval) {
      this.moveTimer = 0;
      this.movePathIndex++;
      if (this.movePathIndex >= this.movePath.length) {
        const dest = this.movePath[this.movePath.length - 1];
        this.selectedUnit.position = { ...dest };
        this.selectedUnit.animX = dest.x;
        this.selectedUnit.animY = dest.y;
        this.selectedUnit.isMoving = false;
        this.selectedUnit.hasMoved = true;
        this.movePath = [];
        this.movePathIndex = 0;
        this.isPostMoveAction = true;
        this.unitMenu.open(this.selectedUnit);
        this.unitMenu.options = ['Attack', 'Wait'];
        if (this.selectedUnit.abilities.length > 0) {
          const abilityId = this.selectedUnit.abilities[0];
          const ability = getAbilityData(abilityId);
          if (ability && this.selectedUnit.currentMP >= ability.mpCost) {
            this.unitMenu.options.splice(1, 0, 'Ability');
          }
        }
        this.phase = GamePhase.MENU_OPEN;
      } else {
        const pos = this.movePath[this.movePathIndex];
        this.selectedUnit.animX = pos.x;
        this.selectedUnit.animY = pos.y;
      }
    }
  }

  private showAttackRange(): void {
    if (!this.selectedUnit || !this.map) return;
    const attackTiles = getAttackableTiles(this.selectedUnit.position.x, this.selectedUnit.position.y, this.selectedUnit.attackRange, this.map);
    this.attackableTiles = attackTiles.filter((t) => { const u = this.unitManager.getUnitAt(t); return u && u.team !== this.selectedUnit!.team; });
    if (this.attackableTiles.length > 0) {
      SoundManager.getInstance().playSound('select');
      this.phase = GamePhase.SELECTING_ATTACK_TARGET;
      this.cursor.setPosition(this.attackableTiles[0].x, this.attackableTiles[0].y);
    } else {
      SoundManager.getInstance().playSound('cannot select');
      this.attackableTiles = [];
      this.unitMenu.open(this.selectedUnit);
      this.phase = GamePhase.MENU_OPEN;
    }
  }

  private showAbilityRange(): void {
    if (!this.selectedUnit || !this.selectedAbilityId || !this.map) return;
    const ability = getAbilityData(this.selectedAbilityId);
    if (!ability) return;
    const tiles = getAttackableTiles(this.selectedUnit.position.x, this.selectedUnit.position.y, ability.range, this.map);
    this.attackableTiles = tiles.filter((t) => {
      const u = this.unitManager.getUnitAt(t);
      if (!u) return false;
      if (ability.type === 'attack' && u.team !== this.selectedUnit!.team) return true;
      if (ability.type === 'heal' && u.team === this.selectedUnit!.team) return true;
      return false;
    });
    if (this.attackableTiles.length > 0) {
      SoundManager.getInstance().playSound('select');
      this.phase = GamePhase.SELECTING_ABILITY_TARGET;
      this.cursor.setPosition(this.attackableTiles[0].x, this.attackableTiles[0].y);
    } else {
      SoundManager.getInstance().playSound('cannot select');
      this.attackableTiles = [];
      this.selectedAbilityId = null;
      this.unitMenu.open(this.selectedUnit);
      this.phase = GamePhase.MENU_OPEN;
    }
  }

  private updateCombatAnimation(dt: number): void {
    this.combatAnimTimer -= dt;
    if (this.combatAnimTimer <= 0) {
      if (this.pendingCombatAttacker && this.pendingCombatDefender) {
        this.finalizeCombat(this.pendingCombatAttacker, this.pendingCombatDefender);
      }
      this.pendingCombatAttacker = null;
      this.pendingCombatDefender = null;
      if (this.phase === GamePhase.COMBAT_ANIMATION) {
        this.phase = GamePhase.PLAYER_TURN;
        this.checkWinLose();
        this.checkTurnEnd();
      }
    }
  }

  private startCombat(attacker: Unit, defender: Unit): void {
    this.pendingCombatAttacker = attacker;
    this.pendingCombatDefender = defender;
    attacker.flashTimer = 0.3;
    defender.flashTimer = 0.3;
    this.combatAnimTimer = 500;
    this.phase = GamePhase.COMBAT_ANIMATION;
  }

  private finalizeCombat(attacker: Unit, defender: Unit): void {
    const result = executeCombat(attacker, defender, this.map!);
    this.damagePopups.push({ x: defender.position.x, y: defender.position.y, text: result.damage > 0 ? `-${result.damage}` : 'MISS', timer: 1.2, color: result.damage > 0 ? '#FF4444' : '#AAAAAA' });
    if (result.isHit) {
      SoundManager.getInstance().playSound('hit');
      defender.flashTimer = 0.3;
      const dx = defender.position.x - attacker.position.x;
      const dy = defender.position.y - attacker.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      defender.offsetX = (dx / dist) * 12;
      defender.offsetY = (dy / dist) * 12;
    } else {
      SoundManager.getInstance().playSound('dodge');
      const dx = defender.position.x - attacker.position.x;
      const dy = defender.position.y - attacker.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      defender.offsetX = (dx / dist) * -12 + (Math.random() > 0.5 ? 8 : -8);
      defender.offsetY = (dy / dist) * -12 + (Math.random() > 0.5 ? 8 : -8);
    }
    if (result.isCrit) this.combatLog.addMessage(`${attacker.name} rolled 20 -> Critical Hit!`);
    else if (result.isCritFail) this.combatLog.addMessage(`${attacker.name} rolled 1 -> Critical Fail`);
    else { const hitText = result.isHit ? 'Hit' : 'Miss'; this.combatLog.addMessage(`${attacker.name} rolled ${result.attackRoll} vs CA ${result.targetAC} -> ${hitText}`); }
    if (result.isHit) this.combatLog.addMessage(`${attacker.name} dealt ${result.damage} damage`);
    grantAttackXP(attacker);
    if (result.defenderDied) {
      grantKillXP(attacker);
      defender.isDying = true;
      if (defender.team === Team.ENEMY) { this.combatLog.addMessage(`Enemy ${defender.name} was defeated`); this.enemiesDefeatedThisBattle++; }
      else this.combatLog.addMessage(`Ally ${defender.name} fell in combat`);
    }
    if (canLevelUp(attacker)) {
      applyLevelUp(attacker);
      this.combatLog.addMessage(`${attacker.name} leveled up to Lv ${attacker.level}!`);
      this.damagePopups.push({ x: attacker.position.x, y: attacker.position.y, text: 'LV UP!', timer: 2, color: '#FFD700' });
    }
    attacker.hasActed = true;
    attacker.flashTimer = 0;
    defender.flashTimer = 0;
  }

  private finalizeAbility(attacker: Unit, defender: Unit, abilityId: string): void {
    const ability = getAbilityData(abilityId);
    if (!ability) return;
    const result = executeAbility(attacker, defender, abilityId, this.map!);
    this.notificationRenderer.show(`${attacker.name} used ${ability.name}`);
    this.combatLog.addMessage(`${attacker.name} used ${ability.name}`);
    SoundManager.getInstance().playSound('ability');
    if (ability.type === 'attack') {
      for (let i = 0; i < result.combatResults.length; i++) {
        const combatRes = result.combatResults[i];
        const dmg = combatRes.damage;
        setTimeout(() => {
          this.damagePopups.push({ x: defender.position.x, y: defender.position.y, text: dmg > 0 ? `-${dmg}` : 'MISS', timer: 1.2, color: dmg > 0 ? '#FF4444' : '#AAAAAA' });
          if (combatRes.isHit) { this.combatLog.addMessage(`Hit ${i + 1}: ${dmg} damage`); SoundManager.getInstance().playSound('hit'); defender.flashTimer = 0.3; }
          else { this.combatLog.addMessage(`Hit ${i + 1}: Miss`); SoundManager.getInstance().playSound('dodge'); }
        }, i * 300);
      }
      grantAttackXP(attacker);
      if (result.targetDied) {
        grantKillXP(attacker);
        defender.isDying = true;
        if (defender.team === Team.ENEMY) { this.combatLog.addMessage(`Enemy ${defender.name} was defeated`); this.enemiesDefeatedThisBattle++; }
        else this.combatLog.addMessage(`Ally ${defender.name} fell in combat`);
      }
    } else if (ability.type === 'heal') {
      this.damagePopups.push({ x: defender.position.x, y: defender.position.y, text: `+${result.healed}`, timer: 1.5, color: '#44FF44' });
      this.combatLog.addMessage(`${defender.name} recovered ${result.healed} HP`);
      grantAttackXP(attacker);
    }
    if (canLevelUp(attacker)) {
      applyLevelUp(attacker);
      this.combatLog.addMessage(`${attacker.name} leveled up to Lv ${attacker.level}!`);
      this.damagePopups.push({ x: attacker.position.x, y: attacker.position.y, text: 'LV UP!', timer: 2, color: '#FFD700' });
    }
    attacker.hasActed = true;
    attacker.flashTimer = 0;
    defender.flashTimer = 0;
    this.phase = GamePhase.PLAYER_TURN;
    this.checkWinLose();
    this.checkTurnEnd();
  }

  private updateDeathAnimations(dt: number): void {
    const dying = this.unitManager.units.filter((u) => u.isDying);
    for (const unit of dying) { unit.deathAlpha -= dt / 800; if (unit.deathAlpha <= 0) this.unitManager.removeUnit(unit.id); }
  }

  private updateUnitOffsets(dt: number): void {
    for (const unit of this.unitManager.units) {
      if (unit.offsetX !== 0) { unit.offsetX -= unit.offsetX * (dt / 50); if (Math.abs(unit.offsetX) < 0.5) unit.offsetX = 0; }
      if (unit.offsetY !== 0) { unit.offsetY -= unit.offsetY * (dt / 50); if (Math.abs(unit.offsetY) < 0.5) unit.offsetY = 0; }
    }
  }

  private updateDamagePopups(dt: number): void {
    for (const p of this.damagePopups) { p.timer -= dt / 1000; p.y -= dt * 0.001; }
    this.damagePopups = this.damagePopups.filter((p) => p.timer > 0);
  }
// Game.ts Part 3 - AI Turn, Turn Logic, Input system

  private updateAITurn(dt: number): void {
    if (this.aiActions.length === 0 && !this.aiMoving && !this.aiWaitingToAttack) {
      this.aiActions = computeAIActions(this.unitManager, this.map!);
      this.aiActionIndex = 0;
      if (this.aiActions.length === 0) { this.endEnemyTurn(); return; }
    }
    if (this.aiActionIndex >= this.aiActions.length) { this.endEnemyTurn(); return; }
    const action = this.aiActions[this.aiActionIndex];
    if (!this.aiMoving && !this.aiWaitingToAttack) {
      this.aiMoving = true;
      this.aiMovePathIndex = 0;
      this.aiTimer = -600;
      if (action.movePath.length > 0) action.unit.isMoving = true;
      
      // Snap camera to the enemy immediately so the user can see them
      const ts = GameConfig.TILE_SIZE;
      const cw = GameConfig.CANVAS_WIDTH;
      const ch = GameConfig.CANVAS_HEIGHT;
      const shopW = GameConfig.SHOP_PANEL_WIDTH;
      const logW = GameConfig.COMBAT_LOG_WIDTH;
      const mapAreaW = cw - shopW - logW;
      
      const targetX = action.unit.position.x * ts - mapAreaW / 2 + ts / 2;
      const targetY = action.unit.position.y * ts - ch / 2 + ts / 2;
      const maxX = this.map!.width * ts - mapAreaW;
      const maxY = this.map!.height * ts - ch;
      
      this.camera.x = this.map!.width * ts <= mapAreaW ? (this.map!.width * ts - mapAreaW) / 2 : Math.max(0, Math.min(maxX, targetX));
      this.camera.y = this.map!.height * ts <= ch ? (this.map!.height * ts - ch) / 2 : Math.max(0, Math.min(maxY, targetY));
    }
    this.aiTimer += dt;
    const moveInterval = 1000 / GameConfig.MOVE_SPEED;
    if (this.aiMoving) {
      if (this.aiTimer >= moveInterval && action.movePath.length > 0) {
        this.aiTimer = 0;
        this.aiMovePathIndex++;
        if (this.aiMovePathIndex >= action.movePath.length) {
          action.unit.position = { ...action.targetPosition };
          action.unit.animX = action.targetPosition.x;
          action.unit.animY = action.targetPosition.y;
          action.unit.isMoving = false;
          this.aiMoving = false;
          if (action.attackTarget && !action.attackTarget.isDying) { this.aiWaitingToAttack = true; this.aiTimer = -400; }
          else { action.unit.hasActed = true; this.aiActionIndex++; }
        } else {
          const pos = action.movePath[this.aiMovePathIndex];
          action.unit.animX = pos.x;
          action.unit.animY = pos.y;
        }
      } else if (this.aiTimer >= 0 && action.movePath.length === 0) {
        this.aiMoving = false;
        if (action.attackTarget && !action.attackTarget.isDying) { this.aiWaitingToAttack = true; this.aiTimer = -400; }
        else { action.unit.hasActed = true; this.aiActionIndex++; }
      }
    } else if (this.aiWaitingToAttack && this.aiTimer >= 0) {
      this.startAICombat(action.unit, action.attackTarget!);
      action.unit.hasActed = true;
      this.aiWaitingToAttack = false;
      this.aiActionIndex++;
    }
  }

  private startAICombat(attacker: Unit, defender: Unit): void {
    const result = executeCombat(attacker, defender, this.map!);
    this.damagePopups.push({ x: defender.position.x, y: defender.position.y, text: result.damage > 0 ? `-${result.damage}` : 'MISS', timer: 1.2, color: result.damage > 0 ? '#FF4444' : '#AAAAAA' });
    if (result.isCrit) this.combatLog.addMessage(`${attacker.name} rolled 20 -> Critical Hit!`);
    else if (result.isCritFail) this.combatLog.addMessage(`${attacker.name} rolled 1 -> Critical Fail`);
    else { const hitText = result.isHit ? 'Hit' : 'Miss'; this.combatLog.addMessage(`${attacker.name} rolled ${result.attackRoll} vs CA ${result.targetAC} -> ${hitText}`); }
    if (result.isHit) {
      this.combatLog.addMessage(`${attacker.name} dealt ${result.damage} damage`);
      SoundManager.getInstance().playSound('hit');
      defender.flashTimer = 0.3;
      const dx = defender.position.x - attacker.position.x; const dy = defender.position.y - attacker.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      defender.offsetX = (dx / dist) * 12; defender.offsetY = (dy / dist) * 12;
    } else {
      SoundManager.getInstance().playSound('dodge');
      const dx = defender.position.x - attacker.position.x; const dy = defender.position.y - attacker.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      defender.offsetX = (dx / dist) * -12 + (Math.random() > 0.5 ? 8 : -8);
      defender.offsetY = (dy / dist) * -12 + (Math.random() > 0.5 ? 8 : -8);
    }
    if (result.defenderDied) { defender.isDying = true; this.combatLog.addMessage(`Ally ${defender.name} fell in combat`); }
  }

  private endEnemyTurn(): void {
    this.aiActions = []; this.aiActionIndex = 0; this.aiMoving = false; this.aiWaitingToAttack = false;
    this.unitManager.resetActed(Team.ENEMY);
    for (const u of this.unitManager.getTeamUnits(Team.ENEMY)) u.currentMP = Math.min(u.maxMP, u.currentMP + 1);
    this.turnNumber++;
    this.phase = GamePhase.PLAYER_TURN;
    this.unitManager.resetActed(Team.PLAYER);
    for (const u of this.unitManager.getTeamUnits(Team.PLAYER)) u.currentMP = Math.min(u.maxMP, u.currentMP + 1);
    this.processStatusEffects(Team.PLAYER);
    this.hud.showPhaseBanner('PLAYER TURN');
    this.checkWinLose();
  }

  private checkTurnEnd(): void {
    if (this.unitManager.allActed(Team.PLAYER) && this.phase === GamePhase.PLAYER_TURN) this.startEnemyTurn();
  }

  private startEnemyTurn(): void {
    this.selectedUnit = null; this.reachableTiles = []; this.attackableTiles = []; this.pathPreview = [];
    this.phase = GamePhase.ENEMY_TURN;
    this.processStatusEffects(Team.ENEMY);
    this.hud.showPhaseBanner('ENEMY TURN');
  }

  private processStatusEffects(team: Team): void {
    const units = this.unitManager.getTeamUnits(team);
    for (const unit of units) {
      if (unit.isDying) continue;
      for (let i = unit.statusEffects.length - 1; i >= 0; i--) {
        const effect = unit.statusEffects[i];
        if (effect.onTurnStart === 'dealDamage' && effect.damageDice) {
          const rawDamage = rollDice(effect.damageDice);
          unit.currentHP -= rawDamage;
          this.combatLog.addMessage(`${unit.name} takes ${rawDamage} ${effect.name} damage`);
          this.damagePopups.push({ x: unit.position.x, y: unit.position.y, text: `-${rawDamage}`, timer: 1.5, color: effect.effectType === 'poison' ? '#AA00AA' : '#FF0000' });
          unit.flashTimer = 0.3;
          if (unit.currentHP <= 0) { unit.currentHP = 0; unit.isDying = true; this.combatLog.addMessage(`${unit.name} succumbed to ${effect.name}`); if (unit.team === Team.ENEMY) this.enemiesDefeatedThisBattle++; }
        } else if (effect.onTurnStart === 'skipTurn') { unit.hasActed = true; this.combatLog.addMessage(`${unit.name} is ${effect.name.toLowerCase()} and cannot act`); }
        effect.duration--;
        if (effect.duration <= 0) unit.statusEffects.splice(i, 1);
      }
    }
    this.checkWinLose();
  }

  private checkWinLose(): void {
    const enemies = this.unitManager.getTeamUnits(Team.ENEMY);
    const players = this.unitManager.getTeamUnits(Team.PLAYER);
    if (enemies.length === 0) {
      SoundManager.getInstance().playMusic('victory');
      if (this.isChallengeMode) {
        this.battleResult.show(true, 0, this.enemiesDefeatedThisBattle);
        this.phase = GamePhase.BATTLE_RESULT;
        return;
      }
      const reward = this.economy.calculateReward(this.enemiesDefeatedThisBattle);
      this.economy.addGold(reward);
      const survivors = this.battleManager.processSurvivors(this.unitManager.units);
      this.unitManager.units = survivors;
      this.battleResult.show(true, reward, this.enemiesDefeatedThisBattle);
      this.phase = GamePhase.BATTLE_RESULT;
    } else if (players.length === 0) {
      SoundManager.getInstance().playMusic('defeat');
      this.battleResult.show(false, 0, 0);
      this.phase = GamePhase.BATTLE_RESULT;
    }
  }

  private setupInput(): void { window.addEventListener('keydown', (e) => this.handleInput(e)); }

  private handleInput(e: KeyboardEvent): void {
    if (this.inputCooldown > 0) return;
    this.inputCooldown = 120;
    const key = e.key;

    if (this.phase === GamePhase.HIGH_SCORES || this.phase === GamePhase.NAME_ENTRY) {
      this.highScoreScreen.handleInput(key);
      if (!this.highScoreScreen.visible) { 
        this.phase = GamePhase.MAIN_MENU; 
        this.mainMenu.reset(); 
      }
      return;
    }
    if (this.phase === GamePhase.CHALLENGE_SELECT) { this.handleChallengeSelectInput(key); return; }
    if (this.phase === GamePhase.BATTLE_RESULT) { this.handleBattleResultInput(key); return; }
    if (this.phase === GamePhase.MAIN_MENU || this.phase === GamePhase.SOUND_SETTINGS) { this.handleMainMenuInput(key); return; }
    if (this.phase === GamePhase.SHOP) { this.handleShopInput(key); return; }
    if (this.phase === GamePhase.DEPLOYMENT) { this.handleDeploymentInput(key); return; }
    if (this.phase === GamePhase.EMPTY_TILE_MENU) { this.handleEmptyTileMenuInput(key); return; }
    if (this.phase === GamePhase.MENU_OPEN) { this.handleMenuInput(key); return; }
    if (this.phase === GamePhase.SELECTING_ATTACK_TARGET) { this.handleAttackTargetInput(key); return; }
    if (this.phase === GamePhase.SELECTING_ABILITY_TARGET) { this.handleAbilityTargetInput(key); return; }
    if (this.phase === GamePhase.MOVING) { this.handleMoveInput(key); return; }
    if (this.phase === GamePhase.PLAYER_TURN) { this.handlePlayerTurnInput(key); return; }
  }

  private handleBattleResultInput(key: string): void {
    if (key !== ' ') return;
    this.battleResult.hide();
    if (this.battleResult.victory) {
      if (this.isChallengeMode) { 
        ChallengeSystem.markCompleted(this.currentChallengeId);
        this.startMainMenu(); 
        return; 
      }
      this.battleManager.advance();
      saveGame(this.unitManager, this.economy, '', this.turnNumber, this.battleManager.currentBattleNumber, this.battleManager.enemyGoldBudget, this.mapData);
      this.shopMenu.open();
      this.shopMenu.enablePurchase();
      this.phase = GamePhase.SHOP;
    } else {
      if (this.isChallengeMode) { this.startMainMenu(); return; }
      // Defeat â€” name entry for high scores
      const battles = this.battleManager.currentBattleNumber - 1;
      this.highScoreScreen.showNameEntry(battles, (name) => {
        addHighScore(name, battles);
        this.highScoreScreen.showScores();
        this.phase = GamePhase.HIGH_SCORES;
      });
      this.phase = GamePhase.NAME_ENTRY;
    }
  }

  private handleDeploymentInput(key: string): void {
    if (!this.map) return;
    switch (key) {
      case 'ArrowUp': this.cursor.move(0, -1, this.map.width, this.map.height); break;
      case 'ArrowDown': this.cursor.move(0, 1, this.map.width, this.map.height); break;
      case 'ArrowLeft': this.cursor.move(-1, 0, this.map.width, this.map.height); break;
      case 'ArrowRight': this.cursor.move(1, 0, this.map.width, this.map.height); break;
      case ' ': {
        if (this.deployIndex >= this.unitsToPlace.length) { this.finishDeployment(); break; }
        const pos = this.cursor.getPosition();
        const isValid = this.deployableTiles.some(t => t.x === pos.x && t.y === pos.y);
        if (isValid && !this.unitManager.isOccupied(pos.x, pos.y)) {
          const unit = this.unitsToPlace[this.deployIndex];
          unit.position = { ...pos }; unit.animX = pos.x; unit.animY = pos.y;
          this.deployIndex++;
          // Remove this tile from deployable
          this.deployableTiles = this.deployableTiles.filter(t => !(t.x === pos.x && t.y === pos.y));
          if (this.deployIndex >= this.unitsToPlace.length) this.finishDeployment();
        }
        break;
      }
      case 'Escape': {
        if (this.unitsToPlace.every(u => u.position.x >= 0)) this.finishDeployment();
        break;
      }
    }
  }

  private handleEmptyTileMenuInput(key: string): void {
    switch (key) {
      case 'ArrowUp': this.emptyTileMenuIndex = Math.max(0, this.emptyTileMenuIndex - 1); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowDown': this.emptyTileMenuIndex = Math.min(this.emptyTileMenuOptions.length - 1, this.emptyTileMenuIndex + 1); SoundManager.getInstance().playSound('move_cursor'); break;
      case ' ': {
        const opt = this.emptyTileMenuOptions[this.emptyTileMenuIndex];
        SoundManager.getInstance().playSound('select');
        if (opt === 'End Turn') {
          for (const u of this.unitManager.getTeamUnits(Team.PLAYER)) u.hasActed = true;
          this.phase = GamePhase.PLAYER_TURN;
          this.checkTurnEnd();
        } else if (opt === 'Save Game') {
          saveGame(this.unitManager, this.economy, '', this.turnNumber, this.battleManager.currentBattleNumber, this.battleManager.enemyGoldBudget, this.mapData);
          this.notificationRenderer.show('Game Saved!');
          this.phase = GamePhase.PLAYER_TURN;
        } else if (opt === 'Load Game') {
          this.continueSavedGame();
        } else if (opt === 'Exit') {
          this.startMainMenu();
        }
        break;
      }
      case 'Escape': this.phase = GamePhase.PLAYER_TURN; break;
    }
  }
// Game.ts Part 4 - Remaining input handlers, render

  private handlePlayerTurnInput(key: string): void {
    if (!this.map) return;
    switch (key) {
      case 'ArrowUp': this.cursor.move(0, -1, this.map.width, this.map.height); break;
      case 'ArrowDown': this.cursor.move(0, 1, this.map.width, this.map.height); break;
      case 'ArrowLeft': this.cursor.move(-1, 0, this.map.width, this.map.height); break;
      case 'ArrowRight': this.cursor.move(1, 0, this.map.width, this.map.height); break;
      case ' ': {
        const unit = this.unitManager.getUnitAt(this.cursor.getPosition());
        if (unit) {
          this.enemyInfoPanel.hide();
          if (unit.team === Team.PLAYER && !unit.hasActed) {
            this.selectedUnit = unit;
            this.isPostMoveAction = false;
            this.unitMenu.open(unit);
            this.unitMenu.options = unit.hasMoved ? ['Attack', 'Wait'] : ['Move', 'Attack', 'Wait'];
            if (unit.abilities.length > 0) {
              const idx = unit.hasMoved ? 1 : 2;
              this.unitMenu.options.splice(idx, 0, 'Ability');
            }
            this.phase = GamePhase.MENU_OPEN;
          } else if (unit.team === Team.ENEMY) {
            this.enemyInfoPanel.show(unit);
          }
        } else {
          // Empty tile â€” open empty tile menu
          this.emptyTileMenuIndex = 0;
          this.phase = GamePhase.EMPTY_TILE_MENU;
        }
        break;
      }
      case 'Escape': this.enemyInfoPanel.hide(); break;
    }
  }

  private handleMainMenuInput(key: string): void {
    const isSound = this.phase === GamePhase.SOUND_SETTINGS;
    switch (key) {
      case 'ArrowUp': this.mainMenu.moveSelection(-1, isSound); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowDown': this.mainMenu.moveSelection(1, isSound); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowLeft': if (isSound) { this.mainMenu.adjustVolume(-10); SoundManager.getInstance().playSound('move_cursor'); } break;
      case 'ArrowRight': if (isSound) { this.mainMenu.adjustVolume(10); SoundManager.getInstance().playSound('move_cursor'); } break;
      case ' ': {
        SoundManager.getInstance().playSound('select');
        const option = this.mainMenu.getSelected(isSound);
        if (isSound) { if (option === 'Back') this.phase = GamePhase.MAIN_MENU; }
        else {
          if (option === 'New Game') this.startNewCampaign();
          else if (option === 'Continue') this.continueSavedGame();
          else if (option === 'Challenges') {
            this.challengeSelectScreen.reset();
            this.phase = GamePhase.CHALLENGE_SELECT;
          }
          else if (option === 'High Scores') { this.highScoreScreen.showScores(); this.phase = GamePhase.HIGH_SCORES; }
          else if (option === 'Sound Settings') { this.phase = GamePhase.SOUND_SETTINGS; this.mainMenu.reset(); }
        }
        break;
      }
      case 'Escape': if (isSound) this.phase = GamePhase.MAIN_MENU; break;
    }
  }

  private handleChallengeSelectInput(key: string): void {
    switch (key) {
      case 'ArrowUp': this.challengeSelectScreen.moveSelection(-1); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowDown': this.challengeSelectScreen.moveSelection(1); SoundManager.getInstance().playSound('move_cursor'); break;
      case ' ': {
        SoundManager.getInstance().playSound('select');
        const selectedId = this.challengeSelectScreen.getSelected();
        if (selectedId === 'Back') {
           this.phase = GamePhase.MAIN_MENU;
        } else if (selectedId) {
           this.isChallengeMode = true;
           this.unitManager = new UnitManager();
           resetUnitIdCounter();
           this.economy = new EconomySystem(0);
           this.battleManager = new BattleManager();
           const challenge = CHALLENGES.find(c => c.id === selectedId);
           if (challenge) {
             this.loadMap(`/assets/maps/${challenge.fileName}`, challenge.id).catch((e) => {
               console.error('Failed to load challenge map:', e);
               this.notificationRenderer.show('Challenge map not found');
               this.startMainMenu();
             });
           }
        }
        break;
      }
      case 'Escape': this.phase = GamePhase.MAIN_MENU; break;
    }
  }

  private handleMenuInput(key: string): void {
    switch (key) {
      case 'ArrowUp': this.unitMenu.moveSelection(-1); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowDown': this.unitMenu.moveSelection(1); SoundManager.getInstance().playSound('move_cursor'); break;
      case ' ': {
        const option = this.unitMenu.getSelected();
        this.unitMenu.close();
        this.executeMenuOption(option);
        break;
      }
      case 'Escape': {
        this.unitMenu.close();
        // Movement bug fix: if post-move, consume the turn
        if (this.isPostMoveAction && this.selectedUnit) {
          this.selectedUnit.hasActed = true;
          this.isPostMoveAction = false;
        }
        this.selectedUnit = null;
        this.phase = GamePhase.PLAYER_TURN;
        this.checkTurnEnd();
        break;
      }
    }
  }

  private executeMenuOption(option: MenuOption): void {
    if (!this.selectedUnit) return;
    switch (option) {
      case 'Move': {
        if (!this.map) return;
        SoundManager.getInstance().playSound('select');
        this.reachableTiles = getReachableTiles(this.selectedUnit.position.x, this.selectedUnit.position.y, this.selectedUnit.movementRange, this.map, this.unitManager, this.selectedUnit.id, this.selectedUnit.team, this.selectedUnit.passives || []);
        this.phase = GamePhase.MOVING;
        break;
      }
      case 'Attack': this.showAttackRange(); break;
      case 'Ability': { this.selectedAbilityId = this.selectedUnit.abilities[0]; this.showAbilityRange(); break; }
      case 'Wait': {
        SoundManager.getInstance().playSound('select');
        this.selectedUnit.hasActed = true;
        this.selectedUnit = null;
        this.isPostMoveAction = false;
        this.phase = GamePhase.PLAYER_TURN;
        this.checkTurnEnd();
        break;
      }
    }
  }

  private handleMoveInput(key: string): void {
    if (!this.map) return;
    switch (key) {
      case 'ArrowUp': this.cursor.move(0, -1, this.map.width, this.map.height); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowDown': this.cursor.move(0, 1, this.map.width, this.map.height); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowLeft': this.cursor.move(-1, 0, this.map.width, this.map.height); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowRight': this.cursor.move(1, 0, this.map.width, this.map.height); SoundManager.getInstance().playSound('move_cursor'); break;
      case ' ': {
        const pos = this.cursor.getPosition();
        const isReachable = this.reachableTiles.some((t) => t.x === pos.x && t.y === pos.y);
        if (isReachable && this.selectedUnit) {
          const path = findPath(this.selectedUnit.position, pos, this.map, this.unitManager, this.selectedUnit.id, this.selectedUnit.team, this.selectedUnit.passives || []);
          if (path.length > 0) {
            this.movePath = path; this.movePathIndex = 0; this.moveTimer = 0;
            this.selectedUnit.isMoving = true; this.reachableTiles = []; this.pathPreview = [];
            this.phase = GamePhase.ANIMATION;
          }
        }
        break;
      }
      case 'Escape': this.reachableTiles = []; this.pathPreview = []; this.selectedUnit = null; this.phase = GamePhase.PLAYER_TURN; break;
    }
    if (this.selectedUnit && this.phase === GamePhase.MOVING && this.map) {
      const pos = this.cursor.getPosition();
      const isReachable = this.reachableTiles.some((t) => t.x === pos.x && t.y === pos.y);
      if (isReachable) this.pathPreview = findPath(this.selectedUnit.position, pos, this.map, this.unitManager, this.selectedUnit.id, this.selectedUnit.team, this.selectedUnit.passives || []);
      else this.pathPreview = [];
    }
  }

  private handleAttackTargetInput(key: string): void {
    switch (key) {
      case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': {
        const curPos = this.cursor.getPosition();
        const curIdx = this.attackableTiles.findIndex((t) => t.x === curPos.x && t.y === curPos.y);
        let newIdx = (key === 'ArrowRight' || key === 'ArrowDown') ? (curIdx + 1) % this.attackableTiles.length : (curIdx - 1 + this.attackableTiles.length) % this.attackableTiles.length;
        this.cursor.setPosition(this.attackableTiles[newIdx].x, this.attackableTiles[newIdx].y);
        SoundManager.getInstance().playSound('move_cursor');
        break;
      }
      case ' ': {
        const pos = this.cursor.getPosition();
        const target = this.unitManager.getUnitAt(pos);
        if (target && this.selectedUnit && target.team !== this.selectedUnit.team) {
          this.startCombat(this.selectedUnit, target); this.selectedUnit = null; this.attackableTiles = [];
        }
        break;
      }
      case 'Escape': {
        this.attackableTiles = [];
        if (this.isPostMoveAction && this.selectedUnit) { this.unitMenu.open(this.selectedUnit); this.phase = GamePhase.MENU_OPEN; }
        else { this.selectedUnit = null; this.phase = GamePhase.PLAYER_TURN; }
        break;
      }
    }
  }

  private handleAbilityTargetInput(key: string): void {
    switch (key) {
      case 'ArrowUp': case 'ArrowDown': case 'ArrowLeft': case 'ArrowRight': {
        const curPos = this.cursor.getPosition();
        const curIdx = this.attackableTiles.findIndex((t) => t.x === curPos.x && t.y === curPos.y);
        let newIdx = (key === 'ArrowRight' || key === 'ArrowDown') ? (curIdx + 1) % this.attackableTiles.length : (curIdx - 1 + this.attackableTiles.length) % this.attackableTiles.length;
        this.cursor.setPosition(this.attackableTiles[newIdx].x, this.attackableTiles[newIdx].y);
        SoundManager.getInstance().playSound('move_cursor');
        break;
      }
      case ' ': {
        const pos = this.cursor.getPosition();
        const target = this.unitManager.getUnitAt(pos);
        if (target && this.selectedUnit && this.selectedAbilityId) {
          this.selectedUnit.flashTimer = 0.3; target.flashTimer = 0.3;
          this.phase = GamePhase.ANIMATION;
          this.finalizeAbility(this.selectedUnit, target, this.selectedAbilityId);
          this.selectedUnit = null; this.selectedAbilityId = null; this.attackableTiles = [];
        }
        break;
      }
      case 'Escape': {
        this.attackableTiles = []; this.selectedAbilityId = null;
        if (this.isPostMoveAction && this.selectedUnit) { this.unitMenu.open(this.selectedUnit); this.phase = GamePhase.MENU_OPEN; }
        else { this.selectedUnit = null; this.phase = GamePhase.PLAYER_TURN; }
        break;
      }
    }
  }

  private handleShopInput(key: string): void {
    switch (key) {
      case 'ArrowUp': this.shopMenu.moveSelection(-1); SoundManager.getInstance().playSound('move_cursor'); break;
      case 'ArrowDown': this.shopMenu.moveSelection(1); SoundManager.getInstance().playSound('move_cursor'); break;
      case ' ': {
        const item = this.shopMenu.getSelected();
        if (this.economy.spend(item.cost)) {
          SoundManager.getInstance().playSound('shop_buy');
          const spawn = this.findFreeSpawn();
          const newUnit = createUnit(item.id, Team.PLAYER, spawn);
          this.unitManager.addUnit(newUnit);
          this.shopMenu.showMessage(`Recruited ${item.name}!`);
        } else { this.shopMenu.showMessage('Not enough gold!'); }
        break;
      }
      case 'Escape': {
        this.shopMenu.close();
        if (this.unitManager.getTeamUnits(Team.PLAYER).length === 0) { this.shopMenu.showMessage("Recruit at least one unit!"); this.shopMenu.open(); return; }
        if (this.isChallengeMode) this.startDeployment();
        else this.generateNewMap();
        break;
      }
    }
  }

  private findFreeSpawn(): Position {
    if (!this.map) return { x: 0, y: 0 };
    for (const sp of this.map.playerSpawns) { if (!this.unitManager.isOccupied(sp.x, sp.y)) return sp; }
    for (let y = 0; y < this.map.height; y++) {
      for (let x = 0; x < this.map.width; x++) {
        if (this.map.isPassable(x, y) && !this.unitManager.isOccupied(x, y)) return { x, y };
      }
    }
    return { x: 0, y: 0 };
  }
// Game.ts Part 5 - Render

  private render(time: number): void {
    const ctx = this.ctx;
    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, cw, ch);

    if (this.phase === GamePhase.MAIN_MENU || this.phase === GamePhase.SOUND_SETTINGS) {
      this.mainMenu.render(ctx, this.phase === GamePhase.SOUND_SETTINGS);
      return;
    }

    if (this.phase === GamePhase.CHALLENGE_SELECT) {
      this.challengeSelectScreen.render(ctx);
      return;
    }

    if (this.phase === GamePhase.HIGH_SCORES || this.phase === GamePhase.NAME_ENTRY) {
      this.highScoreScreen.render(ctx);
      return;
    }

    // If no map loaded (shop phase before first battle), render shop centered
    if (!this.map) {
      this.shopMenu.render(ctx, this.economy);
      return;
    }

    // â”€â”€â”€ 3-Panel Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    const shopW = GameConfig.SHOP_PANEL_WIDTH;
    const logW = GameConfig.COMBAT_LOG_WIDTH;
    const mapAreaW = cw - shopW - logW;
    const mapAreaX = shopW;

    // Camera
    if (this.phase === GamePhase.ENEMY_TURN && this.aiActions.length > 0 && this.aiActionIndex < this.aiActions.length) {
      const action = this.aiActions[this.aiActionIndex];
      if (this.aiWaitingToAttack && action.attackTarget) this.camera.follow(action.attackTarget.position.x, action.attackTarget.position.y, this.map.width, this.map.height, mapAreaW, ch);
      else this.camera.follow(action.unit.animX, action.unit.animY, this.map.width, this.map.height, mapAreaW, ch);
    } else {
      this.camera.follow(this.cursor.x, this.cursor.y, this.map.width, this.map.height, mapAreaW, ch);
    }

    const camX = this.camera.x;
    const camY = this.camera.y;

    // â”€â”€â”€ Draw map area (clipped to center panel) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    ctx.save();
    ctx.beginPath();
    ctx.rect(mapAreaX, 0, mapAreaW, ch);
    ctx.clip();
    ctx.translate(mapAreaX, 0);

    this.mapRenderer.render(this.map, camX, camY, mapAreaW, ch);

    // Highlights
    if (this.reachableTiles.length > 0) this.mapRenderer.renderHighlights(this.reachableTiles, GameConfig.COLORS.MOVE_HIGHLIGHT, camX, camY);
    if (this.attackableTiles.length > 0) this.mapRenderer.renderHighlights(this.attackableTiles, GameConfig.COLORS.ATTACK_HIGHLIGHT, camX, camY);

    // Deployment highlights
    if (this.phase === GamePhase.DEPLOYMENT && this.deployableTiles.length > 0) {
      this.mapRenderer.renderHighlights(this.deployableTiles, GameConfig.COLORS.DEPLOY_HIGHLIGHT, camX, camY);
    }

    // Path preview
    if (this.pathPreview.length > 1) this.mapRenderer.renderPath(this.pathPreview, camX, camY);

    // Units
    this.unitRenderer.render(this.unitManager.units, camX, camY, time);

    // Cursor
    this.cursor.render(ctx, camX, camY);

    // Damage popups
    this.renderDamagePopups(camX, camY);

    ctx.restore(); // Unclip

    // â”€â”€â”€ Left Panel: Shop â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.shopMenu.renderPanel(ctx, this.economy, shopW, ch);

    // â”€â”€â”€ Right Panel: Combat Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.combatLog.renderPanel(ctx, time, cw, logW, ch);

    // â”€â”€â”€ HUD (over map area) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    this.hud.render(this.phase, this.turnNumber, this.economy, this.unitManager, this.cursor.x, this.cursor.y, this.map, this.battleManager.currentBattleNumber, mapAreaX, mapAreaW);

    // Notifications
    this.notificationRenderer.render(ctx);

    // Enemy Info
    this.enemyInfoPanel.render(ctx);

    // Unit menu (full screen overlay)
    this.unitMenu.render(ctx);

    // Deployment info
    if (this.phase === GamePhase.DEPLOYMENT) {
      this.renderDeploymentInfo(ctx, mapAreaX, mapAreaW);
    }

    // Empty tile menu
    if (this.phase === GamePhase.EMPTY_TILE_MENU) {
      this.renderEmptyTileMenu(ctx);
    }

    // Battle result (full screen overlay)
    this.battleResult.render(ctx);

    // Shop overlay (when in shop phase with no map)
    if (this.phase === GamePhase.SHOP && !this.map) {
      this.shopMenu.render(ctx, this.economy);
    }
  }

  private renderDeploymentInfo(ctx: CanvasRenderingContext2D, offsetX: number, areaW: number): void {
    const centerX = offsetX + areaW / 2;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(offsetX, GameConfig.CANVAS_HEIGHT - 80, areaW, 50);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    if (this.deployIndex < this.unitsToPlace.length) {
      const unit = this.unitsToPlace[this.deployIndex];
      ctx.fillText(`Place ${unit.name} (${this.deployIndex + 1}/${this.unitsToPlace.length}) â€” SPACE to place`, centerX, GameConfig.CANVAS_HEIGHT - 52);
    } else {
      ctx.fillText('All units placed! Press SPACE or ESC to start battle', centerX, GameConfig.CANVAS_HEIGHT - 52);
    }
  }

  private renderEmptyTileMenu(ctx: CanvasRenderingContext2D): void {
    const cw = GameConfig.CANVAS_WIDTH;
    const ch = GameConfig.CANVAS_HEIGHT;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, cw, ch);

    const pw = 260;
    const ph = 200;
    const px = (cw - pw) / 2;
    const py = (ch - ph) / 2;

    ctx.fillStyle = 'rgba(20, 25, 40, 0.98)';
    ctx.strokeStyle = '#5577AA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#AABBCC';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('MENU', px + pw / 2, py + 28);

    for (let i = 0; i < this.emptyTileMenuOptions.length; i++) {
      const oy = py + 55 + i * 36;
      const isSelected = i === this.emptyTileMenuIndex;
      if (isSelected) {
        ctx.fillStyle = 'rgba(80, 130, 220, 0.4)';
        ctx.beginPath();
        ctx.roundRect(px + 20, oy - 12, pw - 40, 30, 6);
        ctx.fill();
      }
      ctx.fillStyle = isSelected ? '#FFFFFF' : '#8899AA';
      ctx.font = isSelected ? 'bold 16px monospace' : '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.emptyTileMenuOptions[i], px + pw / 2, oy + 8);
    }
  }

  private renderDamagePopups(camX: number, camY: number): void {
    const ts = GameConfig.TILE_SIZE;
    for (const p of this.damagePopups) {
      const sx = p.x * ts + ts / 2 - camX;
      const sy = p.y * ts - camY - 10;
      this.ctx.save();
      this.ctx.globalAlpha = Math.min(1, p.timer);
      this.ctx.fillStyle = p.color;
      this.ctx.font = 'bold 20px monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(p.text, sx, sy);
      this.ctx.restore();
    }
  }
}
