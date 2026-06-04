import { WebSocketServer, WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { ROOM_WS_PORT } from "./constants";

export type RoomGame = "flashquiz" | "rolengamos";

export interface RoomState {
  code: string;
  game: RoomGame;
  hostId: string;
  players: { id: string; name: string }[];
  payload: Record<string, unknown>;
  updatedAt: number;
}

const rooms = new Map<string, RoomState>();
const clientRoom = new Map<WebSocket, { roomCode: string; playerId: string }>();

let wss: WebSocketServer | null = null;

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  if (rooms.has(code)) return generateCode();
  return code;
}

function broadcast(roomCode: string, message: object, except?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const [ws, meta] of clientRoom) {
    if (meta.roomCode === roomCode && ws !== except && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

export function startRoomServer() {
  if (wss) return;
  wss = new WebSocketServer({ host: "0.0.0.0", port: ROOM_WS_PORT });

  wss.on("connection", (ws) => {
    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as {
          type: string;
          roomCode?: string;
          game?: RoomGame;
          playerName?: string;
          playerId?: string;
          payload?: Record<string, unknown>;
        };

        if (msg.type === "room:create") {
          const code = generateCode();
          const hostId = msg.playerId || uuidv4();
          const room: RoomState = {
            code,
            game: msg.game || "rolengamos",
            hostId,
            players: [{ id: hostId, name: msg.playerName || "Hôte" }],
            payload: msg.payload || {},
            updatedAt: Date.now(),
          };
          rooms.set(code, room);
          clientRoom.set(ws, { roomCode: code, playerId: hostId });
          ws.send(JSON.stringify({ type: "room:created", room }));
          return;
        }

        if (msg.type === "room:join" && msg.roomCode) {
          const room = rooms.get(msg.roomCode.toUpperCase());
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Salon introuvable" }));
            return;
          }
          const pid = msg.playerId || uuidv4();
          if (!room.players.find((p) => p.id === pid)) {
            room.players.push({ id: pid, name: msg.playerName || "Joueur" });
          }
          room.updatedAt = Date.now();
          clientRoom.set(ws, { roomCode: room.code, playerId: pid });
          ws.send(JSON.stringify({ type: "room:joined", room }));
          broadcast(room.code, { type: "room:update", room });
          return;
        }

        if (msg.type === "room:sync" && msg.roomCode) {
          const room = rooms.get(msg.roomCode.toUpperCase());
          if (!room) return;
          room.payload = { ...room.payload, ...msg.payload };
          room.updatedAt = Date.now();
          broadcast(room.code, { type: "room:sync", room });
          return;
        }

        if (msg.type === "room:get" && msg.roomCode) {
          const room = rooms.get(msg.roomCode.toUpperCase());
          ws.send(JSON.stringify({ type: room ? "room:state" : "error", room, message: room ? undefined : "Salon introuvable" }));
        }
      } catch {
        ws.send(JSON.stringify({ type: "error", message: "Message invalide" }));
      }
    });

    ws.on("close", () => {
      clientRoom.delete(ws);
    });
  });
}

export function stopRoomServer() {
  wss?.close();
  wss = null;
  rooms.clear();
  clientRoom.clear();
}

export function getRoomServerInfo() {
  return { port: ROOM_WS_PORT, activeRooms: rooms.size };
}