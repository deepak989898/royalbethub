import * as admin from "firebase-admin";
import { getAdminDb, getFirebaseAdminApp, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import { ApiError, handleRouteError, jsonError, jsonOk } from "@/lib/roulette/api-auth";
import { payoutForBet, pickMinPayoutNumber } from "@/lib/roulette/engine";
import type { BetForEngine } from "@/lib/roulette/engine";
import type { BetType } from "@/lib/roulette/types";
import { ROULETTE_STATE_DOC } from "@/lib/roulette/paths";
import type { RouletteStateDoc } from "@/lib/roulette/server-state";

interface BetDoc {
  userId: string;
  type: BetType;
  selection: number | null;
  selectionStr: string | null;
  amount: number;
}

export async function POST() {
  try {
    if (!isFirebaseAdminConfigured()) {
      return jsonError(503, "Server wallet not configured.");
    }
    getFirebaseAdminApp();
    const db = getAdminDb();
    const stateRef = db.collection("roulette_state").doc(ROULETTE_STATE_DOC);

    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) {
      return jsonError(503, "Game not initialized");
    }
    const st0 = stateSnap.data() as RouletteStateDoc;
    if (st0.phase === "result") {
      return jsonOk({
        already: true,
        winningNumber: st0.winningNumber,
        roundId: st0.roundId,
      });
    }
    if (st0.phase !== "betting") {
      return jsonError(409, "Invalid phase");
    }
    if (!st0.endsAt || st0.endsAt.toMillis() > Date.now() + 800) {
      return jsonError(409, "Round still in progress");
    }

    const roundId = st0.roundId;
    const betsSnap = await db.collection("roulette_bets").where("roundId", "==", roundId).get();
    const bets: BetDoc[] = betsSnap.docs.map((d) => {
      const x = d.data();
      return {
        userId: x.userId as string,
        type: x.type as BetType,
        selection: x.selection as number | null,
        selectionStr:
          x.selectionStr != null && String(x.selectionStr).length > 0
            ? String(x.selectionStr)
            : null,
        amount: Number(x.amount) || 0,
      };
    });

    const engineBets: BetForEngine[] = bets.map((b) => ({
      type: b.type,
      selection: b.selection ?? undefined,
      selectionStr: b.selectionStr ?? undefined,
      amount: b.amount,
    }));

    let winning: number;
    if (
      st0.rtpMode === "manual" &&
      st0.manualNextNumber != null &&
      st0.manualNextNumber >= 0 &&
      st0.manualNextNumber <= 36
    ) {
      winning = st0.manualNextNumber;
    } else {
      winning = pickMinPayoutNumber(engineBets);
    }

    const payoutsByUser = new Map<string, number>();
    let totalStakes = 0;
    for (const b of bets) {
      totalStakes += b.amount;
      const pay = payoutForBet(winning, {
        type: b.type,
        selection: b.selection ?? undefined,
        selectionStr: b.selectionStr ?? undefined,
        amount: b.amount,
      });
      if (pay > 0) {
        payoutsByUser.set(b.userId, (payoutsByUser.get(b.userId) || 0) + pay);
      }
    }
    const totalPaidOut = [...payoutsByUser.values()].reduce((a, b) => a + b, 0);

    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(stateRef);
      const st = fresh.data() as RouletteStateDoc;
      if (st.phase !== "betting" || st.roundId !== roundId) {
        return;
      }
      if (!st.endsAt || st.endsAt.toMillis() > Date.now() + 800) {
        throw new ApiError(409, "Round still in progress");
      }

      const userIds = [...new Set(payoutsByUser.keys())];
      const userReads = await Promise.all(
        userIds.map((uid) => tx.get(db.collection("roulette_users").doc(uid)))
      );
      const balanceMap = new Map<string, number>();
      userReads.forEach((snap, i) => {
        const uid = userIds[i]!;
        const bal = snap.exists ? Number(snap.data()?.balance) || 0 : 0;
        balanceMap.set(uid, bal);
      });

      for (const [uid, pay] of payoutsByUser) {
        const cur = balanceMap.get(uid) ?? 0;
        const ref = db.collection("roulette_users").doc(uid);
        tx.update(ref, { balance: cur + pay });
      }

      const prev = st.recentResults ?? [];
      const recent = [winning, ...prev].slice(0, 14);
      const prevProfit = Number(st.totalHouseProfit) || 0;

      tx.update(stateRef, {
        phase: "result",
        winningNumber: winning,
        resultShownUntil: admin.firestore.Timestamp.fromMillis(Date.now() + 7000),
        manualNextNumber: null,
        recentResults: recent,
        totalHouseProfit: prevProfit + (totalStakes - totalPaidOut),
      });
    });

    const finalSnap = await stateRef.get();
    const d = finalSnap.data() as RouletteStateDoc;
    return jsonOk({
      winningNumber: d.winningNumber ?? winning,
      roundId: d.roundId,
    });
  } catch (e) {
    if (e instanceof ApiError) {
      return jsonError(e.status, e.message);
    }
    return handleRouteError(e);
  }
}
