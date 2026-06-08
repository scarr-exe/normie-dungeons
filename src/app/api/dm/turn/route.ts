import { NextRequest, NextResponse } from "next/server";
import { askDM } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const {
    action,
    player,
    allPlayers,
    dungeonName,
    roomNumber,
    totalRooms,
    messageHistory,
  } = await req.json();

  const diceRoll = Math.floor(Math.random() * 20) + 1;
  const modifier = getModifier(action, player.stats);
  const total = diceRoll + modifier.value;

  const isLastRoom = roomNumber >= totalRooms;
  const historyText = messageHistory
    .slice(-6)
    .map((m: { type: string; content: string; username?: string }) =>
      m.type === "player_action"
        ? `${m.username}: ${m.content}`
        : `DM: ${m.content}`,
    )
    .join("\n");

  const actionCount = messageHistory.filter(
    (m: { type: string }) => m.type === "player_action",
  ).length;

  const prompt = `You are the Dungeon Master of Normie Dungeons, a D&D-style dungeon crawler.

DUNGEON: ${dungeonName}
ROOM: ${roomNumber} of ${totalRooms}${isLastRoom ? " (FINAL BOSS ROOM)" : ""}
ACTIONS TAKEN THIS ROOM: ${actionCount}

ACTIVE PLAYER:
- ${player.username} playing Normie #${player.normieId}
- Class: ${player.characterClass}
- HP: ${player.hp}/${player.maxHp}
- Stats: STR ${player.stats.str}, DEX ${player.stats.dex}, CON ${player.stats.con}, INT ${player.stats.int}, WIS ${player.stats.wis}, CHA ${player.stats.cha}
${player.hasScarredPassive ? "- Passive: Scarred (bonus damage on crits)" : ""}

${
  allPlayers.length > 1
    ? `PARTY:\n${allPlayers
        .filter((p: { userId: string }) => p.userId !== player.userId)
        .map(
          (p: {
            username: string;
            characterClass: string;
            hp: number;
            maxHp: number;
          }) => `- ${p.username} (${p.characterClass}) HP: ${p.hp}/${p.maxHp}`,
        )
        .join("\n")}`
    : ""
}

RECENT EVENTS:
${historyText || "The adventure just began."}

PLAYER ACTION: "${action}"
DICE ROLL: ${diceRoll}/20 (${modifier.stat} modifier: ${modifier.value >= 0 ? "+" : ""}${modifier.value}, total: ${total})

DIFFICULTY GUIDELINES — IMPORTANT:
- This game is meant to be fun and completable. Be generous.
- A roll of 10+ should generally succeed with minor complications at most.
- A roll of 15+ should succeed cleanly and feel rewarding.
- After 2-3 player actions in a room, seriously consider marking roomCleared: true.
- Players should feel powerful and heroic, not constantly thwarted.
- If the player has been in this room for ${actionCount} actions already, it is time to let them advance.
${actionCount >= 2 ? "- PRIORITY: This room should be cleared on a reasonable action. Set roomCleared: true." : ""}

NARRATION STYLE — IMPORTANT:
- Match the tone and setting of the dungeon: "${dungeonName}". 
- Do NOT use generic fantasy tropes like "shadows close in", "darkness seethes", or "the void" unless the dungeon is literally a shadow/void dungeon.
- Reference the actual environment, enemies, and atmosphere specific to this dungeon.
- Keep narration vivid, specific, and varied. Reference the dice roll naturally without stating the number robotically.
- 2-3 sentences maximum.

${isLastRoom ? "This is the FINAL BOSS ROOM. Make the encounter climactic. A good action should defeat the boss (roomCleared: true, dungeonComplete: true)." : ""}
${total >= 18 ? "Critical success — something exceptional happens. Mark roomCleared: true." : total >= 15 ? "Strong success — the player handles the situation well." : total >= 10 ? "Partial success — progress is made." : total >= 6 ? "Failure — minor setback but the story continues." : "Critical failure — something goes humorously or dramatically wrong, but the player is not stuck."}

Respond in this exact JSON format:
{
  "narration": "2-3 sentences narrating the outcome in the style of this specific dungeon.",
  "hpChange": 0,
  "roomCleared": false,
  "playerDefeated": false,
  "dungeonComplete": false
}

Rules:
- hpChange: negative for damage (-2 to -5 max), positive for healing (0 to +3). Only deal damage on critical failures or boss fights.
- roomCleared: true when the current threat is resolved. Be generous — allow it after 2-3 good actions.
- playerDefeated: only true if hp drops to 0 from repeated failures. Almost never.
- dungeonComplete: true only on boss room clear.
- Never break character. Never reference JSON or game mechanics directly.`;

  try {
    const raw = await askDM(prompt, 400);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      narration: result.narration,
      hpChange: result.hpChange || 0,
      roomCleared: result.roomCleared || false,
      playerDefeated: result.playerDefeated || false,
      dungeonComplete: result.dungeonComplete || false,
      diceRoll,
      modifier: modifier.value,
      total,
      stat: modifier.stat,
    });
  } catch (error) {
    console.error("DM turn error:", error);
    return NextResponse.json({
      narration: "The dungeon shifts around you, momentarily disorienting...",
      hpChange: 0,
      roomCleared: false,
      playerDefeated: false,
      dungeonComplete: false,
      diceRoll,
      modifier: modifier.value,
      total,
      stat: modifier.stat,
    });
  }
}

function getModifier(action: string, stats: Record<string, number>) {
  const lower = action.toLowerCase();
  if (lower.match(/attack|hit|strike|fight|charge|sword|axe|stab/))
    return { stat: "STR", value: Math.floor((stats.str - 10) / 2) };
  if (lower.match(/sneak|dodge|run|hide|steal|pick|lock|dash/))
    return { stat: "DEX", value: Math.floor((stats.dex - 10) / 2) };
  if (lower.match(/endure|resist|push|force|break|tank/))
    return { stat: "CON", value: Math.floor((stats.con - 10) / 2) };
  if (lower.match(/spell|magic|cast|puzzle|read|decipher|analyze/))
    return { stat: "INT", value: Math.floor((stats.int - 10) / 2) };
  if (lower.match(/search|detect|notice|listen|trap|sense|scout/))
    return { stat: "WIS", value: Math.floor((stats.wis - 10) / 2) };
  if (lower.match(/persuade|charm|talk|convince|intimidate|bluff|negotiate/))
    return { stat: "CHA", value: Math.floor((stats.cha - 10) / 2) };
  return { stat: "WIS", value: Math.floor((stats.wis - 10) / 2) };
}
