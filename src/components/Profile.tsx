import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import type { NavigateFn } from "../types";

interface ProfileProps {
  session: any;
  navigate: NavigateFn;
}

const Profile = ({ session, navigate }: ProfileProps) => {
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setUsername(data.username || "");
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Pilih gambar terlebih dahulu.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload ke Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Ambil Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update table profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
          updated_at: new Date(),
        })
        .eq("id", session.user.id);

      if (updateError) {
        console.error("Gagal update profile:", updateError);
      }

      setAvatarUrl(publicUrl);
      alert("Foto profil berhasil diubah!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUploading(false);
    }
  }

  const handleDeleteAvatar = async () => {
    if (!avatarUrl) return;

    try {
      setLoading(true);

      const fileName = avatarUrl.split("/").pop();

      if (fileName) {
        await supabase.storage.from("avatars").remove([fileName]);
      }

      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", session.user.id);

      if (error) throw error;

      setAvatarUrl(null);
      alert("Foto profil berhasil dihapus!");
    } catch (err: any) {
      alert("Gagal hapus foto: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="p-10 text-center">Loading profile...</div>;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-(--cl-surface) border border-(--cl-border) rounded-2xl shadow-sm">
      <h2 className="text-xl font-bold text-(--cl-text) mb-6">Edit Profile</h2>

      <div className="flex flex-col items-center gap-6">
        <div className="relative group">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-(--cl-surface-2) border-4 border-(--cl-border) shadow-md">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-(--cl-text-muted) font-bold text-2xl uppercase">
                {username?.charAt(0) || "U"}
              </div>
            )}
          </div>

          <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-(--cl-text-muted) opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
            <span className="text-xs font-semibold">
              {uploading ? "..." : "Ubah"}
            </span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={uploadAvatar}
              disabled={uploading}
            />
          </label>
        </div>

        {/* TOMBOL HAPUS */}
        {avatarUrl && (
          <button
            onClick={handleDeleteAvatar}
            className="text-xs bg-red-600 border border-red-700 text-white px-3 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Hapus
          </button>
        )}

        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-semibold text-(--cl-text) mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              disabled
              className="w-full p-3 bg-(--cl-surface-2) border border-(--cl-border) rounded-xl text-(--cl-text) text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-(--cl-text) mb-1.5">
              Email
            </label>
            <input
              type="text"
              value={session.user.email}
              disabled
              className="w-full p-3 bg-(--cl-surface-2) border border-(--cl-border) rounded-xl text-(--cl-text) text-sm"
            />
          </div>
        </div>

        <button
          onClick={() => navigate("dashboard")}
          className="w-full py-3 bg-(--cl-primary) text-white rounded-xl font-bold hover:bg-(--cl-primary-hover) transition"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;
