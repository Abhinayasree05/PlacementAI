import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  setPersistence,
  type ConfirmationResult,
} from "firebase/auth";

import { doc, setDoc, getDoc } from "firebase/firestore";

import {
  auth,
  db,
  googleProvider,
  browserLocalPersistence,
  browserSessionPersistence,
} from "./firebase";

import type { SignupFormValues } from "../schemas/authSchemas";
import type { UserProfile, AuthProvider } from "../types/user";


// Error handling

export function friendlyAuthError(err: unknown): string {

  const code = (err as {code?:string})?.code ?? "";


  const map: Record<string,string> = {

    "auth/email-already-in-use":
      "An account already exists with this email.",

    "auth/invalid-email":
      "Invalid email address.",

    "auth/user-not-found":
      "User not found.",

    "auth/wrong-password":
      "Wrong password.",

    "auth/invalid-credential":
      "Invalid credentials.",


    "auth/invalid-verification-code":
      "Invalid OTP.",

    "auth/code-expired":
      "OTP expired. Send again.",

    "auth/invalid-phone-number":
      "Invalid phone number.",

    "auth/quota-exceeded":
      "Too many OTP attempts.",

    "auth/operation-not-allowed":
      "Enable this provider in Firebase Authentication.",

    "auth/unauthorized-domain":
      "Add this domain in Firebase authorized domains.",


    "auth/network-request-failed":
      "Network error.",

  };


  return map[code] ||
    "Something went wrong. Try again.";

}




// Firestore User Profile

export async function upsertUserProfile(
  uid:string,
  data:Partial<UserProfile> & {provider:AuthProvider}
){

  const ref = doc(db,"users",uid);

  const existing = await getDoc(ref);


  if(!existing.exists()){

    await setDoc(ref,{

      uid,

      fullName:data.fullName || "",

      email:data.email || null,

      phoneNumber:data.phoneNumber || null,

      photoURL:data.photoURL || null,

      provider:data.provider,

      college:data.college || "",

      department:data.department || "",

      year:data.year || "",

      rollNumber:data.rollNumber || "",

      gender:data.gender || "",


      createdAt:new Date().toISOString(),

      lastLoginAt:new Date().toISOString(),


      codingScore:0,

      resumeAtsScore:0,

      interviewScore:0,

      aptitudeScore:0,

    });

  }

  else{

    await setDoc(

      ref,

      {
        lastLoginAt:new Date().toISOString()
      },

      {
        merge:true
      }

    );

  }

}



async function upsertUserProfileSafely(
 uid:string,
 data:Partial<UserProfile> & {provider:AuthProvider}
){

  try{

    await upsertUserProfile(uid,data);

  }

  catch(error){

    console.log(
      "Firestore profile error",
      error
    );

  }

}
// Fetch User Profile

export async function fetchUserProfile(
  uid:string
):Promise<UserProfile|null>{

  const snap = await getDoc(
    doc(db,"users",uid)
  );

  return snap.exists()
    ? snap.data() as UserProfile
    : null;

}



// Email Signup

export async function signUpWithEmail(
  values:SignupFormValues,
  photoURL:string|null
){

  const cred =
    await createUserWithEmailAndPassword(
      auth,
      values.email,
      values.password
    );


  await updateProfile(
    cred.user,
    {
      displayName:values.fullName,
      photoURL:photoURL ?? undefined
    }
  );


  await upsertUserProfileSafely(
    cred.user.uid,
    {

      fullName:values.fullName,

      email:values.email,

      phoneNumber:values.phoneNumber,

      photoURL,

      provider:"password",

      college:values.college,

      department:values.department,

      year:values.year,

      rollNumber:values.rollNumber,

      gender:values.gender,

    }
  );


  return cred.user;

}





// Email Login

export async function loginWithEmail(
  email:string,
  password:string,
  rememberMe:boolean
){

  await setPersistence(
    auth,
    rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence
  );


  const cred =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );


  await upsertUserProfileSafely(
    cred.user.uid,
    {

      fullName:
        cred.user.displayName || "",

      email:
        cred.user.email,

      provider:"password"

    }
  );


  return cred.user;

}





// Google Login
export async function loginWithGoogle() {

  console.log("Step 1: Opening Google popup");

  const cred = await signInWithPopup(
    auth,
    googleProvider
  );

  console.log("Step 2: Google login successful");
  console.log(cred.user);

  await upsertUserProfileSafely(
    cred.user.uid,
    {
      fullName: cred.user.displayName || "",
      email: cred.user.email,
      phoneNumber: cred.user.phoneNumber,
      photoURL: cred.user.photoURL,
      provider: "google.com"
    }
  );

  console.log("Step 3: Firestore completed");

  return cred.user;
}







// ============================
// PHONE AUTH OTP
// ============================


export function createRecaptchaVerifier(
  containerId:string
){

  return new RecaptchaVerifier(
    auth,
    containerId,
    {
      size:"invisible"
    }
  );

}



export async function sendPhoneOtp(
  phoneNumber:string,
  verifier:RecaptchaVerifier
):Promise<ConfirmationResult>{


  const formattedNumber =
    phoneNumber.startsWith("+")
      ? phoneNumber
      : `+91${phoneNumber}`;



  const result =
    await signInWithPhoneNumber(
      auth,
      formattedNumber,
      verifier
    );


  return result;

}



// ============================
// CONFIRM PHONE OTP
// ============================

export async function confirmPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
  fullName?: string
){

  const cred =
    await confirmation.confirm(code);


  await upsertUserProfileSafely(
    cred.user.uid,
    {

      fullName:
        fullName || "",

      phoneNumber:
        cred.user.phoneNumber,

      provider:
        "phone"

    }
  );


  return cred.user;

}



// ============================
// FORGOT PASSWORD
// ============================

export async function requestPasswordReset(
  email:string
){

  await sendPasswordResetEmail(
    auth,
    email,
    {
      url:
      `${window.location.origin}/login`
    }
  );

}



// ============================
// VERIFY RESET PASSWORD CODE
// ============================

export async function verifyResetCode(
  oobCode:string
){

  return await verifyPasswordResetCode(
    auth,
    oobCode
  );

}



// ============================
// COMPLETE PASSWORD RESET
// ============================

export async function completePasswordReset(
  oobCode:string,
  newPassword:string
){

  await confirmPasswordReset(
    auth,
    oobCode,
    newPassword
  );

}