'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Camera, Upload, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  user1?: { name: string; photo_url?: string; };
  user2?: { name: string; photo_url?: string; };
}

export default function PhotoSessionPage({ params }: { params: { matchId: string } }) {
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [partner, setPartner] = useState<{ id: string; name: string; photo_url?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [form, setForm] = useState({
    workoutType: '' as any,
    exerciseName: '',
    caption: '',
  });

  useEffect(() => {
    loadMatch();
  }, [params.matchId]);

  const loadMatch = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }

      // Get match details
      const { data: matchData, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(name, photo_url),
          user2:profiles!matches_user2_id_fkey(name, photo_url)
        `)
        .eq('id', params.matchId)
        .single();

      if (error || !matchData) {
        alert('Match not found');
        router.push('/matches');
        return;
      }

      setMatch(matchData);

      // Determine partner (the person we're photographing)
      const partnerId = matchData.user1_id === user.id ? matchData.user2_id : matchData.user1_id;
      const partnerData = matchData.user1_id === user.id ? matchData.user2 : matchData.user1;

      setPartner({
        id: partnerId,
        name: partnerData?.name || 'Partner',
        photo_url: partnerData?.photo_url,
      });
    } catch (error) {
      console.error('Failed to load match:', error);
      alert('Failed to load match');
      router.push('/matches');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('Please select an image or video file');
      return;
    }

    // Validate file size (50MB for videos, 10MB for images)
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert(`File too large. Max size: ${file.type.startsWith('video/') ? '50MB' : '10MB'}`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !partner) return;

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const bucket = selectedFile.type.startsWith('video/') ? 'workout-videos' : 'workout-photos';

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from(bucket)
        .upload(fileName, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        alert('Failed to upload file: ' + uploadError.message);
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      // Create thumbnail URL for videos (use first frame or poster)
      const thumbnailUrl = selectedFile.type.startsWith('video/') ? urlData.publicUrl : null;

      // Create post via API
      const res = await fetch('/api/posts/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: partner.id,
          photographerId: user.id,
          matchId: params.matchId,
          mediaType: selectedFile.type.startsWith('video/') ? 'video' : 'photo',
          mediaUrl: urlData.publicUrl,
          thumbnailUrl,
          workoutType: form.workoutType || null,
          exerciseName: form.exerciseName || null,
          caption: form.caption || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert('Photo uploaded successfully!');
        router.push('/feed');
      } else {
        alert('Failed to create post: ' + data.error);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">
            Photograph {partner?.name}
          </h1>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Uploading...' : 'Share'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {/* File Upload Area */}
        {!selectedFile ? (
          <label className="block w-full aspect-square bg-white rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 cursor-pointer transition-colors">
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
              <Camera className="w-16 h-16 text-gray-400" />
              <div className="text-center">
                <p className="text-lg font-medium text-gray-700 mb-1">
                  Take or Upload Photo/Video
                </p>
                <p className="text-sm text-gray-500">
                  Max 10MB for photos, 50MB for videos
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span className="text-sm font-medium">Camera</span>
                <span className="text-gray-400">or</span>
                <Upload className="w-5 h-5" />
                <span className="text-sm font-medium">Gallery</span>
              </div>
            </div>
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Preview */}
            <div className="relative w-full aspect-square bg-black rounded-lg overflow-hidden">
              {selectedFile.type.startsWith('video/') ? (
                <video
                  src={previewUrl!}
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <img
                  src={previewUrl!}
                  alt="Preview"
                  className="w-full h-full object-contain"
                />
              )}
              <button
                onClick={handleClearFile}
                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg p-4 space-y-4">
              {/* Workout Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workout Type (Optional)
                </label>
                <select
                  value={form.workoutType}
                  onChange={(e) => setForm({ ...form, workoutType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select workout type</option>
                  <option value="chest">Chest</option>
                  <option value="back">Back</option>
                  <option value="legs">Legs</option>
                  <option value="shoulders">Shoulders</option>
                  <option value="arms">Arms</option>
                  <option value="core">Core</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>

              {/* Exercise Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exercise Name (Optional)
                </label>
                <input
                  type="text"
                  value={form.exerciseName}
                  onChange={(e) => setForm({ ...form, exerciseName: e.target.value })}
                  placeholder="e.g., Bench Press, Squats"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption (Optional)
                </label>
                <textarea
                  value={form.caption}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                  placeholder="Add a caption..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
