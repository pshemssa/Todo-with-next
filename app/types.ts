export interface StickyNote {
  id: string;
  text: string;
  dueDate?: string;
  completed: boolean;
  x: number;
  y: number;
  z: number;
  color: string;
  userEmail: string; // Add user email to associate with Firebase user
  createdAt?: any; // Firestore timestamp
}