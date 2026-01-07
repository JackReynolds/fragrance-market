import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";

const ADMIN_UID = "LLnA54zGzgTGnGtkQSIQy9svcTJ2";

export async function GET(request) {
  try {
    // Verify admin authentication
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    if (decoded.uid !== ADMIN_UID) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch all profiles (users), sorted by newest first
    const profilesSnapshot = await db
      .collection("profiles")
      .orderBy("createdAt", "desc")
      .get();

    const users = [];
    profilesSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return NextResponse.json({ users, count: users.length });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
