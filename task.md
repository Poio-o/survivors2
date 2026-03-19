Phase 20: UI Layout, Deployment, Maps, Save & Game Systems
UI Layout Redesign

 Reorganize UI layout into 3 panels:

Shop (left)

Map (center)

Combat Log (right)

 Update Game.ts to calculate map width using left and right panel widths

 Position ShopMenu.ts on the left side

 Position CombatLog.ts on the right side

 Ensure the map renderer resizes dynamically to fill the center
S
 Adjust UI scaling to remove empty space and distribute panels evenly

 Display current battle number on the HUD

Shop Behavior

 Keep ShopMenu.ts always visible

 Lock shop purchases during battles

 Allow buying units only before battle start

 Update shop UI to show:

unit battle sprite

cost

stats

abilities

 Display ability name and description if the unit has abilities

Deployment Phase

 Add new game state DEPLOYMENT_PHASE

 Allow player to place units before battle starts

 Define deployment tiles (first map columns)

 Highlight deployment tiles in blue

 Allow repositioning units freely during deployment

 Lock unit positions when deployment ends

Empty Tile Menu (Space Key)

 Detect when space is pressed on empty tile

 Open Action Menu

 Add options:

Pass Turn

Save Game

Load Game

Exit to Menu

 Implement pass turn logic (all player units wait)

Fix Unit Movement Bugs

 Ensure unit movement is cancelled when exiting unit menu

 Reset selected unit when menu closes

 Prevent moving the same unit twice

Enemy Spawn Fix

 Prevent enemies spawning on occupied tiles

 Update SpawnSystem.ts to check tile occupancy

 Ensure spawn positions are validated before placing units

Portrait Display Fix

 Move large unit portrait outside the menu panel

 Display portrait next to the menu instead of inside

 Prevent portrait squashing when menu resizes

Phase 21: Combat Attribute System
Attack Stat Scaling

 Implement attack scaling rule:

Every 2 attack = +1 damage

 Update damage calculation in CombatSystem.ts

Defense Stat Scaling

 Base Armor Class = 8

 Every 2 defense = +1 AC

 Update hit calculation using new AC rule

MP System

 Add maxMP and currentMP to unit type

 Display MP in:

HUD

Unit Menu

 Ensure MP persists between turns

 Allow MP consumption for abilities

Phase 22: Procedural Map Improvements
Random Map Size

 Add configurable values in GameConfig.ts:

MAP_MIN_WIDTH

MAP_MAX_WIDTH

MAP_MIN_HEIGHT

MAP_MAX_HEIGHT

 Generate random width/height for each battle

 Ensure map renderer supports dynamic sizes

Terrain Cluster Generation

 Improve MapGenerator.ts to generate clusters

 Increase spawn rate for:

water

rock

 Prevent isolated terrain tiles

 Implement cluster expansion algorithm (BFS style)

 Ensure terrain clusters look natural

Forest Terrain Update

 Remove evasion bonus from forest

 Replace with defense bonus

 Update TerrainDatabase.ts

Phase 23: Challenge Maps (Custom Maps)
Rename Mode

 Rename Custom Mode → Desafíos

Challenge Map Structure

 Update JSON maps to include:

player spawn positions

enemy spawn positions

predefined player units

predefined enemy units

Challenge Gameplay Rules

 Disable economy system in challenge mode

 Disable shop during challenge maps

 Display Victory Screen when challenge ends

 Return to main menu after victory

Challenge Completion Tracking

 Add challenge completion save data

 Display star icon next to completed maps

 Persist completion using SaveSystem.ts

Phase 24: Passive Abilities
Flying Ability

 Add Flying passive ability

 Allow units with Flying to move over:

water

rock

 Ignore terrain movement restrictions

Aquatic Ability

 Add Aquatic passive ability

 Allow movement through water

 Apply bonuses when standing on water:

+2 attack
+2 defense
Phase 25: Sound System Expansion
Organize Sound Assets

 Organize files inside assets/sounds/

 Separate folders:

sounds/
 ├ battle_music
 ├ ui
 ├ combat
 └ ambient
Battle Music System

 Update SoundManager.ts

 Play random battle track when battle starts

 Prevent repeating the previous track

 Ensure music stops when battle ends

Event Sound Effects

 Add sounds for:

attack

damage

dodge

menu navigation

unit death

victory

Phase 26: High Score System
Score Tracking

 Track score when player loses

 Score calculation based on:

battles survived

gold collected

Name Entry

 Allow player to enter their name

 Save score entry

Scoreboard

 Add new Main Menu option: High Scores

 Display top 10 scores

 Save scores using localStorage

Phase 27: Save & Continue System
Save Game

 Save game state including:

player units

gold

battle number

map seed

Load Game

 Add Continue option in Main Menu

 Load saved data if present

 Resume campaign loop

Save Menu Option

 Allow saving mid-battle from empty tile menu