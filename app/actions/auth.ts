"use server";

import { signIn, signOut } from "@/app/lib/server/auth";

export async function signInWithKakao() {
  await signIn("kakao", { redirectTo: "/create" });
}

export async function signInDev() {
  await signIn("dev-login", { redirectTo: "/create" });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
