
export const printPdfBlob = async (blob: Blob): Promise<void> => {
  const url = URL.createObjectURL(blob);

  // Detect mobile to use fallback (iframe print often fails or is blocked on mobile)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60000); // Long timeout for mobile return
    return;
  }

  // Desktop: Hidden Iframe injection
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.error("Print error:", e);
      // Fallback if iframe access fails (e.g. cross-origin issues, though unlikely with blob)
      window.open(url, '_blank');
    }
  };

  // Cleanup
  setTimeout(() => {
    try {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    } catch (e) {
      // Ignore cleanup errors
    }
  }, 60000); // 1 minute to allow print dialog interaction
};
