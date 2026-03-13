// ============================================================
// Firebase 設定檔
// ============================================================
// 請把下面的值換成你自己的 Firebase 專案金鑰
// 取得方式：Firebase Console → 專案設定 → 一般 → 您的應用程式 → Firebase SDK snippet
// ============================================================

import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYo65Z2UYCJevCoRLRddi_LcbQug4cJ2U",
  authDomain: "orderdot-tea-detective.firebaseapp.com",
  projectId: "orderdot-tea-detective",
  storageBucket: "orderdot-tea-detective.firebasestorage.app",
  messagingSenderId: "790418473649",
  appId: "1:790418473649:web:8f6ac0a3e083aaa1495890"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- 存檔/讀檔工具（給大管家 GP 使用）---
const DOC_REF = doc(db, "appData", "main");

export async function loadAll() {
  try {
    const snap = await getDoc(DOC_REF);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (e) {
    console.error("讀取 Firebase 失敗", e);
  }
  return null;
}

export async function saveAll(data) {
  try {
    await setDoc(DOC_REF, data);
  } catch (e) {
    console.error("寫入 Firebase 失敗", e);
  }
}

export async function deleteAll() {
  try {
    // 寫入空物件來重置（比刪除文件再重建更簡單）
    await setDoc(DOC_REF, {});
  } catch (e) {
    console.error("清除 Firebase 失敗", e);
  }
}
