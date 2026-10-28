import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { User, UserRole } from './types';

// Initialize primary Firebase App
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connectivity validation constraint (Skill requirement)
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified successfully.');
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration. Client is offline.');
    }
  }
}

// Error handling constraint (Skill requirement)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Administrative Creation of Authorized Professor Account
 * Uses an isolated secondary Firebase App instance so the administrator's
 * current active session is never logged out.
 * Immediately issues a password setup email to the professor so no plain text passwords
 * are stored or exposed.
 */
export async function adminCreateProfessorAccount(teacherData: {
  name: string;
  email: string;
  role: UserRole;
  registration?: string;
  department?: string;
  cpf?: string;
  phone?: string;
  title?: string;
  titulation?: string;
  formation?: string;
  bio?: string;
  officeHours?: string;
  lattesUrl?: string;
}): Promise<{ success: boolean; uid?: string; message: string }> {
  const trimmedEmail = teacherData.email.trim().toLowerCase();
  
  // Create a temporary randomized strong password for provisioning
  const tempPassword = 'Temp#' + Math.random().toString(36).slice(-8) + '!' + Date.now();
  const secondaryAppName = 'SecondaryAuth_' + Date.now();
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, trimmedEmail, tempPassword);
    const newUid = cred.user.uid;

    // Send the password setup / reset email directly to the professor's authorized email
    try {
      await sendPasswordResetEmail(secondaryAuth, trimmedEmail);
    } catch (resetErr) {
      console.warn('Could not dispatch password reset email automatically:', resetErr);
    }

    // Provision the user document in Firestore
    const userDocRef = doc(db, 'users', newUid);
    const newProfile: Partial<User> & { authorized: boolean; status: string; createdAt: string } = {
      id: newUid,
      name: teacherData.name.trim(),
      email: trimmedEmail,
      cpf: teacherData.cpf?.trim() || '000.000.000-00',
      registration: teacherData.registration?.trim() || `DOC-${Date.now().toString().slice(-4)}`,
      role: teacherData.role || 'professor',
      department: teacherData.department?.trim() || 'Corpo Docente',
      phone: teacherData.phone?.trim() || '',
      title: teacherData.title || 'Prof.',
      titulation: teacherData.titulation || 'Graduação',
      formation: teacherData.formation || '',
      bio: teacherData.bio || '',
      officeHours: teacherData.officeHours || '',
      lattesUrl: teacherData.lattesUrl || '',
      authorized: true,
      status: 'Ativo',
      createdAt: new Date().toISOString()
    };

    await setDoc(userDocRef, newProfile);

    await signOut(secondaryAuth);
    await deleteApp(secondaryApp);

    return {
      success: true,
      uid: newUid,
      message: `Professor ${teacherData.name} cadastrado com sucesso! Foi enviado um e-mail para ${trimmedEmail} com o link seguro para definição de senha.`
    };
  } catch (err: unknown) {
    try {
      await deleteApp(secondaryApp);
    } catch {
      // ignore
    }
    const message = err instanceof Error ? err.message : 'Erro ao criar conta do professor.';
    if (message.includes('auth/email-already-in-use')) {
      return {
        success: false,
        message: 'Este e-mail já está cadastrado no sistema.'
      };
    }
    return {
      success: false,
      message
    };
  }
}

/**
 * Changes authenticated user password with reauthentication
 */
export async function changeUserPassword(currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> {
  if (!auth.currentUser || !auth.currentUser.email) {
    return { success: false, message: 'Usuário não autenticado.' };
  }

  try {
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPass);
    await reauthenticateWithCredential(auth.currentUser, credential);
    await updatePassword(auth.currentUser, newPass);
    return { success: true, message: 'Senha atualizada com sucesso!' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Falha ao atualizar senha.';
    if (errorMsg.includes('auth/wrong-password') || errorMsg.includes('auth/invalid-credential')) {
      return { success: false, message: 'A senha atual informada está incorreta.' };
    }
    return { success: false, message: errorMsg };
  }
}

/**
 * Password Recovery via Email
 */
export async function sendPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return {
      success: true,
      message: 'Instruções para redefinição de senha foram enviadas para o seu e-mail.'
    };
  } catch (err: unknown) {
    console.warn('Password reset request error:', err);
    // As per user spec, friendly message
    return {
      success: true, // Do not expose email enumeration
      message: 'Se o e-mail estiver cadastrado e autorizado, você receberá um link para redefinir sua senha.'
    };
  }
}

// Automatically test connection on module load
testConnection();
