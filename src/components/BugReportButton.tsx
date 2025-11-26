'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';
import { supabase } from '@/lib/supabase';

export default function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const captureScreenshot = async (): Promise<string | null> => {
    try {
      // Hide the bug report modal before capturing
      const modal = document.getElementById('bug-report-modal');
      if (modal) modal.style.display = 'none';

      // Capture screenshot with improved options
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 0.5, // Reduce size for faster upload
        backgroundColor: '#ffffff', // Fallback background
        ignoreElements: (element) => {
          // Skip elements that might have unsupported CSS
          const style = window.getComputedStyle(element);
          const color = style.color || '';
          const bgColor = style.backgroundColor || '';

          // Skip if using oklab, oklch, or other modern color functions
          if (color.includes('oklab') || color.includes('oklch') ||
              bgColor.includes('oklab') || bgColor.includes('oklch')) {
            return true;
          }
          return false;
        },
      });

      // Show modal again
      if (modal) modal.style.display = 'block';

      // Convert to blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.7);
      });
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      // Return null but don't throw - allow bug report to continue
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      alert('버그 설명을 입력해주세요!');
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Capture screenshot
      const screenshot = await captureScreenshot();

      // Upload screenshot to Supabase Storage (if exists)
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const timestamp = Date.now();
        const fileName = `bug-report-${timestamp}.jpg`;

        const base64Data = screenshot.split(',')[1];
        const binaryData = atob(base64Data);
        const arrayBuffer = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          arrayBuffer[i] = binaryData.charCodeAt(i);
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('bug-reports')
          .upload(fileName, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('Screenshot upload failed:', uploadError);
          // Continue without screenshot - don't block bug report
        } else if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('bug-reports')
            .getPublicUrl(uploadData.path);
          screenshotUrl = publicUrl;
          console.log('Screenshot uploaded:', publicUrl);
        }
      }

      // Get browser info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        timestamp: new Date().toISOString(),
      };

      // Insert bug report
      const { error: insertError } = await supabase
        .from('bug_reports')
        .insert({
          user_id: user?.id || null,
          description: description.trim(),
          page_url: window.location.href,
          screenshot_url: screenshotUrl,
          browser_info: browserInfo,
          user_agent: navigator.userAgent,
          status: 'new',
          priority: 'medium',
        });

      if (insertError) throw insertError;

      // Success!
      setShowSuccess(true);
      setDescription('');
      setTimeout(() => {
        setIsOpen(false);
        setShowSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Bug report submission failed:', error);
      alert('버그 리포트 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Bug Report Button - Fixed Position */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110"
        aria-label="Report Bug"
      >
        🐛
      </button>

      {/* Bug Report Modal */}
      {isOpen && (
        <div
          id="bug-report-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            {showSuccess ? (
              // Success Message
              <div className="text-center py-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  전송 완료!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  버그 리포트가 성공적으로 전송되었습니다.
                  <br />
                  빠르게 확인하고 수정하겠습니다!
                </p>
              </div>
            ) : (
              // Bug Report Form
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🐛 버그 리포트
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  발견하신 버그를 자세히 설명해주세요.
                  <br />
                  스크린샷과 함께 자동으로 전송됩니다.
                </p>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="예: 매칭 페이지에서 좋아요 버튼을 누르면 아무 반응이 없어요."
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  disabled={isSubmitting}
                />

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    disabled={isSubmitting}
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !description.trim()}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? '전송 중...' : '전송하기'}
                  </button>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  💡 자동으로 현재 페이지, 브라우저 정보, 스크린샷이 포함됩니다.
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
