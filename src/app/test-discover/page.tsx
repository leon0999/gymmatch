'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function TestDiscoverPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    setCurrentStep(message);
  };

  useEffect(() => {
    testLoadMatches();
  }, []);

  const testLoadMatches = async () => {
    try {
      addLog('🚀 Starting test...');

      // Step 1: Get user
      addLog('👤 Step 1: Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        addLog('❌ User error: ' + userError.message);
        setError('User error: ' + userError.message);
        return;
      }

      if (!user) {
        addLog('❌ No user found');
        setError('No user found');
        return;
      }

      addLog('✅ User found: ' + user.id);

      // Step 2: Get profile
      addLog('📋 Step 2: Fetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        addLog('❌ Profile error: ' + profileError.message);
        setError('Profile error: ' + profileError.message);
        return;
      }

      if (!profile) {
        addLog('❌ No profile found');
        setError('No profile found');
        return;
      }

      addLog('✅ Profile loaded: ' + profile.name);
      addLog(`   - Age: ${profile.age}`);
      addLog(`   - Gender: ${profile.gender}`);
      addLog(`   - Location: ${profile.location_name}`);

      // Step 3: Get liked users
      addLog('💚 Step 3: Fetching liked users...');
      const { data: likedUsers, error: likedError } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', user.id);

      if (likedError) {
        addLog('❌ Liked users error: ' + likedError.message);
        setError('Liked users error: ' + likedError.message);
        return;
      }

      addLog('✅ Liked users: ' + (likedUsers?.length || 0));

      // Step 4: Get all profiles
      addLog('👥 Step 4: Fetching all other profiles...');
      const { data: allProfiles, error: matchError } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user.id)
        .limit(50);

      if (matchError) {
        addLog('❌ Profiles error: ' + matchError.message);
        setError('Profiles error: ' + matchError.message);
        return;
      }

      addLog('✅ All profiles: ' + (allProfiles?.length || 0));

      if (!allProfiles || allProfiles.length === 0) {
        addLog('⚠️ No other profiles found in database');
        setError('No other profiles found');
        return;
      }

      // Step 5: Filter profiles
      addLog('🔍 Step 5: Filtering profiles...');
      const likedUserIds = new Set((likedUsers || []).map(s => s.to_user_id));

      const filtered = allProfiles.filter(match => {
        if (likedUserIds.has(match.user_id)) {
          addLog(`   - Skipping ${match.name} (already liked)`);
          return false;
        }
        return true;
      });

      addLog('✅ Filtered profiles: ' + filtered.length);

      if (filtered.length === 0) {
        addLog('⚠️ No profiles after filtering');
        setError('All profiles already liked');
        return;
      }

      // Step 6: Calculate scores (simple test)
      addLog('🔢 Step 6: Testing score calculation...');

      filtered.forEach((match, index) => {
        let score = 0;

        // Same today's workout focus
        if (profile.today_workout_focus && match.today_workout_focus &&
            profile.today_workout_focus === match.today_workout_focus) {
          score += 50;
        }

        // Same fitness level
        if (profile.fitness_level === match.fitness_level) {
          score += 10;
        }

        addLog(`   [${index + 1}] ${match.name}: ${score} points`);
      });

      addLog('✅ Score calculation complete!');
      addLog('🎉 ALL TESTS PASSED!');

    } catch (err: any) {
      addLog('❌ EXCEPTION: ' + err.message);
      setError('Exception: ' + err.message);
      console.error('Test error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Discover Page Test</h1>
          <button
            onClick={() => router.push('/discover')}
            className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600"
          >
            Go to Real Discover
          </button>
        </div>

        {/* Current Step */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border-2 border-emerald-500">
          <div className="text-sm text-gray-400 mb-1">Current Step:</div>
          <div className="text-lg font-semibold">{currentStep || 'Waiting...'}</div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border-2 border-red-500 rounded-lg">
            <div className="text-sm text-red-400 mb-1">Error:</div>
            <div className="text-lg font-semibold text-red-300">{error}</div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <div className="text-sm text-gray-400 mb-3">Execution Log:</div>
          <div className="space-y-1 font-mono text-sm max-h-[600px] overflow-y-auto">
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet...</div>
            )}
            {logs.map((log, index) => (
              <div
                key={index}
                className={`
                  ${log.includes('❌') ? 'text-red-400' : ''}
                  ${log.includes('✅') ? 'text-emerald-400' : ''}
                  ${log.includes('⚠️') ? 'text-yellow-400' : ''}
                  ${log.includes('🎉') ? 'text-purple-400 font-bold' : ''}
                  ${!log.includes('❌') && !log.includes('✅') && !log.includes('⚠️') && !log.includes('🎉') ? 'text-gray-300' : ''}
                `}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => {
              setLogs([]);
              setError(null);
              setCurrentStep('');
              testLoadMatches();
            }}
            className="flex-1 px-6 py-3 bg-emerald-500 rounded-lg hover:bg-emerald-600 font-semibold"
          >
            🔄 Rerun Test
          </button>
          <button
            onClick={() => {
              setLogs([]);
              setError(null);
              setCurrentStep('');
            }}
            className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-semibold"
          >
            Clear Logs
          </button>
        </div>
      </div>
    </div>
  );
}
