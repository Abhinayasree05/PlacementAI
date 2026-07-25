import { useState } from "react";
import { motion } from "framer-motion";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Save } from "lucide-react";
import { friendlyAuthError } from "../../lib/authActions";

export default function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [college, setCollege] = useState(profile?.college || "");
  const [department, setDepartment] = useState(profile?.department || "");
  const [year, setYear] = useState(profile?.year || "");
  const [rollNumber, setRollNumber] = useState(profile?.rollNumber || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!firebaseUser) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);
    try {
      await updateDoc(doc(db, "users", firebaseUser.uid), { college, department, year, rollNumber });
      if (profile) setAuth(firebaseUser, { ...profile, college, department, year, rollNumber });
      setSaved(true);
    } catch (err) {
      setSaveError(friendlyAuthError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-3xl font-bold text-ink">Profile</h1>
      <p className="mb-6 text-sm text-graytext">Manage your student details.</p>

      <div className="rounded-2xl border border-border bg-white p-6">
        <div className="mb-6 flex items-center gap-4">
          {profile?.photoURL || firebaseUser?.photoURL ? (
            <img
              src={profile?.photoURL || firebaseUser?.photoURL || ""}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-white">
              {(profile?.fullName || firebaseUser?.displayName || "S").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-lg font-bold text-ink">{profile?.fullName || firebaseUser?.displayName}</p>
            <p className="text-sm text-graytext">{profile?.email || firebaseUser?.email}</p>
            <p className="text-xs text-graytext">{profile?.phoneNumber || firebaseUser?.phoneNumber || "No phone on file"}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input label="College" value={college} onChange={(e) => setCollege(e.target.value)} />
          <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
          <Input label="Year" value={year} onChange={(e) => setYear(e.target.value)} />
          <Input label="Roll Number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
        </div>

        {saveError && (
          <div className="mt-4 rounded-xl border border-primary-light bg-primary-light px-4 py-2.5 text-sm text-primary">
            {saveError}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button
  fullWidth
  onClick={handleSave}
  loading={saving}
  icon={<Save className="h-4 w-4" />}
>
  Save Changes
</Button>
          {saved && (
  <span className="text-sm font-medium text-success">
    Changes saved successfully ✓
  </span>
)}
          
        </div>
      </div>
    </motion.div>
  );
}
